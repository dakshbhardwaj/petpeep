# 01 — Project Structure & Folder Organisation

Every file has one right place. This document defines where that is.

---

## Top-Level Structure

```
petpeep/
├── src/                    # All application source code
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets (images, icons, fonts)
├── supabase/               # Supabase Edge Functions and migrations
├── docs/                   # All project documentation
├── .github/                # GitHub Actions workflows, PR template
├── CONTRIBUTING.md         # Development guidelines (master)
├── CLAUDE.md               # AI agent context
├── README.md               # Project overview and quick links
├── .env.example            # Environment variable template (committed)
├── .env.local              # Actual secrets (NEVER committed)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── prisma/schema.prisma
└── package.json
```

---

## `src/` Directory — Detailed

```
src/
├── app/                            # Next.js App Router
│   ├── (auth)/                     # Route group: auth pages (no shared layout)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── sign-up/
│   │   │   └── page.tsx
│   │   └── layout.tsx              # Auth layout (centered card)
│   │
│   ├── (parent)/                   # Route group: pet parent pages
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── pets/
│   │   │   ├── page.tsx            # List all pets
│   │   │   ├── new/page.tsx        # Add new pet
│   │   │   └── [id]/page.tsx       # Edit pet
│   │   ├── search/
│   │   │   └── page.tsx            # Sitter search
│   │   ├── bookings/
│   │   │   ├── page.tsx            # Bookings list
│   │   │   └── [id]/page.tsx       # Booking detail (chat, photos)
│   │   └── layout.tsx              # Parent layout (nav + sidebar)
│   │
│   ├── (sitter)/                   # Route group: sitter pages
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── apply/
│   │   │   └── page.tsx            # Multi-step application
│   │   ├── bookings/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx            # Edit own profile
│   │   └── layout.tsx
│   │
│   ├── (admin)/                    # Route group: admin pages
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── vetting/
│   │   │   ├── page.tsx            # Vetting queue
│   │   │   └── [id]/page.tsx       # Review single application
│   │   ├── bookings/
│   │   │   └── page.tsx
│   │   ├── sos/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── sitters/                    # Public sitter profiles (no auth required)
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── api/                        # API route handlers
│   │   ├── auth/
│   │   │   ├── send-otp/route.ts
│   │   │   └── verify-otp/route.ts
│   │   ├── onboarding/
│   │   │   ├── parent/route.ts
│   │   │   └── sitter/route.ts
│   │   ├── pets/
│   │   │   ├── route.ts            # GET (list) + POST (create)
│   │   │   └── [id]/route.ts       # GET + PATCH + DELETE
│   │   ├── sitters/
│   │   │   ├── search/route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── availability/route.ts
│   │   ├── bookings/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── accept/route.ts
│   │   │       ├── decline/route.ts
│   │   │       ├── cancel/route.ts
│   │   │       ├── checkin/route.ts
│   │   │       ├── checkout/route.ts
│   │   │       ├── photos/route.ts
│   │   │       └── messages/route.ts
│   │   ├── payments/
│   │   │   ├── create-order/route.ts
│   │   │   └── verify/route.ts
│   │   ├── reviews/route.ts
│   │   ├── quiz/
│   │   │   ├── route.ts
│   │   │   └── submit/route.ts
│   │   ├── sos/route.ts
│   │   ├── push/
│   │   │   └── subscribe/route.ts
│   │   ├── webhooks/
│   │   │   └── razorpay/route.ts
│   │   └── admin/
│   │       ├── dashboard/route.ts
│   │       ├── applications/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── approve/route.ts
│   │       │       └── reject/route.ts
│   │       └── sos/
│   │           ├── route.ts
│   │           └── [id]/resolve/route.ts
│   │
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing page
│   ├── not-found.tsx
│   └── error.tsx
│
├── components/                     # All reusable React components
│   ├── ui/                         # shadcn/ui base components (do not modify)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── auth/                       # Auth-specific components
│   │   ├── OTPForm.tsx
│   │   └── SignUpForm.tsx
│   ├── booking/                    # Booking-flow components
│   │   ├── BookingCard.tsx
│   │   ├── BookingRequestForm.tsx
│   │   └── BookingStatus.tsx
│   ├── sitter/                     # Sitter-related components
│   │   ├── SitterCard.tsx
│   │   ├── SitterProfile.tsx
│   │   └── SitterReviews.tsx
│   ├── parent/                     # Parent-specific components
│   │   ├── PetProfileForm.tsx
│   │   └── PetCard.tsx
│   ├── chat/                       # In-app chat
│   │   ├── ChatWindow.tsx
│   │   └── MessageBubble.tsx
│   ├── map/                        # Map and location components
│   │   └── SearchMap.tsx
│   ├── admin/                      # Admin UI components
│   │   ├── VettingCard.tsx
│   │   └── MetricsWidget.tsx
│   └── shared/                     # Shared across all contexts
│       ├── AppHeader.tsx
│       ├── BottomNav.tsx
│       ├── LoadingSpinner.tsx
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       └── VerifiedBadge.tsx
│
├── lib/                            # Utilities, clients, helpers
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client
│   ├── prisma.ts                   # Prisma singleton
│   ├── razorpay.ts                 # Razorpay instance + helpers
│   ├── email.ts                    # Resend email helper functions
│   ├── geo.ts                      # Haversine distance, location utils
│   ├── push.ts                     # Web Push notification helpers
│   ├── money.ts                    # Paise/rupee conversion, formatting
│   ├── quiz.ts                     # Quiz questions data + scoring logic
│   └── utils.ts                    # General-purpose utilities (cn, etc.)
│
├── hooks/                          # Custom React hooks
│   ├── useAuth.ts                  # Current user + session
│   ├── useBooking.ts               # Booking state and actions
│   ├── useBookingChat.ts           # Realtime chat subscription
│   ├── usePhotoFeed.ts             # Realtime photo update subscription
│   └── useGeolocation.ts           # GPS location (browser geolocation)
│
└── types/                          # TypeScript type definitions
    ├── index.ts                    # Re-exports all types
    ├── booking.ts                  # Booking-related types
    ├── sitter.ts                   # Sitter-related types
    ├── parent.ts                   # Parent-related types
    └── api.ts                      # API request/response types
```

---

## Naming Conventions

### Files and Folders

| Type | Convention | Example |
|---|---|---|
| Pages (`page.tsx`) | lowercase, hyphenated | `sign-up/page.tsx` |
| API routes (`route.ts`) | lowercase, hyphenated | `create-order/route.ts` |
| React components | PascalCase `.tsx` | `SitterCard.tsx` |
| Hooks | camelCase with `use` prefix | `useBooking.ts` |
| Utilities / libs | camelCase `.ts` | `geo.ts`, `money.ts` |
| Types | camelCase `.ts` | `booking.ts` |
| Folders | lowercase, hyphenated | `booking-flow/` |
| Test files | same name + `.test.ts(x)` | `SitterCard.test.tsx` |

### Variables and Functions

| Type | Convention | Example |
|---|---|---|
| Variables | camelCase | `bookingStatus`, `sitterName` |
| Constants (file-level) | SCREAMING_SNAKE_CASE | `MAX_PHOTO_SIZE_BYTES` |
| Functions | camelCase, verb-first | `createBooking()`, `fetchSitters()` |
| React components | PascalCase | `SitterCard`, `BookingForm` |
| Types / Interfaces | PascalCase | `Booking`, `SitterProfile` |
| Enums | PascalCase | `BookingStatus.CONFIRMED` |
| Boolean variables | `is`, `has`, `can` prefix | `isLoading`, `hasReviews` |
| Event handlers | `handle` prefix | `handleSubmit`, `handleCancel` |

### Database (Prisma)

| Type | Convention | Example |
|---|---|---|
| Model names | PascalCase | `Booking`, `PetParent` |
| Field names | camelCase | `petParentId`, `createdAt` |
| Enum values | SCREAMING_SNAKE_CASE | `BOOKING_STATUS.IN_PROGRESS` |
| Relation fields | camelCase | `booking.parent`, `sitter.user` |

---

## What Goes Where — Decision Rules

**"Should this be a Server Component or Client Component?"**
- Default to **Server Component** — data fetching, no interactivity needed
- Use `"use client"` only when: state (`useState`), effects (`useEffect`), event handlers, browser APIs (GPS, localStorage), Supabase Realtime subscriptions

**"Should this logic be in the component or in `src/lib/`?"**
- Business logic → `src/lib/` (reusable, testable)
- Presentation logic → component
- Rule of thumb: if it could be tested without rendering, it belongs in `src/lib/`

**"Should this be a custom hook or inline in the component?"**
- More than 5 lines of stateful logic → extract to `src/hooks/`
- Any Supabase Realtime subscription → always extract to hook (cleanup matters)

**"Where do I put shared types?"**
- Types used by 2+ files → `src/types/[domain].ts`
- Types used only in one file → define at the top of that file
- Prisma-generated types → import directly from `@prisma/client`

---

## `docs/` Directory

```
docs/
├── 00-project-overview.md
├── 01-tech-stack.md
├── 02-data-model.md
├── 03-api-spec.md
├── 04-environment-setup.md
├── phases/
│   ├── phase-0-foundation.md
│   ├── phase-1-onboarding.md
│   ├── phase-2-search.md
│   ├── phase-3-booking.md
│   ├── phase-4-trust.md
│   └── phase-5-launch.md
├── decisions/
│   ├── adr-001-nextjs-fullstack.md
│   ├── adr-002-supabase.md
│   ├── adr-003-web-first.md
│   └── adr-004-free-tier-strategy.md
├── guidelines/                      ← YOU ARE HERE
│   ├── 01-project-structure.md
│   ├── 02-coding-standards.md
│   └── ...
└── linear/
    └── milestones.md
```

**Rule:** Every architectural decision → new ADR in `docs/decisions/`. Every new phase → new doc in `docs/phases/`. Never delete docs — update them with a "Updated: [date] — [reason]" note.
