# Tech Stack — PetPeep

**Principle:** Free tools first. Paid only when they provide clear, measurable value that free alternatives cannot match at MVP scale.

---

## Stack at a Glance

| Layer | Tool | Tier | Why |
|---|---|---|---|
| Framework | Next.js 14 (App Router) | Free / Open Source | Full-stack in one repo; React frontend + API routes; Vercel-native |
| Styling | Tailwind CSS | Free / Open Source | Utility-first; matches the 8px design system; no runtime cost |
| UI Components | shadcn/ui | Free / Open Source | Copy-paste components built on Radix UI; fully customisable |
| Database | Supabase (PostgreSQL) | Free tier | 500MB DB, Realtime, Auth, Storage all in one free tier |
| ORM | Prisma | Free / Open Source | Type-safe schema; migrations; works perfectly with Supabase PG |
| Auth | Supabase Auth | Free tier | Email OTP out of the box; phone OTP via Twilio later |
| File Storage | Supabase Storage | Free tier (1GB) | Pet photos, vaccination docs, sitter profile images |
| Real-time | Supabase Realtime | Free tier | In-app chat, live photo update notifications |
| Payments | Razorpay | Transaction % only | Best UPI support in India; free to set up; 2% + GST per transaction |
| Maps & Location | Leaflet.js + OpenStreetMap | Free / Open Source | No API key needed; no usage limits; sufficient for MVP |
| Push Notifications | Browser Web Push API | Free | Native browser notifications; no third-party service needed for web |
| Email (transactional) | Resend | Free (3,000/month) | Booking confirmations, OTP, system emails |
| Deployment | Vercel | Free hobby tier | Zero-config Next.js deployment; custom domain support |
| Version Control | GitHub | Free | Source control and CI/CD via GitHub Actions |
| CI/CD | GitHub Actions | Free (2,000 min/month) | Automated tests and lint on pull requests |
| Error Monitoring | Sentry | Free tier (5K errors/month) | Catches runtime errors in production |
| Analytics | Vercel Analytics | Free (hobby) | Basic page views and web vitals |

---

## Detailed Decisions

### Next.js 14 (App Router)

**What it does:** Single framework for frontend pages, server-side rendering, and API routes. No separate backend service needed for MVP.

**Free tier:** Completely open source. No cost.

**Why not separate backend:**
- Fewer services to maintain and deploy
- API routes in `/app/api/` handle all backend logic
- Server Components reduce client-side JavaScript
- Natural path to edge functions if needed later

**Key conventions used:**
- App Router (not Pages Router)
- Server Components by default, Client Components only when state/interactivity needed
- Route Groups `(auth)`, `(parent)`, `(sitter)`, `(admin)` for layout isolation
- Server Actions for form submissions

---

### Supabase

**What it replaces:** Database hosting + managed auth + file storage + real-time subscriptions — all in one free tier.

**Free tier limits:**
- 500MB database storage
- 1GB file storage
- 50,000 monthly active users
- 2 million realtime messages/month
- Sufficient for MVP (target: 200 beta users)

**Services used:**
1. **PostgreSQL** — primary database via Prisma ORM
2. **Supabase Auth** — email OTP sign-up/login; phone OTP added later via Twilio
3. **Supabase Storage** — pet photos, vaccination documents, sitter profile images, photo updates
4. **Supabase Realtime** — in-app chat (parent ↔ sitter per booking), live photo update delivery

**Client setup:** Two clients used
- `supabase-js` for Auth and Realtime on the client side
- Prisma for all database queries (type-safe, migration-managed)

---

### Razorpay

**What it does:** Processes all payments — UPI (Google Pay, PhonePe, Paytm), debit/credit cards. Handles sitter payouts via Razorpay Transfers.

**Free tier:** Free to create account and test. Live transactions charged at ~2% + 18% GST.

**This is the only tool with unavoidable transaction costs.** All payment gateways in India charge per transaction. Razorpay offers the best UPI experience and payout API for India.

**Features used:**
- Payment links / Razorpay Checkout for booking payments
- Razorpay Transfers for automated sitter payouts (48hrs post-completion)
- Razorpay Webhooks for payment status updates

---

### Leaflet.js + OpenStreetMap

**What it does:** Renders maps for location-based sitter search. Shows sitters within a radius of the parent's location.

**Free tier:** Completely free. No API key. No usage limits.

**Why not Google Maps:**
- Google Maps requires billing account and costs after $200/month free credit
- Leaflet + OpenStreetMap is sufficient for MVP-scale map display
- Can migrate to Google Maps if advanced features are needed later

**Location features covered:**
- Displaying sitter locations on a map
- Radius-based search (using PostGIS `ST_DWithin` on the database side)
- Browser Geolocation API (free, built-in) for GPS check-in verification during visits

---

### Resend (Email)

**What it does:** Sends transactional emails — booking confirmations, OTP fallback, review reminders.

**Free tier:** 3,000 emails/month, 100/day. Sufficient for MVP.

**Email types:**
- OTP verification (fallback when WhatsApp OTP not configured)
- Booking confirmation (parent + sitter)
- Booking reminder (24hrs before)
- Review prompt (post-visit)
- Sitter application status update (approved/rejected)
- Payout notification

---

### Tailwind CSS + shadcn/ui

**What it does:** Tailwind provides utility-first CSS. shadcn/ui provides accessible, customisable components built on Radix UI.

**Free tier:** Both are fully open source with no cost.

**Design system mapping (from Stitch DESIGN.md):**
- Primary (Caring Teal): `#005a71` → configured as `primary` in Tailwind config
- Secondary (Sunny Orange): `#855300` → configured as `secondary`
- Background: `#f8f9ff`
- Typography: Quicksand (headings) + Inter (body) via Google Fonts (free)
- Spacing: 8px base scale matches Tailwind's default spacing scale
- Border radius: `rounded-2xl` (16px) for cards, `rounded-lg` (8px) for buttons

---

## Environment Variables

All secrets are stored in environment variables. Never commit to source control.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Supabase PostgreSQL connection string)
DATABASE_URL=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# Email (Resend)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NEXTAUTH_SECRET=
ADMIN_EMAIL=
```

---

## What Gets Added Later (Not in MVP)

| Tool | Purpose | When |
|---|---|---|
| Twilio / msg91 | WhatsApp OTP for phone-based sign-up | Phase 2 |
| Google Maps API | Advanced maps, directions, address autocomplete | Phase 2 |
| AuthBridge / IDFY | Automated Aadhaar ID verification | Post-legal review |
| FCM (Firebase) | Native push notifications if native app built | Phase 3 (native app) |
| HDFC Ergo / Bajaj Allianz | Sitter injury insurance bundled per booking | Phase 1 post-launch |
| PostHog | Product analytics, funnels, session recording | Phase 2 |
| Intercom / Crisp | Support chat widget | Phase 2 |

---

## Free Tier Risk Management

The following free tiers have limits to watch as the platform scales:

| Service | Free Limit | Upgrade Trigger |
|---|---|---|
| Supabase DB | 500MB | When DB approaches 300MB |
| Supabase Storage | 1GB | When photo uploads approach 750MB |
| Supabase MAU | 50,000 | At 30,000 active users |
| Vercel | 100GB bandwidth | If bandwidth exceeds 80GB/month |
| Resend | 3,000 emails/month | When email volume exceeds 2,000/month |
| GitHub Actions | 2,000 min/month | If CI runs exceed 1,500 min/month |
| Sentry | 5,000 errors/month | At consistent error volumes |

At MVP scale (200 beta users → 500 users), none of these limits will be hit. Monitor monthly and upgrade when genuinely needed.
