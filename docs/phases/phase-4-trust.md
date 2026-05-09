# Phase 4 — Trust Features

**Timeline:** Weeks 11–13  
**Goal:** The real-time safety layer that differentiates PetPeep from every competitor. Parents see GPS check-in, hourly photo updates, and can chat with the sitter during every visit. Reviews are collected after completion.

---

## What Gets Built

- GPS-verified sitter check-in and check-out (browser Geolocation API)
- Photo updates during visit (minimum 1 per 60 minutes, with auto-reminder)
- In-app chat per booking (Supabase Realtime)
- End-of-visit report from sitter
- Reviews and ratings (parent → sitter, public; sitter → parent, admin-only)
- Sitter avg_rating updated on review submission

---

## User Flows

### Visit Day Flow (Sitter)

```
Sitter opens app on visit day → Booking appears as "Today"
→ Tap "Check In"
→ Browser requests location permission
→ GPS coordinates captured → sent to server
→ Server verifies within ±200m of parent's address
→ Booking status → IN_PROGRESS
→ Parent notified: "Priya has arrived at 2:03pm"

During visit:
→ Sitter sends photo updates via camera or gallery
→ Photo uploaded to Supabase Storage → parent notified
→ If 60 mins pass with no photo → in-app reminder to sitter
→ Chat with parent available throughout

After visit:
→ Tap "Check Out"
→ GPS check-out recorded
→ Fill end-of-visit report:
   - How was feeding? (dropdown: ate well / ate less / didn't eat)
   - Behaviour notes (free text)
   - Any concerns? (free text)
   - Photos (optional additional)
→ Report submitted → parent notified
→ Booking status → COMPLETED
→ Parent prompted to leave a review
```

### Visit Day Flow (Parent)

```
Parent sees "Sitter visiting today" in dashboard
→ Receives "Check-in" notification with time
→ Views live photo feed as photos arrive
→ Chats with sitter if needed
→ Receives check-out notification + report
→ Reviews sitter (prompted 1hr after check-out)
```

---

## Detailed Task Breakdown

### 1. GPS Check-In / Check-Out

**How it works:**
1. Sitter taps "Check In" on the booking page
2. Browser `navigator.geolocation.getCurrentPosition()` captures lat/lng
3. Coordinates sent to server: `POST /api/bookings/[id]/checkin`
4. Server computes distance between sitter's lat/lng and parent's address lat/lng using the Haversine formula
5. If within ±200m: `gpsVerified = true`
6. If outside 200m: still allow check-in but flag as `gpsVerified = false` (admin notified)
7. `BookingEvent` created; `booking.status → IN_PROGRESS`
8. Parent push notification + realtime update

**Haversine distance calculation:**
```typescript
// src/lib/geo.ts
export function haversineDistanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
```

**Acceptance criteria:**
- Given sitter is within 200m of parent's address, when they check in, then `gpsVerified = true` and parent sees "Sitter has arrived" notification
- Given sitter is more than 200m away, when they check in, then check-in is recorded but `gpsVerified = false` and admin flag is set
- Given browser denies location permission, when sitter taps Check In, then they see a clear error: "Location access is required to check in"

---

### 2. Photo Updates

**Upload flow:**
1. Sitter taps camera icon on the active booking page
2. File picker opens (camera or gallery)
3. Image uploaded directly to Supabase Storage: `photos/[bookingId]/[timestamp].jpg`
4. `PhotoUpdate` record created in DB
5. Parent notified via realtime subscription + push notification: "Priya sent a photo update"

**60-minute reminder (Supabase Edge Function, runs every 5 minutes):**
```typescript
// Find active bookings with no photo in the last 60 minutes
const activeBookings = await prisma.booking.findMany({
  where: { status: "IN_PROGRESS" },
  include: {
    photoUpdates: {
      orderBy: { sentAt: "desc" },
      take: 1,
    }
  }
})

for (const booking of activeBookings) {
  const lastPhoto = booking.photoUpdates[0]
  const checkInTime = booking.events.find(e => e.type === "CHECK_IN").timestamp
  const referenceTime = lastPhoto?.sentAt ?? checkInTime

  const minutesSinceLastPhoto = differenceInMinutes(new Date(), referenceTime)
  if (minutesSinceLastPhoto >= 60) {
    // Send in-app reminder to sitter
    await sendPushNotification(booking.sitterId, {
      title: "Time for a photo update!",
      body: `${booking.parent.user.name} is waiting for an update on their pet.`
    })
  }
}
```

**Parent photo feed:**
- All photos for the booking displayed in a chronological feed
- Each photo shows timestamp and caption (if provided)
- Realtime subscription updates the feed without page reload

**Acceptance criteria:**
- Given a sitter sends a photo, when it uploads, then the parent's feed updates within 5 seconds
- Given 60 minutes pass without a photo, when the check runs, then the sitter receives a reminder notification
- Given a visit has 3 photos sent, when the parent views the booking, then all 3 photos are visible in order

---

### 3. In-App Chat (Supabase Realtime)

**Implementation:**

```typescript
// src/hooks/useBookingChat.ts
export function useBookingChat(bookingId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Load existing messages
    fetchMessages(bookingId).then(setMessages)

    // Subscribe to new messages via Supabase Realtime
    const channel = supabase
      .channel(`booking-chat-${bookingId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "Message",
        filter: `bookingId=eq.${bookingId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bookingId])

  const sendMessage = async (content: string) => {
    await fetch(`/api/bookings/${bookingId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
  }

  return { messages, sendMessage }
}
```

**Chat UI:**
- Full-height chat window on the booking detail page
- Sent messages (right-aligned, teal background)
- Received messages (left-aligned, white card)
- Timestamps on each message
- Message read receipts (shows when message was seen)
- Character limit: 500 characters per message

**Acceptance criteria:**
- Given parent sends a message, when sitter is on the booking page, then they see the message within 2 seconds
- Given sitter reads a message, when parent checks the chat, then they see the "read" timestamp
- Chat is only accessible to the parent and sitter of that specific booking

---

### 4. End-of-Visit Report

**Submitted by sitter on check-out:**

```typescript
type CheckOutReport = {
  feedingNotes: "ate_well" | "ate_less" | "did_not_eat" | "n/a"
  behaviourNotes: string    // Free text, max 500 chars
  anyConcerns: string       // Free text, max 500 chars
  additionalPhotos?: File[] // Optional
}
```

- Report saved to `BookingEvent` (CHECK_OUT) as JSON in `reportNotes`
- Parent receives push notification: "[Sitter] has completed the visit — see the report"
- Report visible on booking detail page for parent

---

### 5. Reviews & Ratings

**When triggered:** Parent receives review prompt 1 hour after `CHECK_OUT` event

**Review form:**
- Star rating 1–5 (required)
- Written review (optional, max 500 chars)
- "Seen by all pet parents" note (transparency)

**Post-submission:**
1. `Review` created (direction: PARENT_TO_SITTER, isPublic: true)
2. Sitter's `avgRating` and `totalReviews` updated:
   ```typescript
   const result = await prisma.review.aggregate({
     where: { revieweeId: sitterId, direction: "PARENT_TO_SITTER" },
     _avg: { rating: true },
     _count: true,
   })
   await prisma.sitter.update({
     where: { id: sitterId },
     data: {
       avgRating: result._avg.rating,
       totalReviews: result._count,
     }
   })
   ```
3. Review appears on sitter profile within 5 minutes

**Sitter reverse review (admin-only):**
- Sitter optionally rates the parent 1–5 after booking
- Stored as `isPublic: false`
- Only visible to admin (for identifying problematic parents)

**Acceptance criteria:**
- Given a booking completes, when 1 hour passes, then parent receives review prompt
- Given a parent submits a 5-star review, when it posts, then sitter's avgRating updates within 1 minute
- Given a sitter has <3 reviews, when their profile is viewed, then "New Sitter – Verified & Interviewed" badge is shown instead of rating
- Reviews can only be submitted once per completed booking (unique constraint on `[bookingId, direction]`)

---

## Deliverables

| Deliverable | Done When |
|---|---|
| GPS check-in works on mobile browser | Check-in with location verified on Chrome/Safari mobile |
| Photo uploads work | Photos upload and appear in parent feed within 5 seconds |
| 60-min reminder fires | Tested by creating an active booking and waiting 60 minutes |
| Chat works in real-time | Messages appear within 2 seconds on both sides |
| End-of-visit report works | Sitter submits report, parent sees it immediately |
| Reviews post and update avg rating | Parent submits review, sitter avgRating updates on profile |

---

## Performance Considerations

- Photo uploads: compress images client-side (to max 800KB) before upload using `browser-image-compression`
- Realtime chat: unsubscribe from Supabase channels when component unmounts to prevent memory leaks
- Photo feed: lazy load images using Next.js `Image` component with blur placeholder
