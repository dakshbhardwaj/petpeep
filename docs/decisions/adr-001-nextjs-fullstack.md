# ADR-001 — Next.js as Full-Stack Framework

**Date:** May 2026  
**Status:** Accepted  
**Deciders:** Product + Engineering

---

## Context

PetPeep needs a web application with a frontend, backend API, and admin dashboard. We need to decide whether to use:
- A separate frontend (React/Vite) + separate backend (Express/FastAPI)
- A full-stack framework (Next.js) that handles both in one codebase

---

## Decision

Use **Next.js 14 with App Router** as the single full-stack framework for the entire application (frontend, API routes, admin dashboard).

---

## Rationale

1. **One codebase, one deployment** — No need to manage two separate services, two separate Vercel/Railway deployments, or two sets of environment variables for MVP.

2. **API routes are sufficient for MVP** — Next.js App Router `route.ts` files handle all backend logic. We can extract to a separate service if traffic requires it later.

3. **Server Components reduce complexity** — Data fetching happens on the server by default. No need for React Query, SWR, or complex client-side state management for read-heavy pages like search and profiles.

4. **Vercel deployment is seamless** — Next.js + Vercel = zero-config deployment. Free tier is sufficient for MVP.

5. **TypeScript end-to-end** — Types are shared between frontend and API routes in the same codebase. No type drift between frontend and backend.

---

## Consequences

- **Pro:** Single `npm install`, single `npm run dev`, single deployment
- **Pro:** Shared types between frontend + backend with no extra tooling
- **Pro:** Server-side rendering for SEO on sitter profiles and landing page
- **Con:** API routes are co-located with the frontend — must be disciplined about separating business logic into `src/lib/` files, not embedding it in route handlers
- **Con:** If traffic scales significantly, extracting the API to a separate service requires more refactoring than if it had been separate from day one

## Migration Path

If PetPeep scales to where Next.js API routes become a bottleneck, the migration path is:
1. Extract `src/app/api/` into a separate Express or FastAPI service
2. Update `NEXT_PUBLIC_API_URL` to point to the new service
3. Frontend remains unchanged

This is a low-risk decision to revisit at significant scale.
