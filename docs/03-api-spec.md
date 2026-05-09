# API Spec — PetPeep

All API routes are Next.js App Router route handlers under `src/app/api/`.

**Base URL:** `https://petpeep.in/api` (production) | `http://localhost:3000/api` (local)

**Authentication:** All routes (except public sitter profiles and search) require a valid Supabase session cookie. Pass via `Cookie` header automatically when using the browser.

---

## Auth

### `POST /api/auth/send-otp`
Send email OTP to a given email address.

**Body:** `{ email: string }`  
**Response:** `{ success: true }`  
**Rate limit:** 3 requests per email per hour

---

### `POST /api/auth/verify-otp`
Verify OTP and create session.

**Body:** `{ email: string, otp: string }`  
**Response:** `{ user: User, isNewUser: boolean }`

---

## Users / Onboarding

### `POST /api/onboarding/parent`
Complete pet parent profile after sign-up.

**Auth required:** Yes  
**Body:**
```json
{
  "name": "string",
  "city": "Mumbai",
  "addressLine1": "string",
  "pincode": "string",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "preferredRadius": 5
}
```
**Response:** `{ petParent: PetParent }`

---

### `POST /api/onboarding/sitter`
Submit sitter application.

**Auth required:** Yes  
**Body:** `multipart/form-data` (includes file uploads)
```
fullName, phone, city, petExperience, motivation, references,
homeEnvironment, acceptsDogs, acceptsCats, acceptsOthers,
serviceRadiusKm, latitude, longitude, hourlyRate1Hr, hourlyRate2Hr, hourlyRate4Hr,
aadhaarDoc (file), selfie (file)
```
**Response:** `{ application: SitterApplication, razorpayOrderId: string }`  
*(Razorpay order for ₹299 vetting fee)*

---

## Pets

### `POST /api/pets`
Create a new pet profile.

**Auth required:** Yes (parent)  
**Body:**
```json
{
  "name": "Bruno",
  "species": "DOG",
  "breed": "Labrador",
  "age": 24,
  "weightKg": 28,
  "vaccinationStatus": true,
  "hasEverBitten": false,
  "fearTriggers": "Loud noises",
  "resourceGuarding": false,
  "reactiveToStrangers": false,
  "behavioralNotes": "Friendly but excited around new people",
  "dietaryNotes": "Royal Canin, twice daily",
  "medicalNotes": "None"
}
```
**Response:** `{ pet: Pet }`

---

### `GET /api/pets`
List all pets for the authenticated parent.

**Auth required:** Yes (parent)  
**Response:** `{ pets: Pet[] }`

---

### `PATCH /api/pets/[id]`
Update a pet profile.

**Auth required:** Yes (parent, must own the pet)  
**Body:** Partial pet fields  
**Response:** `{ pet: Pet }`

---

## Sitters

### `GET /api/sitters/search`
Search for sitters by location and filters.

**Auth required:** No (public)  
**Query params:**
```
lat, lng, radius (km), date (YYYY-MM-DD),
petType (dog|cat|other), minPrice, maxPrice,
minRating, verifiedOnly, page, limit
```
**Response:**
```json
{
  "sitters": [
    {
      "id": "string",
      "name": "string",
      "profilePhoto": "string",
      "bio": "string",
      "avgRating": 4.8,
      "totalReviews": 12,
      "hourlyRate1Hr": 400,
      "city": "Mumbai",
      "distanceKm": 2.3,
      "acceptsDogs": true,
      "acceptsCats": false
    }
  ],
  "total": 24,
  "page": 1
}
```

---

### `GET /api/sitters/[id]`
Get full sitter profile (public).

**Auth required:** No  
**Response:** Full sitter object with reviews

---

### `PATCH /api/sitters/availability`
Update sitter availability calendar.

**Auth required:** Yes (sitter)  
**Body:**
```json
{
  "date": "2026-06-15",
  "isAvailable": false
}
```
**Response:** `{ availability: SitterAvailability }`

---

## Quiz

### `GET /api/quiz`
Get quiz questions (randomised).

**Auth required:** Yes (sitter in application flow)  
**Response:** `{ questions: Question[] }` *(answers not included)*

---

### `POST /api/quiz/submit`
Submit quiz answers and get score.

**Auth required:** Yes (sitter)  
**Body:** `{ answers: Record<string, string> }`  
**Response:** `{ score: number, passed: boolean, canRetryAt: string | null }`

---

## Bookings

### `POST /api/bookings`
Create a new booking request.

**Auth required:** Yes (parent)  
**Body:**
```json
{
  "sitterId": "string",
  "serviceType": "DROP_IN_2HR",
  "date": "2026-06-20",
  "startTime": "14:00",
  "petIds": ["pet_id_1"],
  "notesToSitter": "Please feed Bruno at 3pm"
}
```
**Response:** `{ booking: Booking }`

---

### `GET /api/bookings`
List bookings for the authenticated user.

**Auth required:** Yes  
**Query params:** `status (pending|confirmed|in_progress|completed|cancelled)`, `page`, `limit`  
**Response:** `{ bookings: Booking[], total: number }`

---

### `GET /api/bookings/[id]`
Get full booking details including pets, events, photos.

**Auth required:** Yes (must be parent or sitter of the booking)  
**Response:** Full booking object with related data

---

### `PATCH /api/bookings/[id]/accept`
Sitter accepts a booking request.

**Auth required:** Yes (sitter)  
**Response:** `{ booking: Booking, razorpayOrderId: string }`

---

### `PATCH /api/bookings/[id]/decline`
Sitter declines a booking request.

**Auth required:** Yes (sitter)  
**Body:** `{ reason?: string }`  
**Response:** `{ booking: Booking }`

---

### `PATCH /api/bookings/[id]/cancel`
Cancel a booking.

**Auth required:** Yes (parent or sitter)  
**Body:** `{ reason?: string }`  
**Response:** `{ booking: Booking, refundAmount: number, refundPolicy: string }`

---

### `POST /api/bookings/[id]/checkin`
Sitter checks in with GPS coordinates.

**Auth required:** Yes (sitter)  
**Body:** `{ latitude: number, longitude: number }`  
**Response:** `{ event: BookingEvent, gpsVerified: boolean }`

---

### `POST /api/bookings/[id]/checkout`
Sitter checks out with report.

**Auth required:** Yes (sitter)  
**Body:**
```json
{
  "latitude": 19.076,
  "longitude": 72.877,
  "feedingNotes": "ate_well",
  "behaviourNotes": "Bruno was happy and playful",
  "anyConcerns": ""
}
```
**Response:** `{ event: BookingEvent }`

---

### `POST /api/bookings/[id]/photos`
Upload photo update during visit.

**Auth required:** Yes (sitter)  
**Body:** `multipart/form-data` — `photo (file)`, `caption (string, optional)`  
**Response:** `{ photoUpdate: PhotoUpdate }`

---

### `GET /api/bookings/[id]/messages`
Get chat messages for a booking.

**Auth required:** Yes (parent or sitter of booking)  
**Response:** `{ messages: Message[] }`

---

### `POST /api/bookings/[id]/messages`
Send a chat message.

**Auth required:** Yes (parent or sitter of booking)  
**Body:** `{ content: string }`  
**Response:** `{ message: Message }`

---

## Reviews

### `POST /api/reviews`
Submit a review after a completed booking.

**Auth required:** Yes  
**Body:**
```json
{
  "bookingId": "string",
  "rating": 5,
  "comment": "Priya was amazing with Bruno!"
}
```
**Response:** `{ review: Review }`

---

## Payments

### `POST /api/payments/create-order`
Create Razorpay order for a booking.

**Auth required:** Yes (parent)  
**Body:** `{ bookingId: string }`  
**Response:** `{ orderId: string, amount: number, currency: "INR" }`

---

### `POST /api/payments/verify`
Verify Razorpay payment signature after checkout.

**Auth required:** Yes  
**Body:**
```json
{
  "razorpayOrderId": "string",
  "razorpayPaymentId": "string",
  "razorpaySignature": "string"
}
```
**Response:** `{ success: true, booking: Booking }`

---

### `POST /api/webhooks/razorpay`
Razorpay webhook handler (not authenticated via session — uses signature verification).

**Body:** Razorpay webhook payload  
**Response:** `{ received: true }`

---

## SOS

### `POST /api/sos`
Trigger an SOS alert for an active booking.

**Auth required:** Yes  
**Body:** `{ bookingId: string, description?: string }`  
**Response:** `{ alert: SOSAlert, vetHelpline: string }`

---

## Admin

All admin routes require `userType === ADMIN`.

### `GET /api/admin/applications`
List sitter applications with filters.

**Query params:** `status`, `page`, `limit`

---

### `POST /api/admin/applications/[id]/approve`
Approve a sitter application.

**Body:** `{ notes?: string }`

---

### `POST /api/admin/applications/[id]/reject`
Reject a sitter application.

**Body:** `{ notes: string }` *(required)*

---

### `GET /api/admin/dashboard`
Get platform health metrics.

**Response:**
```json
{
  "bookingsToday": 12,
  "fulfilmentRate": 0.89,
  "activeBookingsNow": 3,
  "openSOSAlerts": 0,
  "weeklyGMV": 45000,
  "pendingApplications": 7,
  "avgRating": 4.7
}
```

---

### `GET /api/admin/sos`
List all SOS alerts.

---

### `PATCH /api/admin/sos/[id]/resolve`
Mark SOS alert as resolved.

**Body:** `{ notes: string }`

---

## Push Notifications

### `POST /api/push/subscribe`
Store browser push subscription for the authenticated user.

**Body:** Web Push subscription object  
**Response:** `{ success: true }`
