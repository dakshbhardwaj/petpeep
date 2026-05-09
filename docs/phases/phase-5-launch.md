# Phase 5 — Launch Prep

**Timeline:** Weeks 14–16  
**Goal:** SOS emergency support live. All P0 features hardened and tested. 200 waitlisted parents onboarded for beta in Mumbai. Daily monitoring dashboard tracking fulfilment rate and NPS.

---

## What Gets Built

- SOS emergency button (during active bookings)
- In-app support chat (8am–10pm)
- Admin operational dashboard (GMV, fulfilment rate, NPS, active bookings)
- Performance hardening (Lighthouse ≥80, Core Web Vitals green)
- End-to-end testing of all critical flows
- Beta rollout to 200 Mumbai parents (waitlist invite flow)
- Razorpay live mode switch (real payments enabled)
- Error monitoring via Sentry

---

## Detailed Task Breakdown

### 1. SOS Emergency Button

**Availability:** Only visible during active bookings (status = IN_PROGRESS)

**Trigger flow:**
1. Parent or sitter taps "SOS"
2. Modal appears: "This will immediately alert our support team. Confirm?"
3. On confirm: `SOSAlert` record created
4. Admin receives real-time push notification + email
5. User sees: "Our team has been alerted. You'll be contacted within 5 minutes."
6. Vet helpline number displayed prominently in the modal

**Admin SOS view:**
- `/admin/sos` shows all active alerts in real-time
- Each alert: booking ID, triggered by, triggered at, pet details, sitter + parent contact info
- Admin marks alert as resolved with notes

**Acceptance criteria:**
- Given a parent triggers SOS, when it fires, then admin receives notification within 30 seconds
- SOS button is only visible on bookings with status = IN_PROGRESS
- Given SOS is triggered, when the modal opens, then a vet helpline number is clearly displayed

---

### 2. Admin Operations Dashboard

**Route:** `/admin/dashboard`

**Metrics displayed (real-time + trends):**

| Metric | Target | Display |
|---|---|---|
| Total bookings today | — | Number + bar chart |
| Booking fulfilment rate | ≥85% | % + trend |
| Active bookings right now | — | Number + list |
| SOS alerts (open) | 0 | Number (red if >0) |
| Weekly GMV | ₹10L by month 6 | ₹ value + trend |
| Sitter applications pending | — | Number + link to queue |
| Avg platform rating | ≥4.5 | Stars + recent reviews |

**Data sources:** All computed via Prisma queries on the server. No external analytics tool needed for MVP.

---

### 3. Beta Waitlist Rollout

**Waitlist flow:**
1. Landing page has "Join the waitlist" form (email + city + "I have a dog/cat")
2. Entries stored in a simple `Waitlist` table
3. Admin can invite batches (e.g., 50 at a time) from the admin dashboard
4. Invite email sent via Resend with a unique sign-up link
5. Track: waitlist signups → invited → signed up → first booking

**Beta rollout plan:**
- Week 14: Invite 50 Mumbai parents
- Week 15: Monitor, fix issues, invite 100 more
- Week 16: Full 200 active; prepare for open launch

---

### 4. Hardening & Testing Checklist

**Functionality testing:**

| Flow | Test |
|---|---|
| Sign up | New email → OTP → profile created |
| Sitter application | Full flow from application → vetting fee → admin approval |
| Search | Location search returns correct results within radius |
| Booking | End-to-end: request → accept → pay → confirm → check-in → photo → check-out → review |
| Cancellation | All 3 cancellation policies trigger correct refund amounts |
| Payout | 48hr payout runs correctly in test mode |
| SOS | Alert triggers admin notification |
| Chat | Real-time messages delivered within 2 seconds |

**Security checklist:**
- [ ] All API routes validate session (unauthenticated requests return 401)
- [ ] Admin routes enforce `userType === ADMIN` (non-admin returns 403)
- [ ] Razorpay webhook validates signature before processing
- [ ] Aadhaar documents only accessible to uploader + admin (Supabase RLS policies)
- [ ] No sensitive data (Aadhaar numbers, payment IDs) exposed in client-side code
- [ ] Rate limiting on OTP endpoints (max 3 OTP requests per email per hour)
- [ ] Input validation on all API routes (Zod schema validation)

**Performance targets:**

| Page | Target |
|---|---|
| Landing page | LCP < 2.5s on mobile 4G |
| Search results | Loads in < 1.5s |
| Booking flow | Each step renders in < 1s |
| Sitter profile | LCP < 2.5s |

Run `npx lighthouse https://petpeep.in --mobile` and fix any red metrics.

---

### 5. Razorpay Live Mode Switch

**Steps:**
1. Complete Razorpay KYC (business verification — required for live payments)
2. Generate live API keys from Razorpay dashboard
3. Update production environment variables:
   - `RAZORPAY_KEY_ID` → live key
   - `RAZORPAY_KEY_SECRET` → live secret
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` → live key
4. Test one real ₹1 booking to confirm everything works
5. Set up Razorpay webhook in live mode pointing to `https://petpeep.in/api/webhooks/razorpay`

**Important:** Never commit live keys to source control. Update only via Vercel environment variable settings.

---

### 6. Sentry Error Monitoring

```typescript
// Install
npm install @sentry/nextjs

// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,  // 10% of transactions
  environment: process.env.NODE_ENV,
})
```

**Alert rules (configure in Sentry):**
- Alert when error rate > 5 errors/minute
- Alert when new error type appears
- Alert on payment-related errors (tag: "payment")
- Alert on SOS-related errors (tag: "sos")

---

## Launch Communication

**Before beta launch (Week 14):**
- [ ] Onboard 50–75 sitters in Mumbai (manual recruitment, not platform-driven yet)
- [ ] Brief all approved sitters on the platform via email + PDF guide
- [ ] Test support chat is staffed 8am–10pm

**Beta invite email:**
> Subject: You're invited to try PetPeep — Mumbai's first verified pet sitting platform
>
> Hi [Name],
>
> You're one of the first 200 pet parents getting early access to PetPeep. We have 50+ verified sitters in Mumbai ready for bookings.
>
> [Sign Up Now] — Your first booking is 10% off as a thank-you.

---

## Post-Beta Metrics to Monitor (Daily)

| Metric | Target | Alert if |
|---|---|---|
| Booking requests/day | ≥5 in week 1 | <2 for 3 consecutive days |
| Fulfilment rate | ≥85% | <75% on any day |
| Photo update compliance | ≥90% | <80% in a week |
| Support response time | <30 min | >1 hour in any case |
| SOS alerts | 0 | Any unresolved after 10 mins |
| Sitter no-shows | 0 | Any occurrence |

---

## Deliverables

| Deliverable | Done When |
|---|---|
| SOS button live | Tested — triggers admin alert within 30 seconds |
| Admin dashboard live | All metrics displaying correctly |
| Security checklist complete | All items checked and verified |
| Performance targets met | Lighthouse ≥80 on key pages |
| Razorpay live mode active | First real ₹1 booking processed successfully |
| Beta invites sent | 200 Mumbai parents invited |
| Sentry monitoring live | Errors appearing in Sentry dashboard |
