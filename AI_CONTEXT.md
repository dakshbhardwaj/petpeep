# PetPeep — AI Agent Context & Reference

> **How to use this file:** Share this document with any AI agent before starting any task.
> Then simply describe your problem or task. No long prompt needed.
>
> Last updated: May 2026

---

## 1. What Is PetPeep?

**One line:** PetPeep is India's first verified pet home-stay marketplace — connecting urban pet parents with trusted, vetted sitters for drop-in pet care in Mumbai and Pune.

**The problem it solves:** Urban Indian pet parents (70% first-time owners) have no reliable alternative to boarding kennels when they travel. Existing options are unvetted, informal, or concentrated in Bengaluru. PetPeep fills this gap.

**The model:**
- Two-sided marketplace: Pet Parents (demand) ↔ Sitters (supply)
- Platform earns 15% commission on each booking, deducted from sitter payout
- Zero booking fee for pet parents (key differentiator)
- Rigorous sitter vetting: Aadhaar ID + pet care quiz + admin review (20–25% acceptance rate)
- Trust layer: GPS check-in, hourly photo updates, in-app chat, emergency vet support

**What's in scope for v1 (MVP):**
- Drop-in pet sitting only (1hr / 2hr / 4hr visits)
- Mumbai and Pune only
- Web application — responsive, mobile-compatible
- Three user types: Pet Parent, Sitter, Admin

**What's explicitly NOT in scope for v1:**
- Dog walking, overnight boarding, grooming, vet consultation
- Native mobile apps (web-first)
- City expansion beyond Mumbai and Pune
- Community/social features

**Mission:** Make every pet owner in India feel confident leaving their pet in someone else's care.  
**Tagline:** Your pet, always in safe paws.

---

## 2. Tech Stack (Quick Reference)

| Layer | Tool | Notes |
|---|---|---|
| Framework | **Next.js 14** (App Router, TypeScript) | Full-stack — frontend + API routes in one |
| Styling | **Tailwind CSS** + **shadcn/ui** | Design tokens in `tailwind.config.ts` |
| Database | **Supabase** (PostgreSQL) | Free tier; managed via Prisma ORM |
| ORM | **Prisma** | Type-safe, migration-managed |
| Auth | **Supabase Auth** | Email OTP for MVP; phone OTP in Phase 2 |
| Storage | **Supabase Storage** | Pet photos, vaccination docs, sitter photos |
| Realtime | **Supabase Realtime** | In-app chat + live photo update feed |
| Payments | **Razorpay** | UPI + cards; 15% commission; sitter payouts |
| Maps | **Leaflet.js + OpenStreetMap** | Free, no API key needed |
| Email | **Resend** | Transactional (OTP, confirmations, reminders) |
| Deployment | **Vercel** | Free hobby tier; auto-deploys from `main` |
| CI/CD | **GitHub Actions** | Lint + type-check + tests on every PR |
| Error tracking | **Sentry** | Free tier, 5K errors/month |

**Everything is free-tier or open-source.** The only unavoidable cost is Razorpay's per-transaction fee (~2% + GST).

**Do not introduce new dependencies without flagging for human approval first.**

---

## 3. Project Location & Structure

**Root:** `/Users/daksh/workspace/pesonal/petpeep/`

```
petpeep/
├── AI_CONTEXT.md          ← You are here. Share this with every AI.
├── CLAUDE.md              ← Claude Code-specific context (points here)
├── CONTRIBUTING.md        ← Master rules (human-readable summary)
├── README.md              ← Project overview + all doc links
│
├── src/
│   ├── app/
│   │   ├── (auth)/        ← Login, sign-up pages
│   │   ├── (parent)/      ← Pet parent dashboard, pets, search, bookings
│   │   ├── (sitter)/      ← Sitter dashboard, application, bookings
│   │   ├── (admin)/       ← Admin: vetting queue, metrics, SOS
│   │   ├── sitters/       ← Public sitter profiles (no auth)
│   │   ├── api/           ← All API route handlers
│   │   ├── layout.tsx
│   │   └── page.tsx       ← Landing page
│   ├── components/
│   │   ├── ui/            ← shadcn/ui base components (never modify)
│   │   ├── shared/        ← Used everywhere (Header, EmptyState, etc.)
│   │   ├── booking/       ← Booking flow components
│   │   ├── sitter/        ← Sitter cards, profiles, reviews
│   │   ├── parent/        ← Pet profile forms, parent-specific UI
│   │   ├── chat/          ← Chat window + message bubbles
│   │   ├── map/           ← Leaflet map components
│   │   └── admin/         ← Admin UI components
│   ├── lib/
│   │   ├── prisma.ts      ← Prisma client singleton
│   │   ├── supabase/      ← client.ts (browser) + server.ts (server)
│   │   ├── razorpay.ts    ← Razorpay helpers
│   │   ├── email.ts       ← Resend email helpers
│   │   ├── money.ts       ← Paise/rupee helpers (ALWAYS use this)
│   │   ├── geo.ts         ← Haversine distance calculation
│   │   ├── push.ts        ← Web Push notification helpers
│   │   └── utils.ts       ← General utilities (cn, etc.)
│   ├── hooks/             ← useAuth, useBooking, useBookingChat, etc.
│   └── types/             ← TypeScript type definitions
│
├── prisma/
│   └── schema.prisma      ← Full database schema (source of truth)
├── docs/
│   ├── 00-project-overview.md
│   ├── 01-tech-stack.md
│   ├── 02-data-model.md      ← Full schema + entity relationships
│   ├── 03-api-spec.md        ← All API endpoints documented
│   ├── 04-environment-setup.md
│   ├── phases/               ← phase-0 through phase-5
│   ├── decisions/            ← ADR-001 through ADR-004
│   └── guidelines/           ← 01 through 10 (detailed rules)
└── .env.example              ← All required env vars listed here
```

---

## 4. Database — Core Entities

All amounts in **paise** (integer). `₹500 = 50000 paise`. Never rupees.  
All IDs are `cuid()`. All timestamps are UTC.

```
User            id, email, phone, name, profilePhoto, userType (PARENT|SITTER|ADMIN)
PetParent       userId→User, city, latitude, longitude, preferredRadius
Sitter          userId→User, vettingStatus, bio, acceptsDogs, acceptsCats,
                hourlyRate1Hr, hourlyRate2Hr, hourlyRate4Hr, avgRating, totalReviews
SitterApplication   sitterId, aadhaarDocUrl, quizScore, quizPassed, status
SitterAvailability  sitterId, date, isAvailable, slots
Pet             parentId→PetParent, name, species (DOG|CAT|OTHER), breed,
                hasEverBitten, fearTriggers, resourceGuarding, behavioralNotes
Booking         parentId, sitterId, pets[], serviceType, date, startTime,
                status (PENDING|CONFIRMED|IN_PROGRESS|COMPLETED|CANCELLED),
                totalAmount (paise), platformFee, sitterEarnings,
                razorpayOrderId, razorpayPaymentId, sitterResponseDeadline
BookingEvent    bookingId, type (CHECK_IN|CHECK_OUT), latitude, longitude, gpsVerified
PhotoUpdate     bookingId, sitterId, photoUrl, sentAt
Message         bookingId, senderId→User, content, sentAt, readAt
Review          bookingId, reviewerId, direction (PARENT_TO_SITTER|SITTER_TO_PARENT),
                rating (1-5), comment, isPublic
Payout          bookingId, sitterId, amount, status (PENDING|PROCESSING|COMPLETED)
SOSAlert        bookingId, triggeredById, triggeredAt, resolvedAt
```

Full Prisma schema: `prisma/schema.prisma`  
Full entity docs: `docs/02-data-model.md`

---

## 5. Key Business Rules (Non-Negotiable)

These rules come from the PRD and are sacrosanct:

| Rule | Value | Where it applies |
|---|---|---|
| Platform commission | 15% of booking value | All completed bookings |
| Parent booking fee | ₹0 (zero) | Parents never pay a fee — commission from sitter only |
| Sitter vetting fee | ₹299 (one-time) | Paid on application via Razorpay |
| Sitter acceptance rate | ≤25% of applicants | Admin vetting decisions |
| Sitter payout timing | 48 hours after completion | Razorpay Transfer job |
| Booking timeout | 2 hours to accept/decline | Auto-cancel if sitter doesn't respond |
| GPS check-in tolerance | ±200 metres | Browser Geolocation API |
| Photo update frequency | Minimum 1 per 60 minutes | During IN_PROGRESS bookings |
| Cancellation: full refund | >24 hours before visit | Razorpay refund |
| Cancellation: 50% refund | 6–24 hours before visit | Razorpay refund |
| Cancellation: no refund | <6 hours before visit | No refund initiated |
| Quiz pass mark | 70% (14/20 questions) | Sitter onboarding |
| Quiz retry cooldown | 7 days | After failed attempt |
| Sitter profile visible | Only when vettingStatus = APPROVED | Search + public profile |

---

## 6. Standard Code Patterns

### API Route Pattern (copy this every time)

```typescript
// src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  // define input shape here
})

export async function POST(request: NextRequest) {
  try {
    // 1. Auth — always first
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 2. Validate input
    const body = schema.safeParse(await request.json())
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 })
    }

    // 3. Business logic (in src/lib/ — not inline)
    const result = await someLibFunction(user.id, body.data)

    // 4. Return
    return NextResponse.json({ result }, { status: 201 })

  } catch (error) {
    console.error("[POST /api/resource]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

### React Component Pattern

```typescript
// src/components/[domain]/ComponentName.tsx

// "use client"  ← Only if needed. Add comment explaining why.

import type { SomeType } from "@/types/..."

type ComponentNameProps = {
  // explicit props
  className?: string  // always accept className
}

export function ComponentName({ prop, className }: ComponentNameProps) {
  // 1. Hooks
  // 2. Derived values
  // 3. Event handlers
  // 4. Early returns (loading, error, empty)
  // 5. Main render

  return <div className={`base-styles ${className ?? ""}`}>...</div>
}
```

### Lib Function Pattern

```typescript
// src/lib/[domain].ts

/**
 * JSDoc comment explaining what this does and why.
 * @param param - description (units if applicable, e.g. paise)
 * @returns description (units if applicable)
 */
export async function doSomething(param: Type): Promise<ReturnType> {
  try {
    // logic here
  } catch (error) {
    console.error("[doSomething]", error)
    throw error  // or return null — decide explicitly
  }
}
```

### Money Helpers (always use these — never raw arithmetic)

```typescript
import { money } from "@/lib/money"

money.toPaise(500)              // 50000     (user input ₹ → storage)
money.format(50000)             // "₹500"    (display only)
money.commission(50000)         // 7500      (15% platform fee)
money.sitterEarnings(50000)     // 42500     (total - commission)
```

### Auth in Server Components / API Routes

```typescript
import { createServerClient } from "@/lib/supabase/server"

const supabase = createServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect("/login")  // or return 401 in API routes
```

---

## 7. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files: pages, routes | lowercase-hyphen | `sign-up/page.tsx`, `create-order/route.ts` |
| Files: components | PascalCase | `SitterCard.tsx` |
| Files: hooks | camelCase, `use` prefix | `useBooking.ts` |
| Files: lib/utils | camelCase | `money.ts`, `geo.ts` |
| Variables | camelCase | `bookingStatus`, `sitterName` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PHOTO_SIZE_BYTES` |
| Functions | camelCase, verb-first | `createBooking()`, `fetchSitters()` |
| React components | PascalCase | `SitterCard`, `BookingForm` |
| Types/Interfaces | PascalCase | `Booking`, `SitterProfile` |
| Boolean vars | `is/has/can` prefix | `isLoading`, `hasReviews` |
| Event handlers | `handle` prefix | `handleSubmit`, `handleCancel` |
| DB models | PascalCase | `Booking`, `PetParent` |
| DB fields | camelCase | `petParentId`, `createdAt` |
| Imports: always `@/` | never relative deep | `@/lib/prisma` not `../../../lib/prisma` |

---

## 8. Coding Rules (Critical)

### TypeScript
- Never use `any` → use `unknown` and narrow, or define a proper type
- Explicit return types on all non-trivial functions
- Never use non-null assertion `!` → handle null explicitly

### React
- Default to **Server Components** — add `"use client"` only for state/effects/browser APIs
- Always `"use client"` comment: explain why
- **Named exports** for all components (`export function X`, never `export default function X`)
  - Exception: `page.tsx` and `layout.tsx` must use default exports (Next.js requirement)

### Money — CRITICAL
- **Store in paise (integer)** — never floats, never rupees in the DB
- **Use `src/lib/money.ts` helpers** for all calculations
- `platformFee + sitterEarnings === totalAmount` must always be true

### API Routes
- Auth check is **always first**, before any DB query
- Validate all input with **Zod** — never trust the client
- Business logic in `src/lib/` — route handlers are thin orchestrators

### Imports
- Always use `@/` alias
- Order: React/Next → external packages → `@/lib` → `@/components` → types

### Forbidden Patterns
- `any` type
- `console.log` (use `console.error` for errors; remove debug logs)
- Hardcoded secrets, API keys, or URLs
- `parseFloat()` on money values
- Nested ternaries > 2 levels
- `dangerouslySetInnerHTML`
- Commenting out code (delete it — git has history)

---

## 9. Git Workflow (Quick Reference)

### Branch naming
```
feature/HR-[id]-short-description    ← new functionality
fix/HR-[id]-short-description        ← bug fixes
docs/HR-[id]-short-description       ← docs only
refactor/HR-[id]-short-description   ← no functional change
hotfix/HR-[id]-short-description     ← critical production fix (from main)
```

### Commit format
```
type(scope): imperative description

Types:  feat | fix | refactor | docs | test | chore | perf | style
Scopes: auth | booking | sitter | parent | search | payments | chat | photos | admin | api | db | ui | infra
```

Examples:
```
feat(auth): add email OTP sign-up flow
fix(booking): prevent duplicate Razorpay order on payment retry
docs(api-spec): add photo upload endpoint
```

### Branch flow
```
feature/* → dev (PR + squash merge)
dev → staging (PR + smoke test)
staging → main (PR + final review → auto-deploy to production)
```

**Never commit directly to `main` or `dev`.**

---

## 10. Feature Development Order (Always Follow This)

```
1. Schema       → Update prisma/schema.prisma if DB change needed
2. API          → Build and test the endpoint (curl/Postman before UI)
3. Lib logic    → Extract business logic to src/lib/
4. UI           → Build component (mobile-first, 375px)
5. Tests        → Unit tests for lib functions + edge cases
6. Docs         → Update API spec, phase doc, data model if changed
7. PR           → Fill template, link Linear issue, request review
```

Never build UI before the API works. Never build API before schema is stable.

---

## 11. Component Standards (Quick Reference)

- **Mobile-first** — build at 375px, add responsive variants for desktop
- **Skeleton variants** required for every data-dependent component (`ComponentNameSkeleton`)
- **Empty states** required for every list or search result
- **Error states** required for every async operation
- Always handle: loading → empty → error → data states
- Touch targets ≥ 44×44px on mobile
- All images need descriptive `alt` text
- Form fields need associated `<label>` — never use placeholder as label

### Design tokens (from `tailwind.config.ts`)
```
Primary (Caring Teal):     bg-primary, text-primary     (#005a71)
Secondary (Sunny Orange):  bg-secondary, text-secondary  (#855300)
Background:                bg-background                  (#f8f9ff)
Surface:                   bg-surface-container           (#e5eeff)
Text:                      text-on-surface                (#0b1c30)
Fonts:    Headlines → font-display (Quicksand)
          Body → font-body (Inter, default)
Radius:   Cards → rounded-card (16px)   Buttons → rounded-button (8px)
Spacing:  Always 8px scale: p-2(8) p-3(12) p-4(16) p-6(24) p-8(32)
```

---

## 12. Documentation Rules (Quick Reference)

| Change | Where to document |
|---|---|
| New API endpoint | `docs/03-api-spec.md` |
| Schema change | `docs/02-data-model.md` |
| Architectural decision | New ADR in `docs/decisions/adr-XXX.md` |
| Phase task completed | Check off in `docs/phases/phase-X.md` |
| New env variable | `.env.example` + `docs/04-environment-setup.md` |
| New dependency | `docs/01-tech-stack.md` |

Write comments for **why**, not what. JSDoc on all exported `src/lib/` functions.  
Documentation is part of the PR — not "done later."

---

## 13. Current Project Status

| Phase | Status |
|---|---|
| Phase 0 — Foundation (infra, auth, schema) | Not started |
| Phase 1 — Onboarding (parent + sitter + admin) | Not started |
| Phase 2 — Search & Discovery | Not started |
| Phase 3 — Booking & Payments | Not started |
| Phase 4 — Trust Features (GPS, chat, reviews) | Not started |
| Phase 5 — Beta Launch | Not started |

**Current phase:** Phase 0 — Foundation  
**Detailed task breakdown:** `docs/phases/phase-0-foundation.md`

---

## 14. AI Agent Rules

### Before writing any code
1. Read the relevant phase doc: `docs/phases/phase-X.md`
2. Check `docs/02-data-model.md` for the entities involved
3. Check `docs/03-api-spec.md` for existing or related endpoints
4. Look in `src/lib/` for existing patterns to follow

### Always do
- Follow the API route pattern in Section 6 of this document
- Use Zod validation on every API route
- Use `@/lib/money.ts` for all monetary calculations
- Use named exports for all components
- Handle loading, empty, and error states in every component
- Include a comment when adding `"use client"`
- Use `@/` import aliases

### Never do
- Modify `prisma/schema.prisma` unless explicitly instructed
- Introduce new npm dependencies without flagging for approval
- Hardcode secrets, API keys, or environment-specific values
- Compute quiz scores or payment amounts client-side
- Use `any` type
- Generate placeholder/TODO code — surface ambiguity as a question
- Build features from phases that haven't started
- Skip error handling in async functions

### Prompt format for best results
```
[Reference: AI_CONTEXT.md]
Phase: [current phase]
Task: [specific, single-sentence description]
File(s) to create/modify: [list them]
Relevant spec: docs/phases/phase-X.md → [section]
Acceptance criteria:
- Given [condition], when [action], then [result]
```

---

## 15. Quick Reference — Where Everything Lives

| Need | Go to |
|---|---|
| Product vision + personas | `docs/00-project-overview.md` |
| All technology decisions | `docs/01-tech-stack.md` |
| Full database schema | `prisma/schema.prisma` + `docs/02-data-model.md` |
| All API endpoints | `docs/03-api-spec.md` |
| Local setup instructions | `docs/04-environment-setup.md` |
| Current phase tasks | `docs/phases/phase-0-foundation.md` |
| Why Next.js was chosen | `docs/decisions/adr-001-nextjs-fullstack.md` |
| Why Supabase was chosen | `docs/decisions/adr-002-supabase.md` |
| Why web before native app | `docs/decisions/adr-003-web-first.md` |
| Free tools strategy | `docs/decisions/adr-004-free-tier-strategy.md` |
| Full project structure | `docs/guidelines/01-project-structure.md` |
| Detailed coding rules | `docs/guidelines/02-coding-standards.md` |
| Git + PR process | `docs/guidelines/03-git-workflow.md` |
| Documentation standards | `docs/guidelines/04-documentation-rules.md` |
| Feature development steps | `docs/guidelines/05-feature-development-process.md` |
| Component patterns | `docs/guidelines/06-component-standards.md` |
| Testing approach | `docs/guidelines/07-testing-practices.md` |
| AI collaboration guide | `docs/guidelines/08-ai-collaboration.md` |
| Architecture principles | `docs/guidelines/09-architecture-principles.md` |
| Deployment + CI/CD | `docs/guidelines/10-deployment-practices.md` |
| Linear milestone structure | `docs/linear/milestones.md` |
| Master contributing rules | `CONTRIBUTING.md` |

---

*PetPeep AI Context — v1.0 — Keep this file updated whenever patterns or rules change.*
