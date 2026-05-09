# 05 — Feature Development Process

Every feature follows the same lifecycle, regardless of size. This process prevents rework, catches mistakes early, and ensures nothing is forgotten.

---

## The Golden Rule

**Always build in this order: Schema → API → Logic → UI → Tests → Docs**

Never build the UI before the API is working. Never build the API before the schema is stable. Violating this order causes rework.

---

## Full Feature Lifecycle

### Step 0 — Before Writing Code

1. **Find the Linear issue.** If it doesn't exist, create it. Every line of code traces back to an issue.
2. **Read the phase doc.** The relevant `docs/phases/phase-X.md` has acceptance criteria. Understand them before starting.
3. **Understand the data model.** Check `docs/02-data-model.md` for the entities involved.
4. **Check for existing patterns.** Search `src/lib/` for similar functionality before writing new code.
5. **Create your branch:** `git checkout -b feature/HR-XX-description`

---

### Step 1 — Schema (if DB changes needed)

If the feature requires new tables or columns:

1. Update `prisma/schema.prisma`
2. Run `npx prisma db push` locally to apply changes
3. Run `npx prisma generate` to update the Prisma client
4. Verify in Supabase Table Editor that the changes are correct
5. If columns are added to existing tables — check that existing queries still work

**Schema rules:**
- Never rename an existing column (use a new column + migration)
- Never change a column type without considering existing data
- Always add `@default` values for new non-nullable columns on existing tables
- Always add indexes for fields used in `WHERE` and `ORDER BY` clauses

---

### Step 2 — API Route

Build the API endpoint before the UI. This forces you to think about:
- What data does this endpoint need?
- What are the auth requirements?
- What can go wrong?

**Checklist for every API route:**
- [ ] Input schema defined with Zod
- [ ] Auth check is the first thing (before any DB query)
- [ ] Business logic extracted to `src/lib/` function
- [ ] Returns correct HTTP status codes (200/201/400/401/403/404/500)
- [ ] Error messages are safe (no stack traces or internal details exposed to client)
- [ ] Documented in `docs/03-api-spec.md`

**Test the API before building the UI.** Use a tool like Bruno, Postman, or `curl`:

```bash
# Test with curl
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{"sitterId": "...", "serviceType": "DROP_IN_1HR", ...}'
```

---

### Step 3 — Business Logic in `src/lib/`

Extract all non-trivial logic from the API route into a function in `src/lib/`.

```typescript
// src/lib/bookings.ts

export async function createBooking(
  parentUserId: string,
  input: CreateBookingInput
): Promise<Booking> {
  // Validate sitter is available
  const sitter = await prisma.sitter.findUnique({
    where: { id: input.sitterId, vettingStatus: "APPROVED" }
  })
  if (!sitter) throw new BookingError("Sitter not found or not approved")

  // Check for double booking
  const conflictingBooking = await checkSitterConflict(sitter.id, input.date, input.startTime)
  if (conflictingBooking) throw new BookingError("Sitter is already booked for this time")

  // Compute financials (always in paise)
  const totalAmount = getServicePrice(sitter, input.serviceType)
  const platformFee = money.commission(totalAmount)
  const sitterEarnings = money.sitterEarnings(totalAmount)

  // Create booking
  return await prisma.booking.create({
    data: {
      parentId: parent.id,
      sitterId: sitter.id,
      serviceType: input.serviceType,
      date: new Date(input.date),
      startTime: input.startTime,
      totalAmount,
      platformFee,
      sitterEarnings,
      status: "PENDING",
      sitterResponseDeadline: addHours(new Date(), 2),
    }
  })
}
```

**Why this matters:** Logic in `src/lib/` is:
- Testable (no HTTP context needed)
- Reusable (can be called from multiple routes or scheduled jobs)
- Readable (route handler stays thin)

---

### Step 4 — UI

Only start building the UI once the API is tested and working.

**UI development checklist:**
- [ ] Mobile-first (build at 375px, then scale up to desktop)
- [ ] Uses design system components (`src/components/ui/` + custom components)
- [ ] No inline styles — Tailwind classes only
- [ ] Loading states handled (skeleton or spinner)
- [ ] Empty states handled (what does the user see when there's no data?)
- [ ] Error states handled (what does the user see when the API fails?)
- [ ] Form validation shown inline (not just on submit)
- [ ] Touch targets ≥44x44px on mobile
- [ ] No text overflows on small screens (long names, long URLs)

**Component structure for a feature:**
```
components/
└── booking/
    ├── BookingRequestForm.tsx    ← The form component
    ├── BookingCard.tsx           ← Card for displaying a booking
    ├── BookingStatus.tsx         ← Status badge component
    └── index.ts                  ← Re-exports (barrel file)
```

---

### Step 5 — Tests

Write tests for:
1. **Business logic functions** in `src/lib/` (unit tests — no DB needed)
2. **API routes** for critical paths (booking creation, payment verification, cancellation)
3. **Edge cases** identified in the acceptance criteria

```typescript
// src/lib/__tests__/money.test.ts
import { money } from "@/lib/money"

describe("money.commission", () => {
  it("calculates 15% commission correctly", () => {
    expect(money.commission(50000)).toBe(7500)
  })

  it("rounds correctly to avoid floating point errors", () => {
    expect(money.commission(33333)).toBe(5000)  // 14.9999...% rounds to 5000
  })
})

// src/lib/__tests__/cancellation.test.ts
describe("getCancellationPolicy", () => {
  it("returns full refund when cancelled >24hrs before", () => {
    const booking = createMockBooking({ hoursUntilVisit: 36 })
    const policy = getCancellationPolicy(booking)
    expect(policy.refundAmount).toBe(booking.totalAmount)
  })

  it("returns 50% refund when cancelled 6–24hrs before", () => {
    const booking = createMockBooking({ hoursUntilVisit: 12 })
    const policy = getCancellationPolicy(booking)
    expect(policy.refundAmount).toBe(booking.totalAmount / 2)
  })
})
```

**Minimum test coverage requirements:**
- All `src/lib/money.ts` functions → 100% coverage
- Cancellation policy logic → 100% coverage
- Payment signature verification → must be tested
- Everything else → test edge cases from acceptance criteria

---

### Step 6 — Update Documentation

Before opening a PR, update:

- [ ] `docs/03-api-spec.md` — if a new endpoint was added or an existing one changed
- [ ] `docs/02-data-model.md` — if the schema changed
- [ ] The relevant phase doc — mark completed tasks as done
- [ ] `CLAUDE.md` — if any architectural pattern changed (rare)

---

### Step 7 — Open the PR

Follow the PR process in `docs/guidelines/03-git-workflow.md`.

Move the Linear issue from "In Progress" → "In Review".

---

### Step 8 — After Merge

- Move Linear issue to "Done"
- Delete the feature branch
- If the feature is a blocker for another issue, unblock it in Linear
- If something unexpected came up during development that needs to be documented, update the relevant doc

---

## Feature Sizing Guidelines

**How to estimate a feature's size:**

| Size | Time | Criteria |
|---|---|---|
| XS | <2 hours | UI-only change, no new API, no schema change |
| S | 2–4 hours | New UI component + 1 simple API route |
| M | 1 day | New feature with API + DB + UI + tests |
| L | 2–3 days | Multi-step flow (e.g., booking request flow) |
| XL | 3–5 days | Complex integration (e.g., Razorpay full payment flow) |

If a feature is XL or larger, break it into smaller issues in Linear before starting.

---

## When You Get Stuck

In order of what to try:

1. **Re-read the acceptance criteria** — most confusion comes from not fully reading the spec
2. **Check the data model** — is the schema right for what you're trying to build?
3. **Look for existing patterns** — has something similar been built? Copy the pattern.
4. **Check the docs for the tool** — Next.js docs, Prisma docs, Supabase docs are excellent
5. **Post in the team channel** — with a clear question (what you're trying to do, what you've tried, what the error is)
6. **For AI assistance** — follow `docs/guidelines/08-ai-collaboration.md`

**Never spend more than 2 hours stuck on the same problem without asking for help.**
