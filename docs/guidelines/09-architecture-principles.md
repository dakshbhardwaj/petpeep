# 09 — Architecture & Scalability Principles

Principles that govern how PetPeep is built at an architectural level. These are the guardrails that keep the codebase healthy as the product grows.

---

## Core Architectural Principles

### 1. Thin Route Handlers, Fat Lib Functions

API route handlers should be orchestrators, not processors. Business logic belongs in `src/lib/`.

```typescript
// ❌ Fat route handler (hard to test, hard to reuse)
export async function POST(request: NextRequest) {
  const { user } = await getUser()
  const body = await request.json()

  const sitter = await prisma.sitter.findUnique(...)
  if (!sitter) return error(404)

  const hoursUntilVisit = differenceInHours(...)
  let refundAmount = 0
  if (hoursUntilVisit > 24) refundAmount = booking.totalAmount
  else if (hoursUntilVisit >= 6) refundAmount = booking.totalAmount / 2

  await prisma.booking.update(...)
  await razorpay.payments.refund(...)
  await sendEmail(...)
  // ... 80 more lines
}

// ✅ Thin route handler (easy to read, logic is reusable)
export async function POST(request: NextRequest) {
  const { user } = await getUser()
  const body = schema.parse(await request.json())
  const result = await cancelBooking(user.id, body.bookingId, body.reason)
  return NextResponse.json(result)
}
```

### 2. One Way to Do Things

When a pattern is established, use it everywhere. Don't introduce a second way to do the same thing.

- One way to get the current user: `createServerClient().auth.getUser()`
- One way to format money: `money.format(paise)`
- One way to compute distance: `haversineDistanceMeters(lat1, lng1, lat2, lng2)`
- One way to send email: `sendEmail({ to, subject, template, data })`

When you find yourself creating a second implementation of something, stop and either use the existing one or propose replacing it.

### 3. Push Complexity Down, Not Up

Complexity should live in the lowest layer possible:

```
Pages / Route handlers  ← Simple: orchestration only
   ↓
src/lib functions       ← Complex: business logic lives here
   ↓
Database (Prisma)       ← Constraints: validations, unique indexes, FKs
```

A complex DB query is better than complex application logic. A computed column is better than computing in the app.

### 4. Fail Fast, Fail Loud

Validate at the edge (API route input) and surface problems immediately. Don't silently return empty results when something is wrong.

```typescript
// ❌ Silent failure
const sitter = await prisma.sitter.findUnique({ where: { id } })
return sitter?.profile ?? {}

// ✅ Explicit failure
const sitter = await prisma.sitter.findUnique({ where: { id } })
if (!sitter) throw new NotFoundError(`Sitter ${id} not found`)
return sitter.profile
```

### 5. Defer Optimisation

Don't optimise prematurely. Build it correct first, then optimise when there's a measured problem.

- Add caching when pages are slow (measure first)
- Add pagination when lists are large (implement from day 1 in API, but don't obsess over it)
- Add indexes when queries are slow (check `EXPLAIN ANALYZE` first)

---

## Data Architecture Rules

### Money is always integers (paise)

Covered in `docs/guidelines/02-coding-standards.md`, repeated here because it's architectural:
- All monetary amounts stored in the database as integers (paise)
- All monetary calculations performed on integers
- Conversion to display format (`₹500`) happens only at the UI layer

### Timestamps are always UTC

- All timestamps stored as UTC in the database (`DateTime` in Prisma)
- Convert to IST (India Standard Time, UTC+5:30) only at the display layer
- Never store timezone-local times in the DB

```typescript
// ✅ Store UTC
await prisma.booking.create({
  data: { createdAt: new Date() }  // new Date() is UTC in Node.js
})

// ✅ Display in IST
import { formatInTimeZone } from "date-fns-tz"
const displayTime = formatInTimeZone(booking.createdAt, "Asia/Kolkata", "dd MMM yyyy, hh:mm a")
```

### Soft deletes for user data

Never hard-delete records that involve users, bookings, or financial data. Use soft deletes:

```prisma
model Sitter {
  isActive  Boolean  @default(true)   // false = "deleted"
  deletedAt DateTime?                  // null = active
}
```

This preserves audit trails for disputes, financial records, and compliance.

### IDs are cuid() — not UUID, not autoincrement

```prisma
id String @id @default(cuid())
```

- cuid is URL-safe and shorter than UUID
- Not sequential (doesn't expose record counts)
- Consistent across all tables

---

## API Design Rules

### RESTful conventions

| Action | Method | URL |
|---|---|---|
| List | GET | `/api/sitters` |
| Get one | GET | `/api/sitters/[id]` |
| Create | POST | `/api/sitters` |
| Update (partial) | PATCH | `/api/sitters/[id]` |
| Delete | DELETE | `/api/sitters/[id]` |
| Custom action | POST | `/api/bookings/[id]/accept` |

Custom actions (accept, decline, cancel, checkin, checkout) use POST, not PATCH.

### Response shapes are consistent

Success:
```json
{ "booking": { ... } }           // Single resource
{ "bookings": [...], "total": N } // Collection
{ "success": true }               // Action with no response body
```

Error:
```json
{
  "error": "Human-readable message",
  "code": "BOOKING_NOT_FOUND",     // Optional machine-readable code
  "details": { ... }               // Optional validation details
}
```

### HTTP Status Codes

| Code | When |
|---|---|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST that creates a resource) |
| 204 | Success, no content (DELETE) |
| 400 | Bad request (validation failed) |
| 401 | Unauthenticated (no valid session) |
| 403 | Forbidden (authenticated but not authorised) |
| 404 | Resource not found |
| 409 | Conflict (duplicate, wrong state) |
| 500 | Internal server error (unexpected failure) |

---

## Scalability Considerations (For Later, Not Now)

These are not current requirements — they're guardrails to avoid building things that are impossible to scale:

### Don't put business logic in the DB

Avoid Postgres functions, triggers, and stored procedures for business logic. They're invisible to the codebase, hard to test, and hard to version-control. DB = data storage + constraints; app = business logic.

Exception: DB-level uniqueness constraints and foreign keys are always preferred over app-level checks.

### Avoid N+1 queries

Always use Prisma's `include` for related data:

```typescript
// ❌ N+1 query — 1 query for bookings + N queries for sitters
const bookings = await prisma.booking.findMany(...)
for (const b of bookings) {
  b.sitter = await prisma.sitter.findUnique({ where: { id: b.sitterId } })
}

// ✅ Single query with include
const bookings = await prisma.booking.findMany({
  include: { sitter: { include: { user: true } } }
})
```

### Keep Supabase Realtime subscriptions to active data only

Realtime subscriptions are resource-intensive. Subscribe only when the user needs live data:
- Chat: subscribe when the booking detail page is open; unsubscribe on unmount
- Photo feed: subscribe only during IN_PROGRESS bookings
- SOS alerts: subscribe in admin dashboard only

### Pagination on all list endpoints

Every API endpoint that returns a list must support `page` and `limit` query params, even if the list is short now. Retrofit is expensive.

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100)
  const skip = (page - 1) * limit

  const [items, total] = await prisma.$transaction([
    prisma.booking.findMany({ skip, take: limit, ... }),
    prisma.booking.count({ where: ... })
  ])

  return NextResponse.json({ items, total, page, limit })
}
```

---

## Security Architecture

### Authentication: who is this?

All protected routes verify the session via Supabase Auth on every request. There is no client-side auth token trust.

### Authorization: can they do this?

Authorization is enforced at the API route level, not middleware (middleware is for redirects only):

```typescript
// In every route that touches a booking:
const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
if (!booking) return error(404)

// Check: is this user the parent or sitter for THIS booking?
const userIsParent = booking.parent.userId === user.id
const userIsSitter = booking.sitter.userId === user.id
if (!userIsParent && !userIsSitter) return error(403)
```

### Input validation: trust nothing from the client

Every API route validates input with Zod before touching the database. The shape of the request body is never assumed.

### File uploads: validate type and size

```typescript
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  // 5MB

if (file.size > MAX_FILE_SIZE_BYTES) {
  return error(400, "File too large. Maximum size is 5MB.")
}
if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
  return error(400, "Invalid file type. Only JPEG, PNG, and WebP are allowed.")
}
```
