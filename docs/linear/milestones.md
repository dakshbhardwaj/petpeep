# Linear Structure — PetPeep

This document defines how the project is organised in Linear: milestones, issue breakdown per phase, and labels.

---

## Milestones

Create these 6 milestones in Linear under the PetProject:

| # | Milestone Name | Target Date | Description |
|---|---|---|---|
| 1 | Phase 0 — Foundation | Week 2 | Infrastructure, auth, schema, deploy |
| 2 | Phase 1 — Onboarding | Week 5 | Both user types onboarded; admin vetting live |
| 3 | Phase 2 — Search & Discovery | Week 7 | Parents can find and browse sitters |
| 4 | Phase 3 — Booking & Payments | Week 10 | Full booking + payment flow working |
| 5 | Phase 4 — Trust Features | Week 13 | GPS check-in, photos, chat, reviews |
| 6 | Phase 5 — Beta Launch | Week 16 | SOS live; 200 beta users onboarded |

---

## Labels

Create these labels in Linear:

| Label | Colour | Used For |
|---|---|---|
| `p0-blocking` | Red | Issues that block the current milestone from completing |
| `p1-nice-to-have` | Orange | Post-launch improvements |
| `bug` | Red | Regressions or broken functionality |
| `feature` | Blue | New functionality |
| `tech-debt` | Grey | Refactoring, cleanup, performance |
| `design` | Purple | UI/UX changes |
| `backend` | Teal | API, database, server logic |
| `frontend` | Green | UI components, client-side logic |
| `infra` | Yellow | CI/CD, deployment, environment |
| `security` | Dark Red | Auth, access control, data protection |
| `payments` | Gold | Razorpay integration issues |
| `legal` | Navy | Compliance, vendor contracts, ID verification |

---

## Issue Breakdown — Phase 0 (Foundation)

**Milestone:** Phase 0 — Foundation

| Issue Title | Labels | Priority |
|---|---|---|
| Initialise Next.js 14 project with TypeScript | `infra`, `feature` | Urgent |
| Configure Tailwind with PetPeep design tokens | `frontend`, `design` | Urgent |
| Install and configure shadcn/ui base components | `frontend` | Urgent |
| Create Supabase project (dev + staging) | `infra`, `backend` | Urgent |
| Write full Prisma schema (all entities) | `backend`, `p0-blocking` | Urgent |
| Run `prisma db push` and verify all tables | `backend`, `p0-blocking` | Urgent |
| Implement email OTP sign-up flow | `backend`, `frontend`, `feature` | Urgent |
| Implement email OTP login flow | `backend`, `frontend`, `feature` | Urgent |
| Create auth middleware for protected routes | `backend`, `security` | Urgent |
| Build landing page (responsive) | `frontend`, `design` | High |
| Deploy to Vercel with custom domain | `infra`, `p0-blocking` | Urgent |
| Set up GitHub Actions CI (lint + type-check) | `infra` | High |
| Create `.env.example` and environment setup docs | `infra` | High |
| Create CLAUDE.md for AI context | `infra` | Medium |

---

## Issue Breakdown — Phase 1 (Onboarding)

**Milestone:** Phase 1 — Onboarding

| Issue Title | Labels | Priority |
|---|---|---|
| Pet parent onboarding wizard (multi-step form) | `frontend`, `feature` | Urgent |
| Pet profile creation form with behavioral profile fields | `frontend`, `backend`, `feature` | Urgent |
| Multiple pets per account support | `backend`, `feature` | High |
| Sitter application form (personal details + experience) | `frontend`, `feature` | Urgent |
| Aadhaar document upload (Supabase Storage) | `backend`, `feature` | Urgent |
| Pet care knowledge quiz (20 questions, 70% pass) | `backend`, `frontend`, `feature` | Urgent |
| 7-day quiz retry cooldown enforcement (server-side) | `backend` | High |
| ₹299 vetting fee payment (Razorpay test mode) | `payments`, `feature` | Urgent |
| Admin vetting queue dashboard | `frontend`, `backend`, `feature` | Urgent |
| Admin: approve/reject sitter with notes | `backend`, `feature` | Urgent |
| Email: application received confirmation | `backend`, `feature` | High |
| Email: application approved notification | `backend`, `feature` | High |
| Email: application rejected notification | `backend`, `feature` | High |
| Sitter profile page (read-only, post-approval) | `frontend`, `feature` | High |
| "New Sitter — Verified & Interviewed" badge | `frontend`, `design` | Medium |

---

## Issue Breakdown — Phase 2 (Search & Discovery)

**Milestone:** Phase 2 — Search & Discovery

| Issue Title | Labels | Priority |
|---|---|---|
| Sitter search API with PostGIS radius query | `backend`, `feature`, `p0-blocking` | Urgent |
| Search results page with sitter cards | `frontend`, `feature` | Urgent |
| Filter panel (date, radius, pet type, price, rating) | `frontend`, `feature` | High |
| Map view with Leaflet.js + OpenStreetMap | `frontend`, `feature` | High |
| Sitter profile page (full version with calendar) | `frontend`, `feature` | Urgent |
| Sitter availability calendar (read-only display) | `frontend`, `backend` | High |
| Seed data script (15 test sitters Mumbai + Pune) | `backend` | High |
| Search responsive layout (mobile + desktop) | `frontend`, `design` | Urgent |
| "Request a Booking" CTA on sitter profile | `frontend` | High |
| Search empty state (no sitters in radius) | `frontend` | Medium |
| Pagination on search results | `backend`, `frontend` | Medium |

---

## Issue Breakdown — Phase 3 (Booking & Payments)

**Milestone:** Phase 3 — Booking & Payments

| Issue Title | Labels | Priority |
|---|---|---|
| Booking request API (POST /api/bookings) | `backend`, `feature`, `p0-blocking` | Urgent |
| Booking request UI (service / date / pet / notes) | `frontend`, `feature` | Urgent |
| Sitter accept booking API | `backend`, `feature`, `p0-blocking` | Urgent |
| Sitter decline booking API | `backend`, `feature` | Urgent |
| 2-hour sitter response timeout (Supabase Edge Function) | `backend`, `infra`, `p0-blocking` | Urgent |
| Razorpay order creation on sitter accept | `payments`, `backend`, `p0-blocking` | Urgent |
| Razorpay Checkout integration (UPI + card) | `payments`, `frontend`, `p0-blocking` | Urgent |
| Razorpay payment signature verification webhook | `payments`, `backend`, `security` | Urgent |
| Cancellation policy logic (server-side) | `backend`, `feature` | Urgent |
| Razorpay refund initiation on cancellation | `payments`, `backend` | Urgent |
| Sitter payout 48hrs post-completion (Edge Function) | `payments`, `backend`, `p0-blocking` | Urgent |
| Parent booking dashboard (Upcoming / Past / Cancelled) | `frontend`, `feature` | High |
| Sitter booking dashboard (Requests / Upcoming / Past) | `frontend`, `feature` | High |
| Sitter earnings summary | `frontend`, `backend` | High |
| Browser Web Push notifications setup | `backend`, `frontend`, `feature` | High |
| Push: new booking request (sitter) | `backend` | High |
| Push: booking accepted → pay prompt (parent) | `backend` | High |
| Push: booking declined (parent) | `backend` | High |
| Push: booking auto-expired (parent) | `backend` | Medium |
| Push: payment confirmed (both) | `backend` | High |
| Email: booking confirmation (both) | `backend` | High |
| Email: booking reminder 24hrs before | `backend` | High |

---

## Issue Breakdown — Phase 4 (Trust Features)

**Milestone:** Phase 4 — Trust Features

| Issue Title | Labels | Priority |
|---|---|---|
| GPS check-in API (browser geolocation + ±200m verify) | `backend`, `feature`, `p0-blocking` | Urgent |
| Check-in UI (button on active booking) | `frontend`, `feature` | Urgent |
| GPS check-out API + end-of-visit report | `backend`, `feature`, `p0-blocking` | Urgent |
| Check-out UI with report form | `frontend`, `feature` | Urgent |
| Photo upload to Supabase Storage | `backend`, `frontend`, `feature`, `p0-blocking` | Urgent |
| Photo feed UI (parent view, realtime) | `frontend`, `feature` | Urgent |
| 60-minute photo reminder (Edge Function) | `backend`, `infra` | High |
| In-app chat (Supabase Realtime) | `backend`, `frontend`, `feature`, `p0-blocking` | Urgent |
| Chat UI (per-booking message thread) | `frontend`, `feature` | Urgent |
| Message read receipts | `backend`, `frontend` | Medium |
| Review form (post-visit, parent → sitter) | `frontend`, `feature`, `p0-blocking` | Urgent |
| Review submission API + sitter avgRating update | `backend`, `feature` | Urgent |
| Sitter reverse review (admin-only) | `backend`, `frontend` | Medium |
| Review prompt 1hr after check-out (push notification) | `backend` | High |
| Reviews displayed on sitter profile | `frontend` | High |
| Client-side image compression before upload | `frontend`, `tech-debt` | Medium |

---

## Issue Breakdown — Phase 5 (Beta Launch)

**Milestone:** Phase 5 — Beta Launch

| Issue Title | Labels | Priority |
|---|---|---|
| SOS button UI (visible on active bookings only) | `frontend`, `feature`, `p0-blocking` | Urgent |
| SOS trigger API + admin alert | `backend`, `feature`, `p0-blocking` | Urgent |
| Admin SOS dashboard (real-time, mark resolved) | `frontend`, `backend` | Urgent |
| Admin operations dashboard (GMV, fulfilment, NPS) | `frontend`, `backend` | High |
| Waitlist signup form on landing page | `frontend`, `feature` | High |
| Admin: send waitlist invites in batches | `backend`, `feature` | High |
| Rate limiting on OTP endpoints | `backend`, `security` | High |
| Zod input validation on all API routes | `backend`, `security` | High |
| Supabase RLS review (ensure correct access control) | `backend`, `security` | High |
| Sentry error monitoring setup | `infra` | High |
| Lighthouse performance audit + fixes | `frontend`, `tech-debt` | High |
| Razorpay KYC completion (business verification) | `payments`, `legal` | Urgent |
| Switch Razorpay to live mode in production | `payments`, `infra` | Urgent |
| End-to-end testing of full booking flow | `backend`, `frontend` | Urgent |
| End-to-end testing of cancellation + refund | `payments` | Urgent |
| Security checklist review (auth, payments, docs) | `security` | Urgent |
| Mobile browser testing (Chrome Android, Safari iOS) | `frontend` | High |

---

## Recommended Linear Views

Set up these saved views in Linear for efficient project tracking:

1. **My Issues** — assignee = me, status = in progress or todo
2. **This Sprint** — current milestone, sorted by priority
3. **P0 Blockers** — label = `p0-blocking`, status ≠ done
4. **Payment Issues** — label = `payments`
5. **Security Queue** — label = `security`, status ≠ done
6. **All Active** — status = in progress, all assignees
