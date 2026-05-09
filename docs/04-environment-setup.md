# Environment Setup — PetPeep

Local development setup guide for all contributors.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| npm | 10+ | Included with Node.js |
| Git | Any | [git-scm.com](https://git-scm.com) |

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/[org]/petpeep.git
cd petpeep
npm install
```

---

## Step 2 — Create Environment File

```bash
cp .env.example .env.local
```

Fill in the values (see below for where to get each one).

---

## Step 3 — Supabase Setup (Free)

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Name it `petpeep-dev`
3. Choose a database password (save it securely)
4. Select region: `ap-south-1` (Mumbai — closest to India)
5. Once created, go to **Settings → API**:
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`
6. Go to **Settings → Database → Connection string → URI**:
   - Copy the URI → `DATABASE_URL` (replace `[YOUR-PASSWORD]` with your DB password)

---

## Step 4 — Run Database Migrations

```bash
# Generate Prisma client from schema
npx prisma generate

# Push schema to Supabase (creates all tables)
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

---

## Step 5 — Razorpay Setup (Free — Test Mode)

1. Go to [razorpay.com](https://razorpay.com) → Sign up (free)
2. You'll start in test mode — no real money charged
3. Go to **Settings → API Keys → Generate Test Key**
4. Copy:
   - `Key ID` → `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `Key Secret` → `RAZORPAY_KEY_SECRET`

---

## Step 6 — Resend Setup (Free)

1. Go to [resend.com](https://resend.com) → Sign up (free)
2. Create an API key → `RESEND_API_KEY`
3. For local dev, you can use the test domain — no DNS setup required

---

## Step 7 — Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Full `.env.example`

```env
# ─── Supabase ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ─── Database ─────────────────────────────────────────────────────────────────
# Supabase PostgreSQL connection string (from Settings > Database)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# ─── Razorpay ─────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# ─── Email (Resend) ───────────────────────────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@petpeep.in

# ─── App ─────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
ADMIN_EMAIL=admin@petpeep.in

# ─── Optional: Phone OTP (add later) ─────────────────────────────────────────
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_PHONE_NUMBER=
```

---

## Useful Commands

```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format

# Run tests
npm run test

# Open Prisma Studio (DB viewer)
npx prisma studio

# Generate Prisma client (after schema changes)
npx prisma generate

# Push schema changes to DB (dev only — use migrations in production)
npx prisma db push

# Create a new migration (for production-ready changes)
npx prisma migrate dev --name describe-what-changed

# Open Supabase dashboard
# Go to: https://supabase.com/dashboard
```

---

## Project Structure

```
petpeep/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Login, Sign-up pages
│   │   │   ├── login/page.tsx
│   │   │   └── sign-up/page.tsx
│   │   ├── (parent)/                # Pet parent dashboard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── pets/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   └── bookings/page.tsx
│   │   ├── (sitter)/                # Sitter dashboard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── apply/page.tsx
│   │   │   └── bookings/page.tsx
│   │   ├── (admin)/                 # Admin dashboard (protected)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── vetting/page.tsx
│   │   │   └── bookings/page.tsx
│   │   ├── api/                     # API route handlers
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── sitters/
│   │   │   ├── payments/
│   │   │   └── admin/
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Landing page
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── auth/
│   │   ├── booking/
│   │   ├── sitter/
│   │   ├── parent/
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser Supabase client
│   │   │   └── server.ts            # Server Supabase client
│   │   ├── prisma.ts                # Prisma client singleton
│   │   ├── razorpay.ts              # Razorpay utilities
│   │   ├── email.ts                 # Resend email helpers
│   │   └── utils.ts                 # General utilities
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBooking.ts
│   │   └── useRealtime.ts
│   └── types/
│       └── index.ts                 # TypeScript types
├── prisma/
│   └── schema.prisma
├── public/
├── docs/
├── .env.example
├── .env.local                       # Never commit this
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Branching Strategy

```
main          → production (Vercel auto-deploys)
staging       → staging environment
dev           → integration branch

feature/xxx   → individual feature branches (branch from dev)
fix/xxx       → bug fixes (branch from dev or main if hotfix)
```

**Pull request flow:**
1. Create feature branch from `dev`
2. Open PR → `dev`
3. At least one review required
4. Merge to `dev` → staging auto-deploys
5. Merge `dev` → `main` for production release

---

## Environments

| Environment | Branch | URL | Purpose |
|---|---|---|---|
| Development | local | localhost:3000 | Local feature development |
| Staging | staging | staging.petpeep.in | Testing before production |
| Production | main | petpeep.in | Live product |

Each environment has its own Supabase project and Razorpay key set (test vs live).
