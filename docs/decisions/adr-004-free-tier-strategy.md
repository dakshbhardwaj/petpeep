# ADR-004 — Free Tier Strategy for MVP

**Date:** May 2026  
**Status:** Accepted  
**Deciders:** Product + Engineering

---

## Context

PetPeep is a pre-revenue product in its MVP phase. Infrastructure costs during validation should be minimised. The goal is to get to 200 active users and first revenue with near-zero hosting/tooling spend.

---

## Decision

Use **free tiers exclusively** for all infrastructure and tooling, with two principled exceptions:
1. **Razorpay** — unavoidable per-transaction cost (all Indian payment gateways charge)
2. **ID verification vendor** — a future paid service once legal review is complete; manual admin review in MVP

---

## Full Free Stack

| Service | Free Tier | Limit Before Upgrade |
|---|---|---|
| Next.js | Open source | No limit |
| Tailwind CSS | Open source | No limit |
| shadcn/ui | Open source | No limit |
| Supabase | Free — 500MB DB, 1GB storage, 50K MAU | ~300MB DB or 30K MAU |
| Vercel | Free hobby — 100GB bandwidth | ~80GB bandwidth/month |
| GitHub | Free — unlimited public repos | No limit for our use case |
| GitHub Actions | Free — 2,000 min/month | ~1,500 min/month |
| Resend | Free — 3,000 emails/month | ~2,000 emails/month |
| Leaflet.js + OpenStreetMap | Open source | No limit |
| Sentry | Free — 5,000 errors/month | At consistent error volume |
| Prisma | Open source | No limit |
| Web Push API | Browser native | No limit |

**Total infrastructure cost at MVP:** ₹0/month (excluding Razorpay transaction fees)

---

## Paid Services (Deferred)

| Service | Cost | When to Add |
|---|---|---|
| Razorpay | 2% + GST per transaction | Required for payments — already in stack |
| ID verification (AuthBridge/IDFY) | ₹20–50 per verification | After legal review; manual review for MVP |
| Twilio / msg91 | ~₹0.50/OTP | Add in Phase 2 for WhatsApp OTP |
| Google Maps API | Free up to $200/month credit | Add when Leaflet is insufficient |
| Supabase Pro | $25/month | At ~300MB DB or 30K MAU |
| HDFC Ergo / sitter insurance | ~₹30–80/booking | Phase 1 post-launch, after insurer contract |

---

## Rationale

Paying for infrastructure before product-market fit is found is wasteful. At MVP scale (200 beta users → 500 users over 6 months):
- Supabase free tier is more than sufficient
- Vercel free tier handles the traffic
- Email via Resend is well within limits

The only costs are proportional to success (Razorpay) — which is the right model for a pre-revenue startup.

---

## Monitoring Plan

Check free tier usage at the end of every sprint:
- Supabase dashboard → Storage and DB usage
- Vercel dashboard → Bandwidth and function invocations
- Resend dashboard → Email volume
- Sentry → Error volume

**Upgrade trigger:** When any service reaches 70% of its free tier limit, plan the upgrade for the next sprint.
