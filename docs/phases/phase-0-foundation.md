# Phase 0 — Foundation

**Timeline:** Weeks 1–2  
**Goal:** Project skeleton deployed to production. Database live. Auth working end-to-end. Every team member can run the project locally.

---

## What Gets Built

- Next.js project initialised with full folder structure
- Tailwind CSS + shadcn/ui configured with PetPeep design tokens
- Supabase project connected (DB, Auth, Storage, Realtime)
- Prisma schema defined and pushed to Supabase
- Email OTP authentication working (sign-up + login)
- "Hello World" deployed to Vercel on a custom domain
- Admin role protected route working
- CI/CD via GitHub Actions (lint + type check on PR)

---

## Why This Phase Matters

The biggest invisible risk in any project is discovering infrastructure problems mid-build. Getting to production on Day 1 means:
- Deployment issues surface immediately, not in Week 14
- Every feature is built against a real database, not mocks
- The team has a shared, working foundation from the start

Do not skip deploying to Vercel in this phase.

---

## Detailed Task Breakdown

### 1. Repository & Tooling Setup

**Tasks:**
- [x] Create GitHub repository (`petpeep`)
- [x] Initialise Next.js 14 with App Router and TypeScript
  ```bash
  npx create-next-app@latest petpeep --typescript --tailwind --app --src-dir --import-alias "@/*"
  ```
- [x] Install core dependencies:
  ```bash
  npm install @supabase/supabase-js @supabase/ssr @prisma/client prisma
  npm install razorpay resend
  npm install -D @types/node
  ```
- [x] Install shadcn/ui:
  ```bash
  npx shadcn@latest init
  ```
- [x] Configure ESLint + Prettier
- [x] Add `.gitignore` (ensure `.env.local` is excluded)
- [x] Add `.env.example` (see [Environment Setup](../04-environment-setup.md))
- [x] Create `CLAUDE.md` with project context for AI assistants

**Acceptance criteria:**
- `npm run dev` starts successfully with no errors
- `npm run lint` passes with no warnings
- `npm run type-check` passes

---

### 2. Design System Configuration

**Tasks:**
- [x] Configure Tailwind with PetPeep design tokens in `tailwind.config.ts`:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#005a71",
          container: "#0e7490",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#855300",
          container: "#fea619",
          foreground: "#ffffff",
        },
        background: "#f8f9ff",
        surface: {
          DEFAULT: "#f8f9ff",
          low: "#eff4ff",
          container: "#e5eeff",
          high: "#dce9ff",
        },
        success: "#005f40",
      },
      fontFamily: {
        display: ["Quicksand", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      spacing: {
        "18": "4.5rem",
      },
      borderRadius: {
        card: "1rem",    // 16px for cards
        button: "0.5rem", // 8px for buttons
      },
    },
  },
  plugins: [],
};
export default config;
```

- [x] Add Google Fonts (Quicksand + Inter) in `src/app/layout.tsx`
- [x] Install and configure core shadcn/ui components:
  ```bash
  npx shadcn@latest add button input label card badge avatar toast dialog
  ```
- [x] Create base layout components: `Header`, `Footer`, `Container`

**Acceptance criteria:**
- Landing page renders in Caring Teal with Quicksand headings
- Responsive layout works on 375px (mobile) and 1440px (desktop)

---

### 3. Supabase + Prisma Setup

**Tasks:**
- [x] Create Supabase project at [supabase.com](https://supabase.com)
- [x] Create Prisma schema (full schema in [Data Model](../02-data-model.md))
- [x] Create `src/lib/prisma.ts` — Prisma client singleton:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [x] Create Supabase clients:
  - `src/lib/supabase/client.ts` — for browser use
  - `src/lib/supabase/server.ts` — for server components and API routes
- [x] Run `npx prisma db push` to create all tables in Supabase
- [x] Verify all tables created in Supabase Table Editor

**Acceptance criteria:**
- `npx prisma studio` opens and shows all empty tables
- No migration errors

---

### 4. Authentication — Email OTP

**Tasks:**
- [x] Enable Email provider in Supabase Auth settings
- [x] Create sign-up page (`/sign-up`):
  - Email input → OTP sent via Supabase Auth
  - OTP verification step
  - Name input after OTP verified
  - Redirect to onboarding based on user type selection (Parent / Sitter)
- [x] Create login page (`/login`):
  - Email input → OTP sent
  - OTP verification → redirect to dashboard
- [x] Create auth middleware (`src/middleware.ts`):
  - Protected routes redirect to `/login` if not authenticated
  - Admin routes check `userType === ADMIN`
- [x] Create `useAuth` hook for client-side auth state
- [x] Create user record in `User` table on first sign-up (via Supabase Auth webhook or API route)

**Acceptance criteria:**
- Given a new email, when OTP is entered correctly, then a User record is created in the database and user is redirected to onboarding
- Given a returning user, when OTP is entered, then user is redirected to their dashboard
- Given an unauthenticated user visits `/dashboard`, then they are redirected to `/login`
- Given an authenticated non-admin user visits `/admin`, then they receive a 403

---

### 5. Landing Page

**Tasks:**
- [x] Build the landing page (`/`):
  - Hero: headline, sub-headline, "Find a Sitter" CTA
  - How It Works (3 steps for parents)
  - Trust signals (verified badge count, review count, cities covered)
  - Sitter CTA ("Become a Sitter")
  - Footer (links, city info)
- [x] Fully responsive (mobile + desktop)
- [x] Match design system (Caring Teal, Quicksand headlines)

**Acceptance criteria:**
- Renders correctly on Chrome, Safari, Firefox
- Lighthouse performance score ≥75 on mobile
- All CTAs navigate to correct pages

---

### 6. Deployment to Vercel

**Tasks:**
- [x] Connect GitHub repo to Vercel
- [x] Configure environment variables in Vercel dashboard
- [x] Set up custom domain (petpeep.in or staging.petpeep.in)
- [x] Verify deployment works on every push to `main`
- [x] Test auth flow on production URL (not just localhost)

**Acceptance criteria:**
- Pushing to `main` triggers automatic deployment
- Production URL is live and loads under 3 seconds
- Auth flow works end-to-end on production

---

### 7. GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [dev, main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
```

**Acceptance criteria:**
- Every PR to `dev` or `main` runs lint and type check
- Failed checks block merge

---

## Deliverables

| Deliverable | Done When |
|---|---|
| Repo live on GitHub | Pushed and accessible to all contributors |
| Local setup works in under 10 minutes | Any new contributor can follow `04-environment-setup.md` and run the project |
| Database schema live on Supabase | All tables visible in Supabase Table Editor |
| Auth works end-to-end | New user can sign up and log in via email OTP |
| Landing page live | Deployed to Vercel, accessible on custom domain |
| CI passing | GitHub Actions green on every PR |

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Supabase free tier limits | Monitor usage from day 1; free tier is sufficient for MVP |
| Razorpay test vs live | Build all payment code in test mode; switch key before beta |
| Email OTP deliverability | Use Resend (reliable) not Supabase's default SMTP in production |
