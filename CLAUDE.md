# PetPeep — Claude Code Context

## What is this?

PetPeep is a pet home-stay marketplace for urban India. It's a two-sided platform connecting verified pet sitters with urban pet parents for drop-in pet sitting visits in Mumbai and Pune. Think Rover, but built for India — community-trust model, not algorithmic-stranger-matching.

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL) via Prisma ORM
- **Auth:** Supabase Auth (email OTP)
- **Storage:** Supabase Storage
- **Realtime:** Supabase Realtime (chat + photo updates)
- **Payments:** Razorpay (UPI + cards, India-first)
- **Maps:** Leaflet.js + OpenStreetMap
- **Email:** Resend
- **Deploy:** Vercel

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Sign-up
│   ├── (parent)/        # Pet parent dashboard, pets, search, bookings
│   ├── (sitter)/        # Sitter dashboard, application, bookings
│   ├── (admin)/         # Admin: vetting queue, bookings, SOS, metrics
│   └── api/             # All API routes
├── components/          # Shared React components
├── lib/
│   ├── prisma.ts        # Prisma client singleton
│   ├── supabase/        # Supabase client (browser + server)
│   ├── razorpay.ts      # Razorpay utilities
│   └── email.ts         # Resend email helpers
├── hooks/               # Custom React hooks
└── types/               # TypeScript types
prisma/
└── schema.prisma        # Full database schema
```

## Key Business Rules

- Platform commission: **15%** deducted from sitter payout. Parents pay face value with zero booking fee.
- Sitter acceptance rate target: **≤25%** of applicants
- Sitter payout: **48 hours** after booking completion via Razorpay Transfer
- Booking timeout: sitter must respond within **2 hours** or booking auto-cancels
- GPS check-in tolerance: **±200 metres**
- Photo update required: minimum **1 per 60 minutes** during active visit
- Cancellation: full refund >24hrs; 50% refund 6–24hrs; no refund <6hrs

## Monetary Amounts

All monetary amounts are stored in **paise** (integer). `1 INR = 100 paise`. Display: `amount / 100` → `₹500`.

## User Types

Three user types in the `User` table:
- `PARENT` — pet parents (demand side)
- `SITTER` — pet sitters (supply side)
- `ADMIN` — platform staff (internal)

## Two Supabase Clients

Always use the right client:
- `src/lib/supabase/client.ts` — browser-side (Auth, Realtime subscriptions)
- `src/lib/supabase/server.ts` — server-side (Server Components, API routes)
- Prisma client (`src/lib/prisma.ts`) — all DB queries (not Supabase's built-in query client)

## Auth Pattern

```typescript
// In Server Components / API routes:
import { createServerClient } from "@/lib/supabase/server"
const supabase = createServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect("/login")
```

## API Route Pattern

```typescript
// src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({ ... })

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = schema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })

  const result = await prisma.[model].[operation](...)
  return NextResponse.json({ result })
}
```

## Current Phase

Check `README.md` → Project Status table for the current development phase.

## Documentation

Full documentation in `docs/`:
- `docs/00-project-overview.md` — vision, problem, personas
- `docs/01-tech-stack.md` — all technology decisions
- `docs/02-data-model.md` — full Prisma schema + entity relationships
- `docs/03-api-spec.md` — all API endpoints
- `docs/04-environment-setup.md` — local setup guide
- `docs/phases/` — detailed task breakdown per phase
- `docs/decisions/` — architecture decision records
- `docs/linear/milestones.md` — Linear issue structure

## Do Not

- Do not use Supabase's built-in query client for DB queries — use Prisma
- Do not store monetary amounts in rupees (float) — use paise (integer)
- Do not skip Zod validation on API routes
- Do not compute quiz scores on the client — always server-side
- Do not commit `.env.local` to git
- Do not use Google Maps (use Leaflet.js + OpenStreetMap — it's free)
