# Phase 1 — Onboarding

**Timeline:** Weeks 3–5  
**Goal:** Both user types can fully register and create their profiles. Admin vetting queue is live. An approved sitter appears in the system as searchable.

---

## What Gets Built

- Pet parent onboarding: profile + one or more pet profiles
- Sitter application: personal details + pet care knowledge quiz + ₹299 vetting fee
- Admin vetting dashboard: review applications, approve/reject sitters
- Email notifications for application status changes
- Sitter profile page (read-only, post-approval)

---

## User Flows

### Pet Parent Onboarding Flow

```
Sign Up → OTP Verification → Select "I'm a Pet Parent"
→ Personal details (name, city, address, lat/lng)
→ Add first pet (required before search is unlocked)
   → Pet name, species, breed, age, weight
   → Vaccination status + photo upload (optional at this stage)
   → Behavioral profile (has bitten? fear triggers? — mandatory)
   → Dietary + medical notes (optional)
→ Dashboard (search locked until ≥1 pet added)
```

### Sitter Application Flow

```
Sign Up → OTP Verification → Select "I want to be a Sitter"
→ Application form:
   - Personal details (name, phone, city)
   - Pet experience description
   - Why do you want to sit? (motivation)
   - References (optional)
   - Home environment description
   - Accepts: dogs / cats / others (checkboxes)
   - Service radius (km) + location
   - Hourly rates (1hr / 2hr / 4hr)
→ ID Verification:
   - Upload Aadhaar front + back photo
   - Upload selfie
   - Note: manual admin review for MVP (no automated vendor yet)
→ Pet care knowledge quiz (20 questions, 70% pass mark)
→ Vetting fee payment (₹299 via Razorpay — test mode for now)
→ "Application submitted — we'll review within 48 hours" confirmation
→ Email notification when approved/rejected
```

### Admin Vetting Flow

```
Admin logs in → Vetting Queue
→ See all PENDING applications
→ Click application → Review:
   - Applicant details
   - ID documents (Aadhaar + selfie photos)
   - Quiz score
   - Motivation / experience
→ Approve or Reject with optional notes
→ Sitter notified via email
→ On approval: sitter status → APPROVED, profile becomes searchable
```

---

## Detailed Task Breakdown

### 1. Pet Parent Onboarding

**Tasks:**
- [x] Create onboarding wizard (multi-step form):
  - Step 1: Personal details (name, city, address)
  - Step 2: Location pin (Leaflet map, click to set lat/lng)
  - Step 3: Add pet profile (see below)
- [x] Pet profile form fields:
  - Name (text)
  - Species (Dog / Cat / Other — select)
  - Breed (text, optional)
  - Age in months (number)
  - Weight in kg (number, optional)
  - Profile photo (Supabase Storage upload, optional)
  - Vaccination status (checkbox) + vaccination doc upload (optional)
  - **Behavioral Profile (required — liability critical):**
    - "Has your pet ever bitten anyone?" (yes / no)
    - "Is your pet reactive to strangers?" (yes / no)
    - "Does your pet resource-guard food or toys?" (yes / no)
    - "What are your pet's fear triggers?" (text, optional)
    - "Any other behavioral notes?" (text, optional)
  - Dietary notes (text, optional)
  - Medical notes + vet contact (text, optional)
- [x] "Add another pet" button (multiple pets per account)
- [x] Save to `PetParent` and `Pet` tables via Prisma

**Acceptance criteria:**
- Given a new parent completes sign-up, when they try to access search without a pet, then they see a "Add your pet first" prompt
- Given a parent adds a pet, when they submit the behavioral profile, then all fields are saved to the Pet record
- Given a parent uploads a vaccination doc, when it's saved, then the URL is stored in `vaccinationDocUrl` on the Pet

---

### 2. Sitter Application Form

**Tasks:**
- [x] Multi-step sitter application form:
  - Step 1: Personal details
  - Step 2: Experience + references
  - Step 3: Service setup (location, radius, rates)
  - Step 4: ID document upload (Aadhaar + selfie) — store in Supabase Storage
  - Step 5: Knowledge quiz
  - Step 6: Vetting fee payment (₹299 via Razorpay)
- [x] Save to `SitterApplication` table; create `Sitter` record on submission
- [x] Set `vettingStatus = PENDING` after fee payment
- [x] Send confirmation email via Resend:
  - Subject: "Your PetPeep sitter application has been received"
  - Body: name, expected review time (48hrs), next steps

**Acceptance criteria:**
- Given a sitter submits an application, when the vetting fee is paid, then a SitterApplication record is created with status PENDING
- Given a sitter fails the quiz (<70%), when they attempt to resubmit, then they see a "You can retake the quiz after 7 days" message
- Given a sitter uploads Aadhaar docs, when submission completes, then the file URLs are stored on the SitterApplication

---

### 3. Pet Care Knowledge Quiz

**20 questions covering:**
- Basic dog/cat body language (stress signals, aggression signs)
- First aid basics (what to do if a pet ingests something toxic)
- Feeding basics (frequency, common toxic foods)
- Emergency vet situations (when to call a vet immediately)
- Safety handling (how to break up a dog fight safely)

**Implementation:**
- [x] Store questions in a JSON file or Supabase table
- [x] Randomise question order per attempt
- [x] Score computed on submission (backend — not client)
- [x] Store `quizScore`, `quizPassed`, `quizLastAttempt` on `Sitter` table
- [x] 7-day retry cooldown enforced server-side

**Acceptance criteria:**
- Given a sitter scores ≥70%, when quiz is submitted, then `quizPassed = true` and they proceed to the next step
- Given a sitter scores <70%, when quiz is submitted, then `quizLastAttempt` is set and retry is blocked for 7 days
- Quiz score is calculated on the server, not the client (prevents manipulation)

---

### 4. Admin Vetting Dashboard

**Routes:** `/admin/vetting` (protected: `userType === ADMIN` only)

**Tasks:**
- [x] Vetting queue table:
  - Columns: applicant name, city, submitted date, quiz score, ID status, action
  - Filter by status: PENDING / ID_REVIEW / APPROVED / REJECTED
  - Sort by: newest first
- [x] Application detail view:
  - All form fields
  - Aadhaar + selfie images (displayed securely from Supabase Storage)
  - Quiz score + pass/fail
  - Notes field for admin
  - Approve / Reject buttons
- [x] On Approve:
  - `Sitter.vettingStatus` → APPROVED
  - `Sitter.approvedAt` → now
  - `Sitter.adminReviewedBy` → admin userId
  - Send approval email to sitter
- [x] On Reject:
  - `Sitter.vettingStatus` → REJECTED
  - Send rejection email with notes

**Acceptance criteria:**
- Given admin approves a sitter, when the page refreshes, then the sitter is removed from PENDING queue
- Given admin rejects a sitter, when email is sent, then it includes the review notes
- Given no applications are pending, when admin visits the queue, then they see an empty state message

---

### 5. Sitter Profile Page (Read-Only, Post-Approval)

**Route:** `/sitters/[id]`

**Components:**
- Profile photo + name
- "Verified & Approved" badge
- Bio and experience
- Services offered (1hr / 2hr / 4hr) + rates
- Pets accepted (dogs / cats / others)
- Service area (city + km radius)
- Reviews section (empty on first approval — "New Sitter – Verified & Interviewed" badge shown)
- Availability calendar (read-only in Phase 1)
- "Request a Booking" CTA (built in Phase 3)

**Acceptance criteria:**
- Given a sitter is APPROVED, when anyone visits their profile URL, then the full profile is visible
- Given a sitter has 0 reviews, when profile is viewed, then the "New Sitter – Verified & Interviewed" badge is shown
- Given a sitter is PENDING or REJECTED, when anyone tries to visit their profile URL, then they see a 404

---

### 6. Sitter Onboarding Confirmation + Email Notifications

**Emails to send (via Resend):**

| Trigger | Recipient | Subject |
|---|---|---|
| Application submitted | Sitter | "Your application has been received" |
| Application approved | Sitter | "Welcome to PetPeep — you're approved!" |
| Application rejected | Sitter | "Your PetPeep application — update" |
| New application received | Admin | "New sitter application to review" |

---

## Deliverables

| Deliverable | Done When |
|---|---|
| Pet parent can complete full onboarding | Parent + pet profile created in DB |
| Sitter can submit application + pay fee | SitterApplication created, status = PENDING |
| Admin can approve/reject from dashboard | Vetting status updates correctly |
| Approved sitter has a profile page | `/sitters/[id]` renders with correct data |
| All emails send correctly | Tested against real email addresses |

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| File uploads (Aadhaar docs) too large | Set max file size to 5MB in Supabase Storage; validate client-side |
| Quiz can be cheated (client-side) | Score all quiz answers server-side in API route, never trust client |
| Admin sees Aadhaar numbers | Store Aadhaar number encrypted; only display last 4 digits in admin UI |
| Razorpay test payment needed | Use test card numbers from Razorpay docs during development |
