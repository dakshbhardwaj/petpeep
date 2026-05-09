# 04 — Documentation Rules

Documentation is a first-class deliverable. A feature is not "done" until it's documented.

---

## The Core Principle

**Write docs for the next person, not for yourself.** You already know how this works. The reader doesn't. Write for someone joining the project in 6 months with no prior context.

---

## What Gets Documented

### Always document

| Change | Where to document |
|---|---|
| New API endpoint | `docs/03-api-spec.md` |
| Schema change (new table/column) | `docs/02-data-model.md` |
| New architectural decision | `docs/decisions/adr-XXX.md` |
| Phase task completed | Check off in `docs/phases/phase-X.md` |
| New environment variable | `.env.example` + `docs/04-environment-setup.md` |
| New dependency added | `docs/01-tech-stack.md` |
| Business rule change | Relevant phase doc + `CLAUDE.md` if it's a core rule |

### Document at the same time as you build

Do not "document it later." Later never comes. Write the doc as part of the feature PR.

---

## Code Comments

### When to comment

**Yes — write a comment when:**
- The code does something non-obvious or counterintuitive
- A business rule is being implemented (reference the rule)
- A workaround is in place (explain why)
- A performance decision was made (explain the tradeoff)

**No — do not write a comment when:**
- The code is self-explanatory
- The comment just repeats what the code says

```typescript
// ❌ Useless
// Add 1 to count
count += 1

// ✅ Explains business rule
// Booking request window is 2 hours per PRD section 4.4
const deadline = addHours(new Date(), 2)

// ✅ Explains a workaround
// Leaflet.js is not SSR-compatible — must use dynamic import
const MapView = dynamic(() => import("@/components/map/SearchMap"), { ssr: false })

// ✅ Explains a performance decision
// Using a raw query instead of Prisma because PostGIS ST_DWithin
// is not supported by Prisma's query builder
const sitters = await prisma.$queryRaw`SELECT ...`
```

### JSDoc for lib functions

All exported functions in `src/lib/` get a JSDoc comment:

```typescript
/**
 * Calculates the platform commission on a booking amount.
 * Commission rate is 15% (per PRD revenue model section 10.1).
 *
 * @param paise - The booking total in paise (not rupees)
 * @returns The commission amount in paise
 */
export function commission(paise: number): number {
  return Math.round(paise * 0.15)
}
```

---

## Phase Documentation

Each phase doc (`docs/phases/phase-X.md`) is a living document:

- **Check off tasks** as they're completed: change `- [ ]` to `- [x]`
- **Add notes** under any task if the implementation differed from the spec:
  ```markdown
  - [x] GPS check-in API (browser geolocation + ±200m verify)
    > Note: Changed tolerance to ±300m after testing in dense Mumbai buildings where
    > GPS accuracy degrades. Updated on May 15, 2026.
  ```
- **Never delete content** — strikethrough or annotate instead:
  ```markdown
  ~~- [ ] WhatsApp OTP integration~~ — Moved to Phase 2. Using email OTP for MVP.
  ```

---

## Architecture Decision Records (ADRs)

Every significant technical decision gets an ADR. The goal is to capture the context and reasoning so future developers understand **why** things are the way they are.

### When to write an ADR

- Choosing between two viable technical approaches
- Deciding to introduce a new dependency
- Changing a previously decided approach
- Making a decision that affects multiple parts of the system

### ADR Template

```markdown
# ADR-XXX — Title

**Date:** Month YYYY
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-YYY
**Deciders:** [names or roles]

## Context
[What situation led to this decision? What are the forces at play?]

## Decision
[What was decided? State it clearly in one sentence.]

## Rationale
[Why this option over alternatives? Number the reasons.]

## Consequences
[What are the pros and cons of this decision? Be honest about the downsides.]

## Migration Path (if applicable)
[If this decision is ever reversed, how would that work?]
```

### ADR numbering

ADRs are numbered sequentially: `adr-001`, `adr-002`, etc. Never reuse numbers. If a decision is superseded, create a new ADR and mark the old one as "Superseded by ADR-XXX".

---

## API Documentation

Every API endpoint in `docs/03-api-spec.md` must include:

```markdown
### `POST /api/bookings/[id]/accept`

Short description of what this endpoint does.

**Auth required:** Yes (sitter — must own the booking)
**Rate limit:** None

**URL params:**
- `id` — Booking ID (cuid)

**Request body:**
(none, or describe the body schema)

**Success response (200):**
```json
{
  "booking": { ... },
  "razorpayOrderId": "order_xxx"
}
```

**Error responses:**
- `401 Unauthorized` — No valid session
- `403 Forbidden` — Authenticated user is not the sitter for this booking
- `404 Not Found` — Booking does not exist
- `409 Conflict` — Booking is no longer PENDING (already accepted, expired, etc.)
```

---

## README Updates

The project `README.md` must be kept current:

- **Project Status table** — update phase status when phases complete
- **Tech Summary table** — update if the stack changes
- **Quick Links** — update if new docs are added

The README is the first thing any new contributor reads. If it's stale, it erodes trust in all other documentation.

---

## Linear Issue Documentation

Every Linear issue must have:

- **Title** — clear, specific, and verb-first ("Add GPS check-in API" not "GPS")
- **Description** — what needs to be built and why (link to the relevant phase doc section)
- **Acceptance criteria** — copy from the phase doc; these are the definition of done
- **Label(s)** — at least one label from the standard set
- **Milestone** — which phase this belongs to

Issues without acceptance criteria will be sent back for clarification before development starts.

---

## What Not to Document

- **Implementation details that are obvious from reading the code** — don't document what, document why
- **Temporary decisions** — if something is temporary, add a `// TODO: [HR-XX]` comment with the issue reference instead of writing a doc
- **Documentation for its own sake** — every doc must serve a reader. If no one will read it, don't write it.
