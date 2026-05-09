# Phase 3 — Booking & Payments

**Timeline:** Weeks 8–10  
**Goal:** A pet parent can request a booking, a sitter can accept or decline, payment is collected, and the sitter receives their payout 48 hours after completion. The entire money flow works end-to-end.

---

## What Gets Built

- Booking request flow (parent side)
- Sitter accept/decline with 2-hour timeout
- Razorpay payment integration (UPI + card)
- Cancellation policy and refund logic
- Sitter payout via Razorpay Transfers (48hrs post-completion)
- Booking dashboards for parent and sitter
- Push notifications (browser Web Push) for all booking events
- Email confirmations for all booking events

---

## User Flows

### Parent Booking Flow

```
Sitter profile → "Request a Booking"
→ Select service: Drop-in 1hr / 2hr / 4hr
→ Select date (calendar) + start time
→ Select which pet(s) this booking is for
→ Add notes to sitter (optional)
→ Review behavioral profile warning (if pet has bite history)
→ Booking summary: sitter name, date/time, duration, total price
→ "Send Request" → Booking created (PENDING)
→ "Waiting for sitter to confirm..."
→ On sitter acceptance → payment page
→ UPI or card payment via Razorpay Checkout
→ Payment success → "Booking Confirmed" confirmation page
→ Booking appears in parent dashboard
```

### Sitter Accept/Decline Flow

```
Sitter receives notification: "New booking request from [Parent]"
→ Opens booking request in dashboard
→ Sees: date, time, duration, pet details, parent notes, behavioral profile
→ Accept or Decline (with optional decline note)
→ On Accept: parent notified → payment triggered
→ On Decline: parent notified, alternative sitters suggested
→ Timeout (2hrs no response): auto-cancelled, parent notified
```

### Cancellation Flow

```
Parent → Bookings → Cancel booking
→ System shows applicable refund policy:
   - >24hrs before: "You'll receive a full refund"
   - 6–24hrs: "You'll receive 50% refund"
   - <6hrs: "No refund applicable"
→ Confirm cancellation
→ Refund initiated via Razorpay (where applicable)
→ Both parties notified
```

---

## Detailed Task Breakdown

### 1. Booking Request API

**Route:** `POST /api/bookings`

**Request body:**
```typescript
{
  sitterId: string
  serviceType: "DROP_IN_1HR" | "DROP_IN_2HR" | "DROP_IN_4HR"
  date: string          // YYYY-MM-DD
  startTime: string     // "14:00"
  petIds: string[]      // One or more pet IDs
  notesToSitter?: string
}
```

**Server-side logic:**
1. Validate sitter is APPROVED and active
2. Validate date is in the future
3. Check sitter availability for the date/time (no double booking)
4. Compute `endTime` based on `serviceType`
5. Compute `totalAmount`, `platformFee`, `sitterEarnings`
6. Set `sitterResponseDeadline = now + 2 hours`
7. Create `Booking` record (status: PENDING)
8. Create `BookingPet` records for each pet
9. Notify sitter (browser push + email)
10. Schedule timeout job (see below)

**Acceptance criteria:**
- Given a parent sends a booking request, when it's created, then status is PENDING and sitterResponseDeadline is set
- Given a sitter already has a confirmed booking that overlaps the requested time, when the request is submitted, then it's rejected with "Sitter unavailable for this time"
- Prices are computed server-side; client-submitted prices are ignored

---

### 2. Booking Timeout (2-Hour Auto-Cancel)

Since Next.js doesn't have native cron jobs, use a Supabase Edge Function scheduled to run every 15 minutes:

```typescript
// Check for expired booking requests every 15 minutes
// supabase/functions/expire-bookings/index.ts

const expiredBookings = await prisma.booking.findMany({
  where: {
    status: "PENDING",
    sitterResponseDeadline: { lt: new Date() }
  }
})

for (const booking of expiredBookings) {
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", autoExpiredAt: new Date() }
  })
  // Notify parent: alternative sitters
  // No charge — payment was not collected yet
}
```

**Acceptance criteria:**
- Given a sitter does not respond within 2 hours, when the timeout runs, then booking status → CANCELLED and parent is notified
- Given the timeout runs, when the parent is notified, then the notification includes 3 alternative sitter suggestions nearby

---

### 3. Sitter Accept/Decline

**Routes:**
- `PATCH /api/bookings/[id]/accept`
- `PATCH /api/bookings/[id]/decline`

**Accept logic:**
1. Verify booking is still PENDING (not timed out)
2. Verify request is from the correct sitter
3. Update `booking.status → CONFIRMED`
4. Create Razorpay order (`razorpay.orders.create`)
5. Store `razorpayOrderId` on booking
6. Notify parent with payment link

**Decline logic:**
1. Update `booking.status → CANCELLED`
2. Store decline reason (optional)
3. Notify parent with alternative sitter suggestions

**Acceptance criteria:**
- Given a booking is PENDING, when sitter accepts, then status → CONFIRMED and parent is prompted to pay
- Given a booking has already timed out, when sitter tries to accept, then they see "This request has expired"
- Given a sitter declines, when parent is notified, then they see 3 nearby alternative sitters

---

### 4. Razorpay Payment Integration

**Implementation:**

```typescript
// 1. Create order on server (on sitter accept)
// src/app/api/payments/create-order/route.ts
const order = await razorpay.orders.create({
  amount: booking.totalAmount,  // in paise
  currency: "INR",
  receipt: booking.id,
  notes: {
    bookingId: booking.id,
    parentId: booking.parentId,
    sitterId: booking.sitterId,
  }
})

// 2. Load Razorpay Checkout on client
// src/components/payment/RazorpayCheckout.tsx
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: booking.totalAmount,
  currency: "INR",
  order_id: razorpayOrderId,
  name: "PetPeep",
  description: `Pet sitting — ${serviceType}`,
  prefill: {
    name: parentName,
    email: parentEmail,
  },
  theme: { color: "#005a71" },  // Caring Teal
  handler: async (response) => {
    // Verify payment on server
    await verifyPayment(response)
  }
}
const rzp = new window.Razorpay(options)
rzp.open()

// 3. Verify payment signature on server
// src/app/api/payments/verify/route.ts
const generated_signature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest("hex")

if (generated_signature !== razorpaySignature) {
  // Payment verification failed
  throw new Error("Invalid payment signature")
}

// Update booking paidAt
await prisma.booking.update({
  where: { id: bookingId },
  data: {
    razorpayPaymentId,
    paidAt: new Date(),
    status: "CONFIRMED"
  }
})
```

**Acceptance criteria:**
- Given a payment fails, when the parent retries, then no duplicate Razorpay order is created
- Given a payment is made, when the webhook fires, then booking `paidAt` is set and status is confirmed
- Razorpay webhook endpoint is secured with signature verification

---

### 5. Cancellation & Refund Logic

**Refund policy (server-side, based on time to visit):**

```typescript
function getCancellationPolicy(booking: Booking): {
  policy: CancellationPolicy
  refundAmount: number
} {
  const hoursUntilVisit = differenceInHours(
    new Date(`${booking.date}T${booking.startTime}`),
    new Date()
  )

  if (hoursUntilVisit > 24) {
    return { policy: "FULL_REFUND", refundAmount: booking.totalAmount }
  } else if (hoursUntilVisit >= 6) {
    return { policy: "PARTIAL_REFUND", refundAmount: booking.totalAmount / 2 }
  } else {
    return { policy: "NO_REFUND", refundAmount: 0 }
  }
}
```

**Refund initiation:** Via `razorpay.payments.refund(paymentId, { amount: refundAmount })`

**Acceptance criteria:**
- Given cancellation >24hrs before, when confirmed, then full refund initiated within 5–7 business days
- Given cancellation 6–24hrs before, when confirmed, then 50% refund initiated
- Given cancellation <6hrs before, when confirmed, then no refund and sitter earnings are protected

---

### 6. Sitter Payout (48hrs Post-Completion)

**Payout trigger:** When booking status → COMPLETED, a `Payout` record is created with status PENDING.

**Payout execution:** Supabase Edge Function runs every hour:
```typescript
// Find payouts due (created 48hrs ago, still PENDING)
const duePayout = await prisma.payout.findMany({
  where: {
    status: "PENDING",
    createdAt: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) }
  },
  include: { booking: { include: { sitter: true } } }
})

// Initiate Razorpay Transfer to sitter's fund account
for (const payout of duePayout) {
  const transfer = await razorpay.transfers.create({
    account: payout.booking.sitter.razorpayFundAccountId,
    amount: payout.amount,
    currency: "INR",
  })
  await prisma.payout.update({
    where: { id: payout.id },
    data: { status: "PROCESSING", razorpayTransferId: transfer.id, initiatedAt: new Date() }
  })
}
```

**Acceptance criteria:**
- Given a booking completes, when 48 hours pass, then sitter receives payout minus 15% platform commission
- Given a Razorpay transfer fails, when the failure is detected, then payout status → FAILED and admin is notified
- Sitter receives email notification when payout is initiated

---

### 7. Booking Dashboards

**Parent dashboard — `/parent/bookings`:**
- Tabs: Upcoming / Past / Cancelled
- Each booking card: sitter photo, date/time, service type, status badge, price paid
- "View details" → booking detail page (chat, photo updates in Phase 4)

**Sitter dashboard — `/sitter/bookings`:**
- Tabs: Requests / Upcoming / Past
- Request card: parent name, pet(s), date/time, notes, Accept/Decline buttons
- Upcoming card: parent name, pet details, address, start time, "Check In" button (Phase 4)
- Earnings summary: this week / this month / total

**Acceptance criteria:**
- Parent dashboard shows bookings in correct status tabs
- Sitter sees accept/decline buttons only on PENDING bookings (not on CONFIRMED)
- Sitter earnings summary accurately reflects completed bookings minus commission

---

### 8. Browser Push Notifications

**Using Web Push API (free, no third-party service):**

```typescript
// Request notification permission + subscribe
const registration = await navigator.serviceWorker.register("/sw.js")
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
})
// Store subscription on server
await fetch("/api/push/subscribe", {
  method: "POST",
  body: JSON.stringify(subscription)
})
```

**Notifications sent for:**
- New booking request (sitter)
- Booking accepted (parent → payment prompt)
- Booking declined (parent → alternatives)
- Booking auto-expired (parent)
- Payment confirmed (both)
- Cancellation confirmed (both)
- Payout initiated (sitter)

---

## Deliverables

| Deliverable | Done When |
|---|---|
| End-to-end booking works | Parent requests → sitter accepts → payment → confirmed |
| Razorpay test payments work | UPI and card payments succeed in test mode |
| Timeout auto-cancels | Booking auto-cancels after 2hrs with no sitter response |
| Cancellation + refund works | Correct refund amount computed and initiated |
| Payout logic works | Sitter receives payout 48hrs after completion (test mode) |
| Both dashboards render | Parent and sitter see their bookings correctly |
