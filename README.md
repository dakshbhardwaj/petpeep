# PetPeep

> Your pet, always in safe paws.

PetPeep is a commission-based pet care marketplace for urban India. Version 1 targets Mumbai and Pune with verified, drop-in pet sitting services. The platform connects pet parents with trusted, vetted local sitters — no kennels, no cages, just home-like care.

---

## Development Guidelines

> **Start here before writing any code:** [CONTRIBUTING.md](CONTRIBUTING.md) — the complete rulebook for all contributors and AI agents.

| Guideline | Description |
|---|---|
| [01 — Project Structure](docs/guidelines/01-project-structure.md) | Folder organisation, naming conventions |
| [02 — Coding Standards](docs/guidelines/02-coding-standards.md) | TypeScript, React, API routes, money handling |
| [03 — Git Workflow](docs/guidelines/03-git-workflow.md) | Branching, commits, PR process, review |
| [04 — Documentation Rules](docs/guidelines/04-documentation-rules.md) | What to document, ADR format, code comments |
| [05 — Feature Development](docs/guidelines/05-feature-development-process.md) | End-to-end feature lifecycle |
| [06 — Component Standards](docs/guidelines/06-component-standards.md) | React components, design system, accessibility |
| [07 — Testing](docs/guidelines/07-testing-practices.md) | What to test, examples, coverage requirements |
| [08 — AI Collaboration](docs/guidelines/08-ai-collaboration.md) | How to work with AI tools effectively |
| [09 — Architecture](docs/guidelines/09-architecture-principles.md) | Design principles, scalability, security |
| [10 — Deployment](docs/guidelines/10-deployment-practices.md) | CI/CD, environments, migrations, rollback |

---

## Quick Links

| Document | Description |
|---|---|
| [Project Overview](docs/00-project-overview.md) | Vision, problem, market, personas |
| [Tech Stack](docs/01-tech-stack.md) | All technology decisions with rationale |
| [Data Model](docs/02-data-model.md) | Database schema and entity relationships |
| [API Spec](docs/03-api-spec.md) | All API endpoints |
| [Environment Setup](docs/04-environment-setup.md) | Local development setup |
| **Phases** | |
| [Phase 0 — Foundation](docs/phases/phase-0-foundation.md) | Project setup, infra, auth |
| [Phase 1 — Onboarding](docs/phases/phase-1-onboarding.md) | User registration and onboarding flows |
| [Phase 2 — Search & Discovery](docs/phases/phase-2-search.md) | Sitter search and profiles |
| [Phase 3 — Booking & Payments](docs/phases/phase-3-booking.md) | Booking flow and Razorpay |
| [Phase 4 — Trust Features](docs/phases/phase-4-trust.md) | Real-time updates, chat, reviews |
| [Phase 5 — Launch Prep](docs/phases/phase-5-launch.md) | SOS, testing, beta rollout |
| **Decisions** | |
| [ADR-001 Next.js Fullstack](docs/decisions/adr-001-nextjs-fullstack.md) | Why Next.js as the single framework |
| [ADR-002 Supabase](docs/decisions/adr-002-supabase.md) | Why Supabase for DB, auth, storage, realtime |
| [ADR-003 Web First](docs/decisions/adr-003-web-first.md) | Why web before native app |
| [ADR-004 Free Tier Strategy](docs/decisions/adr-004-free-tier-strategy.md) | Free tools approach for MVP |
| **Linear** | |
| [Milestones](docs/linear/milestones.md) | Linear milestone and issue structure |

---

## Project Status

| Phase | Status | Target |
|---|---|---|
| Phase 0 — Foundation | ✅ Complete | Week 2 |
| Phase 1 — Onboarding | ✅ Complete | Week 5 |
| Phase 2 — Search | ✅ Complete | Week 7 |
| Phase 3 — Booking | ✅ Complete | Week 10 |
| Phase 4 — Trust Features | ✅ Complete | Week 13 |
| Phase 5 — Launch Prep | ✅ Complete | Week 16 |

---

## Core Business Rules

- Platform commission: **15%** of booking value (deducted from sitter payout)
- Zero booking fee charged to pet parents
- Sitter vetting fee: **₹299** one-time
- Sitter acceptance rate target: **≤25%** of applicants
- Sitter payout: within **48 hours** of booking completion
- Android-first (>95% Indian smartphone market), but web app covers both

---

## MVP Scope (v1)

**In scope:**
- Drop-in pet sitting only (1hr / 2hr / 4hr visits)
- Mumbai and Pune only
- Web application (responsive, mobile-compatible)
- Two user types: Pet Parents + Sitters
- Admin dashboard (internal)

**Out of scope for v1:**
- Dog walking, overnight boarding, grooming, vet consultation
- Native mobile apps
- City expansion beyond Mumbai and Pune
- Community/social features

---

## Tech Summary

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email OTP) |
| Realtime + Storage | Supabase |
| Payments | Razorpay |
| Deployment | Vercel |
| Maps | Leaflet.js + OpenStreetMap (free) |

---

## Repository Structure

```
petpeep/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth pages (login, sign-up)
│   │   ├── (parent)/           # Pet parent pages
│   │   ├── (sitter)/           # Sitter pages
│   │   ├── (admin)/            # Admin dashboard
│   │   └── api/                # API route handlers
│   ├── components/             # Shared React components
│   ├── lib/                    # Utilities, Supabase client, helpers
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript type definitions
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
├── docs/                       # All project documentation
└── supabase/
    └── migrations/             # Database migrations
```
