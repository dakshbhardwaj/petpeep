# 02 — Coding Standards & Naming Conventions

Consistency in code is what allows a team to move fast without breaking things. These standards are non-negotiable.

---

## TypeScript Rules

### Always use strict TypeScript — never `any`

```typescript
// ❌ Wrong
function processBooking(booking: any) { ... }

// ✅ Right
function processBooking(booking: Booking) { ... }

// ✅ When truly unknown, use `unknown` and narrow it
function handleApiResponse(data: unknown) {
  if (isBooking(data)) { ... }
}
```

### Prefer `type` over `interface` for object shapes

```typescript
// ✅ Preferred
type BookingSummary = {
  id: string
  status: BookingStatus
  totalAmount: number  // Always in paise
}

// ✅ Use interface only when you need declaration merging (rare)
interface BookingWithRelations extends Booking {
  parent: PetParent
  sitter: Sitter
}
```

### Explicit return types on all functions (except simple arrow functions)

```typescript
// ✅ Right
async function createBooking(data: CreateBookingInput): Promise<Booking> { ... }

// ✅ Simple arrow functions can infer
const formatAmount = (paise: number) => `₹${paise / 100}`

// ❌ Wrong — missing return type on a complex function
async function createBooking(data: CreateBookingInput) { ... }
```

### Never use non-null assertion (`!`) — handle null explicitly

```typescript
// ❌ Wrong
const name = user!.name

// ✅ Right
if (!user) throw new Error("User not found")
const name = user.name

// ✅ Or use optional chaining
const name = user?.name ?? "Unknown"
```

---

## React Standards

### Component structure — always in this order

```typescript
// 1. Imports (external → internal → relative)
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SitterCard } from "@/components/sitter/SitterCard"
import type { Sitter } from "@/types/sitter"

// 2. Types/interfaces for this component's props
type Props = {
  sitterId: string
  onBook: (sitterId: string) => void
}

// 3. Component (named export, not default for components)
export function SitterProfile({ sitterId, onBook }: Props) {
  // 4. Hooks first (useState, useEffect, custom hooks)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { sitter } = useSitter(sitterId)

  // 5. Derived state / computed values
  const hasReviews = (sitter?.totalReviews ?? 0) > 0
  const displayRating = sitter?.avgRating?.toFixed(1) ?? "New"

  // 6. Event handlers
  const handleBook = () => {
    onBook(sitterId)
  }

  // 7. Early returns (loading, error, empty states)
  if (isLoading) return <LoadingSpinner />
  if (!sitter) return <EmptyState message="Sitter not found" />

  // 8. Main render
  return (
    <div>...</div>
  )
}
```

### Use named exports — not default exports for components

```typescript
// ❌ Wrong
export default function SitterCard() { ... }

// ✅ Right
export function SitterCard() { ... }
```

*Exception: `page.tsx` and `layout.tsx` files must use default exports (Next.js requirement)*

### Props: destructure immediately, keep props minimal

```typescript
// ✅ Right
export function BookingCard({ booking, onCancel }: Props) { ... }

// ❌ Wrong
export function BookingCard(props: Props) {
  const booking = props.booking
  ...
}
```

### Server vs Client Components — mark explicitly

```typescript
// Server Component (default — no directive needed)
export default async function SearchPage() {
  const sitters = await fetchSitters()
  return <SitterList sitters={sitters} />
}

// Client Component — always at the top of the file, always with a comment why
"use client"
// Client component: uses useState for filter state

export function FilterPanel({ onFilter }: Props) {
  const [priceRange, setPriceRange] = useState([0, 2000])
  ...
}
```

---

## API Route Standards

### Standard pattern — every API route must follow this

```typescript
// src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

// 1. Define input schema with Zod
const createBookingSchema = z.object({
  sitterId: z.string().cuid(),
  serviceType: z.enum(["DROP_IN_1HR", "DROP_IN_2HR", "DROP_IN_4HR"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  petIds: z.array(z.string().cuid()).min(1),
  notesToSitter: z.string().max(500).optional(),
})

// 2. Handler function
export async function POST(request: NextRequest) {
  try {
    // 3. Auth check — always first
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 4. Parse and validate input
    const body = await request.json()
    const result = createBookingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      )
    }

    // 5. Business logic (call lib functions — not inline)
    const booking = await createBooking(user.id, result.data)

    // 6. Return success response
    return NextResponse.json({ booking }, { status: 201 })

  } catch (error) {
    // 7. Error handling — log server-side, return generic message client-side
    console.error("[POST /api/bookings]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### Business logic belongs in `src/lib/` — not in route handlers

```typescript
// ❌ Wrong — complex logic inside the route handler
export async function POST(request: NextRequest) {
  // ... 50 lines of booking creation logic inline
}

// ✅ Right — route handler is thin, logic is in a lib function
// src/lib/bookings.ts
export async function createBooking(
  userId: string,
  data: CreateBookingInput
): Promise<Booking> {
  // All the logic here
}

// src/app/api/bookings/route.ts
export async function POST(request: NextRequest) {
  // ... auth, validation, then:
  const booking = await createBooking(user.id, result.data)
  return NextResponse.json({ booking })
}
```

---

## Money Handling Rules

This is critical. Getting this wrong causes real financial bugs.

```typescript
// ❌ NEVER store or compute in rupees (float)
const price = 499.50  // WRONG

// ✅ ALWAYS store in paise (integer)
const priceInPaise = 49950  // ₹499.50

// src/lib/money.ts — always use these helpers
export const money = {
  // Format paise to display string
  format: (paise: number): string => {
    return `₹${(paise / 100).toLocaleString("en-IN")}`
  },

  // Convert rupees to paise (for user-input values)
  toPaise: (rupees: number): number => Math.round(rupees * 100),

  // Commission calculation (15%)
  commission: (paise: number): number => Math.round(paise * 0.15),

  // Sitter earnings
  sitterEarnings: (paise: number): number => paise - money.commission(paise),
}

// Usage
const totalAmount = money.toPaise(500)         // 50000
const platformFee = money.commission(50000)     // 7500
const sitterEarns = money.sitterEarnings(50000) // 42500
```

---

## Imports — Order and Aliases

**Import order (ESLint enforces this):**
1. Node.js built-ins (if any)
2. External packages (`react`, `next`, `@prisma/client`, etc.)
3. Internal absolute imports (`@/lib/...`, `@/components/...`)
4. Relative imports (`./utils`, `../types`)
5. Type imports (`import type { ... }`)

```typescript
// ✅ Correct order
import { useState } from "react"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { createServerClient } from "@/lib/supabase/server"
import { money } from "@/lib/money"
import { SitterCard } from "@/components/sitter/SitterCard"

import type { Booking } from "@/types/booking"
```

**Always use `@/` alias — never relative paths from deep nesting:**
```typescript
// ❌ Wrong
import { prisma } from "../../../lib/prisma"

// ✅ Right
import { prisma } from "@/lib/prisma"
```

---

## Async / Error Handling

### Always use try/catch in async functions that can fail

```typescript
// ✅ Right
async function fetchSitter(id: string): Promise<Sitter | null> {
  try {
    return await prisma.sitter.findUnique({ where: { id } })
  } catch (error) {
    console.error(`[fetchSitter] Failed for id: ${id}`, error)
    return null
  }
}
```

### Never swallow errors silently

```typescript
// ❌ Wrong
try {
  await sendEmail(...)
} catch {
  // silent
}

// ✅ Right — at minimum, log it
try {
  await sendEmail(...)
} catch (error) {
  console.error("[sendEmail] Failed:", error)
  // decide: rethrow, return null, or continue
}
```

---

## Comments — When to Write Them

Write comments for **why**, not **what**. Code explains what. Comments explain intent.

```typescript
// ❌ Useless comment
// Multiply by 100
const paise = rupees * 100

// ✅ Explains non-obvious intent
// Razorpay requires amounts in paise (smallest currency unit)
const paise = rupees * 100

// ✅ Explains business rule
// Sitter response deadline is 2 hours — per PRD booking flow spec
const deadline = addHours(new Date(), 2)

// ✅ Explains a workaround
// Leaflet doesn't support SSR — must be dynamically imported
const MapView = dynamic(() => import("@/components/map/SearchMap"), { ssr: false })
```

Do not comment out code — delete it. Git history preserves everything.

---

## Environment Variables

```typescript
// ❌ Wrong — hardcoded values
const key = "rzp_test_abc123"

// ❌ Wrong — accessing without validation
const key = process.env.RAZORPAY_KEY_ID

// ✅ Right — validate at startup in src/lib/env.ts
import { z } from "zod"

const envSchema = z.object({
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
})

export const env = envSchema.parse(process.env)
```

Public variables (accessible in browser): prefix with `NEXT_PUBLIC_`  
Server-only variables (secrets): no prefix — never use `NEXT_PUBLIC_` for secrets

---

## Forbidden Patterns

These will be rejected in code review:

| Pattern | Reason | Alternative |
|---|---|---|
| `any` type | Bypasses type safety | Use `unknown` and narrow, or define a type |
| `console.log` in production | Leaks information | Use `console.error` for errors only; remove debug logs |
| Hardcoded URLs / keys | Security and environment issues | Use `src/lib/env.ts` |
| `parseFloat()` on monetary values | Floating point errors | Use paise (integer) everywhere |
| `Date.now()` for DB timestamps | Should be DB-generated | Use `@default(now())` in Prisma |
| Inline styles | Breaks design system | Use Tailwind classes |
| `window.*` in Server Components | Causes SSR errors | Use `"use client"` or check `typeof window !== "undefined"` |
| `dangerouslySetInnerHTML` | XSS risk | Escape user content |
| Nested ternaries more than 2 levels | Unreadable | Extract to variable or if/else |
