# Data Model — PetPeep

All data is stored in PostgreSQL (via Supabase). Schema is managed with Prisma ORM.

---

## Entity Relationship Overview

```
Users (base)
 ├── PetParents (extends Users)
 │   ├── Pets (belongs to PetParent)
 │   └── Bookings (as requester)
 └── Sitters (extends Users)
     ├── SitterApplications (one per sitter)
     ├── SitterAvailability (calendar blocks)
     └── Bookings (as provider)

Bookings (core transaction)
 ├── BookingPets (junction: booking ↔ pets)
 ├── BookingEvents (check_in / check_out)
 ├── PhotoUpdates (hourly photos during visit)
 ├── Messages (in-app chat thread)
 ├── Reviews (post-visit rating + comment)
 ├── Payouts (sitter payment)
 └── SOSAlerts (emergency triggers)
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ────────────────────────────────────────────────────────────────────

enum UserType {
  PARENT
  SITTER
  ADMIN
}

enum SitterVettingStatus {
  PENDING        // Application submitted, awaiting review
  ID_REVIEW      // ID documents uploaded, in admin review
  QUIZ_PENDING   // ID verified, quiz not yet taken
  QUIZ_FAILED    // Quiz failed (retry allowed after 7 days)
  APPROVED       // Fully vetted, visible in search
  REJECTED       // Application rejected
  SUSPENDED      // Previously approved, now suspended
}

enum BookingStatus {
  PENDING        // Sent to sitter, awaiting response (2hr window)
  CONFIRMED      // Sitter accepted
  IN_PROGRESS    // Sitter checked in
  COMPLETED      // Sitter checked out
  CANCELLED      // Cancelled by parent or system (timeout)
  DISPUTED       // Dispute raised, under admin review
}

enum BookingServiceType {
  DROP_IN_1HR
  DROP_IN_2HR
  DROP_IN_4HR
}

enum CancellationPolicy {
  FULL_REFUND        // Cancelled >24hrs before: 100% refund
  PARTIAL_REFUND     // Cancelled 6–24hrs before: 50% refund
  NO_REFUND          // Cancelled <6hrs before: 0% refund
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum PetSpecies {
  DOG
  CAT
  OTHER
}

enum ReviewDirection {
  PARENT_TO_SITTER   // Public — shown on sitter profile
  SITTER_TO_PARENT   // Private — admin-only
}

enum BookingEventType {
  CHECK_IN
  CHECK_OUT
}

// ─── USERS ────────────────────────────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  phone         String?   @unique
  name          String
  profilePhoto  String?   // Supabase Storage URL
  userType      UserType
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  parent        PetParent?
  sitter        Sitter?

  sentMessages     Message[]  @relation("SentMessages")
  triggeredSOS     SOSAlert[]
}

// ─── PET PARENTS ──────────────────────────────────────────────────────────────

model PetParent {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])

  addressLine1    String?
  city            String   // "Mumbai" | "Pune"
  pincode         String?
  latitude        Float?   // For location-based search
  longitude       Float?
  preferredRadius Int      @default(5)  // km

  bookings        Booking[]
  pets            Pet[]
}

// ─── SITTERS ──────────────────────────────────────────────────────────────────

model Sitter {
  id                  String              @id @default(cuid())
  userId              String              @unique
  user                User                @relation(fields: [userId], references: [id])

  bio                 String?
  experience          String?             // Free text description
  homeEnvironment     String?             // Describes the home (apt, house, other animals)
  acceptsDogs         Boolean             @default(true)
  acceptsCats         Boolean             @default(true)
  acceptsOthers       Boolean             @default(false)

  city                String
  serviceRadiusKm     Int                 @default(5)
  latitude            Float?
  longitude           Float?

  hourlyRate1Hr       Int?               // In INR (e.g. 400)
  hourlyRate2Hr       Int?
  hourlyRate4Hr       Int?

  vettingStatus       SitterVettingStatus @default(PENDING)
  vettingFee          Boolean             @default(false)  // ₹299 paid?
  aadhaarDocUrl       String?
  selfieUrl           String?
  aadhaarVerified     Boolean             @default(false)
  quizScore           Int?
  quizPassed          Boolean             @default(false)
  quizLastAttempt     DateTime?
  adminReviewedBy     String?
  adminReviewNotes    String?
  approvedAt          DateTime?

  avgRating           Float?             // Computed from reviews
  totalReviews        Int                @default(0)

  razorpayContactId   String?            // For payouts
  razorpayFundAccountId String?

  bookings            Booking[]
  availability        SitterAvailability[]
  application         SitterApplication?
}

// ─── SITTER APPLICATION ───────────────────────────────────────────────────────

model SitterApplication {
  id            String   @id @default(cuid())
  sitterId      String   @unique
  sitter        Sitter   @relation(fields: [sitterId], references: [id])

  // Personal info at time of application
  fullName      String
  phone         String
  city          String
  petExperience String   // Text description
  references    String?  // Optional references
  motivation    String?  // Why do you want to be a sitter?

  // Vetting
  aadhaarNumber String?  // Stored encrypted
  aadhaarDocUrl String?
  selfieUrl     String?

  quizScore     Int?
  quizPassedAt  DateTime?

  // Admin
  reviewedAt    DateTime?
  reviewedBy    String?
  reviewNotes   String?
  status        SitterVettingStatus @default(PENDING)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// ─── SITTER AVAILABILITY ──────────────────────────────────────────────────────

model SitterAvailability {
  id          String   @id @default(cuid())
  sitterId    String
  sitter      Sitter   @relation(fields: [sitterId], references: [id])

  date        DateTime @db.Date
  isAvailable Boolean  @default(true)
  slots       Json?    // Array of time slots: [{ start: "09:00", end: "18:00" }]

  createdAt   DateTime @default(now())

  @@unique([sitterId, date])
}

// ─── PETS ─────────────────────────────────────────────────────────────────────

model Pet {
  id                  String     @id @default(cuid())
  parentId            String
  parent              PetParent  @relation(fields: [parentId], references: [id])

  name                String
  species             PetSpecies
  breed               String?
  age                 Int?       // In months
  weightKg            Float?
  profilePhotoUrl     String?

  vaccinationStatus   Boolean    @default(false)
  vaccinationDocUrl   String?

  // Behavioral profile (liability-critical)
  hasEverBitten       Boolean    @default(false)
  fearTriggers        String?    // Free text
  resourceGuarding    Boolean    @default(false)
  reactiveToStrangers Boolean    @default(false)
  behavioralNotes     String?    // Detailed notes

  // Care notes
  dietaryNotes        String?
  medicalNotes        String?
  vetName             String?
  vetPhone            String?

  isActive            Boolean    @default(true)
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  bookingPets         BookingPet[]
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

model Booking {
  id              String             @id @default(cuid())
  parentId        String
  parent          PetParent          @relation(fields: [parentId], references: [id])
  sitterId        String
  sitter          Sitter             @relation(fields: [sitterId], references: [id])

  serviceType     BookingServiceType
  date            DateTime           @db.Date
  startTime       String             // "14:00"
  endTime         String             // "16:00" (computed from serviceType)

  notesToSitter   String?
  status          BookingStatus      @default(PENDING)

  // Financials
  totalAmount     Int                // In paise (e.g., 50000 = ₹500)
  platformFee     Int                // 15% of totalAmount
  sitterEarnings  Int                // totalAmount - platformFee

  // Payment
  razorpayOrderId    String?  @unique
  razorpayPaymentId  String?
  paidAt             DateTime?

  // Cancellation
  cancelledAt        DateTime?
  cancelledBy        String?    // userId
  cancellationReason String?
  refundPolicy       CancellationPolicy?
  refundAmount       Int?
  refundedAt         DateTime?

  // Timeout
  sitterResponseDeadline DateTime?  // Set when booking created (now + 2hrs)
  autoExpiredAt         DateTime?

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  pets            BookingPet[]
  events          BookingEvent[]
  photoUpdates    PhotoUpdate[]
  messages        Message[]
  reviews         Review[]
  payout          Payout?
  sosAlerts       SOSAlert[]
}

// ─── BOOKING PETS (junction) ──────────────────────────────────────────────────

model BookingPet {
  id          String  @id @default(cuid())
  bookingId   String
  booking     Booking @relation(fields: [bookingId], references: [id])
  petId       String
  pet         Pet     @relation(fields: [petId], references: [id])

  @@unique([bookingId, petId])
}

// ─── BOOKING EVENTS (check-in / check-out) ────────────────────────────────────

model BookingEvent {
  id          String           @id @default(cuid())
  bookingId   String
  booking     Booking          @relation(fields: [bookingId], references: [id])

  type        BookingEventType
  latitude    Float
  longitude   Float
  gpsVerified Boolean          @default(false)  // Within ±200m of pet's home
  timestamp   DateTime         @default(now())

  reportNotes String?          // Check-out notes from sitter
}

// ─── PHOTO UPDATES ────────────────────────────────────────────────────────────

model PhotoUpdate {
  id          String   @id @default(cuid())
  bookingId   String
  booking     Booking  @relation(fields: [bookingId], references: [id])
  sitterId    String

  photoUrl    String   // Supabase Storage URL
  caption     String?
  sentAt      DateTime @default(now())
  seenAt      DateTime?
}

// ─── MESSAGES (in-app chat) ───────────────────────────────────────────────────

model Message {
  id          String   @id @default(cuid())
  bookingId   String
  booking     Booking  @relation(fields: [bookingId], references: [id])
  senderId    String
  sender      User     @relation("SentMessages", fields: [senderId], references: [id])

  content     String
  sentAt      DateTime @default(now())
  readAt      DateTime?
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

model Review {
  id            String          @id @default(cuid())
  bookingId     String
  booking       Booking         @relation(fields: [bookingId], references: [id])
  reviewerId    String
  revieweeId    String

  direction     ReviewDirection
  rating        Int             // 1–5
  comment       String?
  isPublic      Boolean         @default(true)  // false for sitter→parent reviews

  createdAt     DateTime        @default(now())

  @@unique([bookingId, direction])
}

// ─── PAYOUTS ──────────────────────────────────────────────────────────────────

model Payout {
  id                    String       @id @default(cuid())
  bookingId             String       @unique
  booking               Booking      @relation(fields: [bookingId], references: [id])
  sitterId              String

  amount                Int          // In paise
  status                PayoutStatus @default(PENDING)

  razorpayTransferId    String?
  initiatedAt           DateTime?
  completedAt           DateTime?
  failedAt              DateTime?
  failureReason         String?

  createdAt             DateTime     @default(now())
}

// ─── SOS ALERTS ───────────────────────────────────────────────────────────────

model SOSAlert {
  id            String   @id @default(cuid())
  bookingId     String
  booking       Booking  @relation(fields: [bookingId], references: [id])
  triggeredById String
  triggeredBy   User     @relation(fields: [triggeredById], references: [id])

  description   String?
  resolvedAt    DateTime?
  resolvedBy    String?
  resolutionNotes String?

  triggeredAt   DateTime @default(now())
}
```

---

## Key Design Decisions

### 1. Amounts stored in paise (not rupees)
All monetary values (`totalAmount`, `platformFee`, `sitterEarnings`, `refundAmount`) are stored as integers in **paise** (1 INR = 100 paise). This avoids floating point precision issues in financial calculations. Display layer converts: `amount / 100` → `₹500`.

### 2. Behavioral Profile on Pet model (not Booking)
The `Pet` model stores `hasEverBitten`, `fearTriggers`, `resourceGuarding` etc. rather than the `Booking`. This means the data is captured once at pet profile creation and automatically applies to all bookings for that pet. A sitter must acknowledge the pet's behavioral profile before booking confirmation.

### 3. BookingEvent for GPS — not a boolean flag
Check-in and check-out are separate `BookingEvent` records with lat/lng and `gpsVerified` flag. This creates an audit trail and enables the ±200m tolerance check against the parent's stored location.

### 4. Review direction (public vs private)
`PARENT_TO_SITTER` reviews are public on the sitter's profile. `SITTER_TO_PARENT` reviews are `isPublic: false` and only visible to admins. This is consistent with the PRD spec and prevents sitters from retaliating against parents with negative public reviews.

### 5. Sitter payout is separate from Booking
The `Payout` model is created when a booking's status transitions to `COMPLETED`. A background job (cron or Supabase Edge Function) checks for payouts with `PENDING` status older than 48 hours and initiates transfer via Razorpay. This decouples payment processing from booking completion.

---

## Indexes to Add

```sql
-- Location-based search (PostGIS)
CREATE INDEX idx_sitters_location ON "Sitter" USING GIST (
  ST_Point(longitude, latitude)
);

-- Booking lookups
CREATE INDEX idx_bookings_parent ON "Booking"(parentId);
CREATE INDEX idx_bookings_sitter ON "Booking"(sitterId);
CREATE INDEX idx_bookings_status ON "Booking"(status);
CREATE INDEX idx_bookings_date ON "Booking"(date);

-- Message chat thread
CREATE INDEX idx_messages_booking ON "Message"(bookingId, sentAt);

-- Photo updates per booking
CREATE INDEX idx_photo_updates_booking ON "PhotoUpdate"(bookingId, sentAt);
```

---

## Data Flow: Booking Lifecycle

```
1. Parent searches sitters
   → Query: Sitter WHERE city = X AND vettingStatus = APPROVED AND date available

2. Parent sends booking request
   → Booking created (status: PENDING)
   → sitterResponseDeadline = now + 2hrs
   → Sitter notified

3a. Sitter accepts
   → Booking status → CONFIRMED
   → Parent prompted to pay
   → Razorpay order created
   → On payment success → paidAt set

3b. Sitter declines or timeout
   → Booking status → CANCELLED
   → Parent notified with alternative sitter suggestions

4. Visit day — Sitter checks in
   → BookingEvent (CHECK_IN) created with lat/lng
   → GPS verified against parent address (±200m)
   → Booking status → IN_PROGRESS
   → Parent notified

5. During visit
   → PhotoUpdate records created (every 60 mins minimum)
   → Messages exchanged in real-time (Supabase Realtime)

6. Sitter checks out
   → BookingEvent (CHECK_OUT) created
   → Sitter submits report notes
   → Booking status → COMPLETED
   → Payout record created (PENDING, due in 48hrs)
   → Parent prompted to review

7. Review submitted
   → Review record created (PARENT_TO_SITTER, public)
   → Sitter avg_rating and totalReviews updated

8. 48hrs after completion
   → Payout job runs
   → Razorpay Transfer initiated
   → Payout status → PROCESSING → COMPLETED
```
