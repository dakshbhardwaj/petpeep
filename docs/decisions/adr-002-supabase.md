# ADR-002 — Supabase for Database, Auth, Storage, and Realtime

**Date:** May 2026  
**Status:** Accepted  
**Deciders:** Product + Engineering

---

## Context

PetPeep requires four backend services: a database (PostgreSQL), authentication, file storage, and real-time subscriptions for chat and live photo updates. We can either set these up separately (RDS + Cognito/Auth0 + S3 + Socket.io) or use an integrated platform.

---

## Decision

Use **Supabase** for all four: PostgreSQL database, Auth (OTP), Storage, and Realtime.

---

## Rationale

1. **Free tier covers MVP completely:**
   - 500MB database → sufficient for hundreds of users
   - 1GB storage → sufficient for pet photos and Aadhaar docs at MVP scale
   - 50,000 MAU → well above MVP user targets
   - 2M realtime messages/month → more than enough for chat at MVP scale

2. **All four services in one place** — One account, one dashboard, one billing (free). No stitching together multiple services and vendors.

3. **PostgreSQL is the right database** — Supports PostGIS for location-based sitter search. Full relational model for the complex booking/payment data. We use Prisma as the ORM for type safety and migrations.

4. **Supabase Realtime is sufficient for MVP chat** — The in-app chat feature (parent ↔ sitter per booking) has low message volume. Supabase Realtime handles Postgres changes subscriptions without needing a dedicated socket server.

5. **Supabase Auth handles email OTP** — Mobile number OTP (WhatsApp) is a Phase 2 addition. Email OTP is sufficient for beta users.

---

## What We Don't Use from Supabase

- **Supabase Row Level Security (RLS) policies** — We use Prisma for all DB queries with service role key on the server. RLS is not configured at the DB level; access control is enforced in API routes.
- **Supabase Edge Functions** — Used only for scheduled jobs (payout trigger, booking timeout, photo reminder). Standard Next.js API routes handle everything else.

---

## Consequences

- **Pro:** Zero infrastructure cost at MVP
- **Pro:** Single dashboard for monitoring DB, Auth, Storage
- **Con:** Supabase free tier is limited — plan for upgrade when DB approaches 300MB or MAU approaches 30K
- **Con:** Realtime is good but not as battle-tested as dedicated Socket.io at high concurrency — acceptable for MVP
- **Con:** Prisma + Supabase requires careful connection pooling config (use `?pgbouncer=true` in `DATABASE_URL` for serverless)

## Upgrade Path

If Supabase free tier is outgrown:
- **Database:** Upgrade to Supabase Pro ($25/month) for 8GB DB + 250GB storage
- **Realtime:** Migrate to a dedicated realtime service (Ably, Pusher) only if Supabase limits are hit
- **Auth:** Supabase Auth scales with the Pro tier

Expected upgrade point: ~1,000 active users (estimated 6+ months after launch).
