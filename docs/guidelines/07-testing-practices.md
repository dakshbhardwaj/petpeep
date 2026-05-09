# 07 — Testing Practices

Testing at the right level, at the right time. No over-testing, no under-testing.

---

## Testing Philosophy

**Test behaviour, not implementation.**

We test what the code does, not how it does it. This makes tests resilient to refactoring.

**Test the right level:**
- Business logic → Unit tests (fast, no DB, no HTTP)
- API routes → Integration tests (with DB)
- Critical user flows → End-to-end tests (sparingly)
- UI components → Only when they have logic; not for pure display

**Don't test:**
- Prisma itself (it's tested by Prisma's team)
- shadcn/ui components (tested by their maintainers)
- Simple getters/setters with no logic

---

## Test Stack

| Tool | Purpose | Free |
|---|---|---|
| Vitest | Unit and integration test runner | ✅ Open source |
| React Testing Library | Component tests | ✅ Open source |
| MSW (Mock Service Worker) | API mocking in tests | ✅ Open source |

---

## What Must Be Tested (Non-Negotiable)

These files require tests. PRs that skip them will be blocked:

| File | What to test |
|---|---|
| `src/lib/money.ts` | All functions, including edge cases |
| `src/lib/geo.ts` | Distance calculation accuracy |
| `src/lib/bookings.ts` | Cancellation policy, price computation |
| `src/app/api/payments/verify/route.ts` | Signature verification (correct + tampered) |
| `src/app/api/bookings/route.ts` | Auth required, input validation |
| `src/lib/quiz.ts` | Score calculation, retry cooldown |

---

## Unit Test Examples

```typescript
// src/lib/__tests__/money.test.ts
import { describe, it, expect } from "vitest"
import { money } from "@/lib/money"

describe("money.format", () => {
  it("formats paise to ₹ string", () => {
    expect(money.format(50000)).toBe("₹500")
    expect(money.format(35000)).toBe("₹350")
  })

  it("formats values with decimal correctly", () => {
    expect(money.format(49950)).toBe("₹499.50")
  })
})

describe("money.commission", () => {
  it("calculates 15% commission", () => {
    expect(money.commission(50000)).toBe(7500)
    expect(money.commission(100000)).toBe(15000)
  })

  it("rounds down to avoid overcharging sitters", () => {
    // 15% of ₹333 = ₹49.95 → rounds to ₹49 (4900 paise)
    expect(money.commission(33300)).toBe(4995)
  })

  it("platform fee + sitter earnings = total amount", () => {
    const total = 50000
    const fee = money.commission(total)
    const earnings = money.sitterEarnings(total)
    expect(fee + earnings).toBe(total)
  })
})
```

```typescript
// src/lib/__tests__/bookings.test.ts
import { describe, it, expect } from "vitest"
import { getCancellationPolicy } from "@/lib/bookings"
import { addHours } from "date-fns"

describe("getCancellationPolicy", () => {
  const makeBookingWithHours = (hoursFromNow: number) => ({
    date: new Date(),
    startTime: format(addHours(new Date(), hoursFromNow), "HH:mm"),
    totalAmount: 50000,
  })

  it("returns full refund when >24hrs before visit", () => {
    const policy = getCancellationPolicy(makeBookingWithHours(36))
    expect(policy.policy).toBe("FULL_REFUND")
    expect(policy.refundAmount).toBe(50000)
  })

  it("returns 50% refund when 6–24hrs before visit", () => {
    const policy = getCancellationPolicy(makeBookingWithHours(12))
    expect(policy.policy).toBe("PARTIAL_REFUND")
    expect(policy.refundAmount).toBe(25000)
  })

  it("returns no refund when <6hrs before visit", () => {
    const policy = getCancellationPolicy(makeBookingWithHours(3))
    expect(policy.policy).toBe("NO_REFUND")
    expect(policy.refundAmount).toBe(0)
  })

  it("returns full refund exactly at 24hr boundary", () => {
    const policy = getCancellationPolicy(makeBookingWithHours(24))
    expect(policy.policy).toBe("FULL_REFUND")
  })
})
```

---

## API Route Tests

```typescript
// src/app/api/bookings/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/bookings/route"
import { NextRequest } from "next/server"

// Mock Supabase auth
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } }
      })
    }
  })
}))

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    sitter: { findUnique: vi.fn() },
    booking: { create: vi.fn() }
  }
}))

describe("POST /api/bookings", () => {
  it("returns 401 when not authenticated", async () => {
    // Override mock to return no user
    vi.mocked(createServerClient).mockReturnValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }
    })

    const request = new NextRequest("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({ sitterId: "sitter-123" }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it("returns 400 for invalid input", async () => {
    const request = new NextRequest("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({ sitterId: "not-a-cuid" }),  // invalid
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

---

## Test File Location

Tests live next to the code they test:

```
src/lib/money.ts
src/lib/__tests__/money.test.ts

src/app/api/bookings/route.ts
src/app/api/bookings/__tests__/route.test.ts

src/components/sitter/SitterCard.tsx
src/components/sitter/__tests__/SitterCard.test.tsx
```

---

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run a specific test file
npm run test src/lib/__tests__/money.test.ts
```

---

## Coverage Requirements

| Module | Required Coverage |
|---|---|
| `src/lib/money.ts` | 100% |
| `src/lib/bookings.ts` | ≥90% |
| `src/lib/geo.ts` | ≥90% |
| `src/app/api/payments/` | ≥80% |
| Everything else | No minimum for MVP; test edge cases |

---

## What Not to Test at MVP Stage

To ship fast without sacrificing quality on the things that matter:

- **UI rendering tests** — trust that React + shadcn/ui render correctly; test logic, not markup
- **Happy path E2E tests** — manually test the full flow instead; automated E2E is Phase 2
- **Prisma queries directly** — test the functions that call Prisma, not Prisma itself
- **Email sending** — mock Resend in tests; test the template logic instead

---

## Before Merging — Test Checklist

```
- [ ] npm run test passes (0 failures)
- [ ] npm run type-check passes
- [ ] npm run lint passes
- [ ] Tested manually on localhost (happy path + one error case)
- [ ] Tested on mobile viewport in DevTools (375px Chrome)
- [ ] If payment code changed: tested with Razorpay test card
```
