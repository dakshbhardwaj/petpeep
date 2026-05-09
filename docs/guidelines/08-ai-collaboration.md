# 08 — AI Collaboration Guidelines

PetPeep is built with AI tools as first-class contributors. This document defines how to work with AI effectively, safely, and consistently.

---

## The Role of AI in This Project

AI agents (Claude Code, Copilot, etc.) are treated as **senior contributors** with one important constraint: they do not hold context between sessions. Every AI session starts fresh.

**AI agents are good at:**
- Generating boilerplate that follows established patterns
- Writing tests for functions with clear inputs and outputs
- Reviewing code for consistency with the guidelines
- Drafting documentation from existing context
- Suggesting implementations from clearly specified requirements

**AI agents are NOT good at (require human judgment):**
- Deciding what to build next (product decisions)
- Making architectural decisions not already decided in ADRs
- Handling ambiguous requirements
- Anything involving real user data or production credentials

---

## Before Starting an AI Session

Always provide the AI with the right context. The minimum context for any coding task:

1. **Read `CLAUDE.md`** — this is the project's context file; reference it explicitly
2. **Specify the phase** — "We're in Phase 1 — Onboarding"
3. **Reference the relevant docs** — "The feature spec is in `docs/phases/phase-1-onboarding.md`"
4. **State the exact task** — be specific, not vague

### Prompt Template for AI Coding Tasks

```
Context:
- Project: PetPeep (see CLAUDE.md and docs/00-project-overview.md)
- Current phase: Phase [X] — [Name]
- Feature spec: docs/phases/phase-X.md → Section [Y]

Task:
[Specific, single-sentence description of what to build]

Constraints:
- Follow the coding standards in docs/guidelines/02-coding-standards.md
- Follow the component standards in docs/guidelines/06-component-standards.md
- This is a [Server Component / Client Component / API route / lib function]
- Related entities from the schema: [Booking, Sitter, etc.]

Acceptance criteria (from phase doc):
- Given [condition], when [action], then [expected result]
- Given [condition], when [action], then [expected result]

Do not:
- Introduce new dependencies not in docs/01-tech-stack.md
- Modify prisma/schema.prisma unless explicitly asked
- Build P1 or P2 features — only what's specified above
```

---

## What AI Should Always Do

These are non-negotiable for any AI-generated code:

1. **Follow the API route pattern** exactly as defined in `docs/guidelines/02-coding-standards.md`
2. **Use Zod for input validation** on every API route
3. **Check authentication first** in every API route (before any DB query)
4. **Use `src/lib/money.ts` helpers** for all monetary calculations — never raw arithmetic
5. **Use named exports** for all components
6. **Mark `"use client"`** with a comment explaining why
7. **Handle loading, empty, and error states** in every component
8. **Use `@/` import aliases** — never relative deep paths

---

## What AI Must Never Do

1. **Never modify `prisma/schema.prisma`** unless the prompt explicitly says "update the schema"
2. **Never introduce a new npm dependency** without flagging it for human approval first
3. **Never hardcode API keys, secrets, or URLs** — always use `process.env.*` or `src/lib/env.ts`
4. **Never generate placeholder/TODO code** — if something needs a decision, surface it as a question
5. **Never skip error handling** — every async function must have try/catch
6. **Never compute quiz scores or payment amounts on the client** — these must be server-side
7. **Never build features from phases that haven't been started** — scope is sacred
8. **Never use `any` type** — use proper types or `unknown`

---

## Reviewing AI-Generated Code

All AI-generated code goes through the same PR review process as human code. Additionally, reviewers check specifically for:

| AI-specific risk | What to look for |
|---|---|
| Hallucinated APIs | Does the code use functions/methods that actually exist in the libraries? |
| Outdated patterns | Does it match the current patterns in the codebase, not old Next.js patterns? |
| Scope creep | Did the AI build more than was asked? |
| Missing edge cases | AI tends to write the happy path — check for error handling |
| Type shortcuts | Did the AI use `any` or `as Type` to avoid proper typing? |
| Invented business rules | Does the business logic match the PRD/phase doc, or did the AI invent rules? |

---

## Context Files — Keep Them Updated

`CLAUDE.md` is the primary context file for AI agents. Keep it current:

- When a new architectural pattern is established → add it to the "API Route Pattern" section
- When a business rule changes → update the "Key Business Rules" section
- When a new "do not" rule is discovered → add it to the "Do Not" section

**A stale `CLAUDE.md` leads to AI generating inconsistent code.** Updating it is a 5-minute task with high leverage.

---

## Effective Prompting Patterns

### For API routes

```
Build the API route for [feature] following the standard pattern in 
docs/guidelines/02-coding-standards.md. 

The endpoint is: POST /api/bookings/[id]/checkin
Auth: required (sitter only, must own the booking)
Input: { latitude: number, longitude: number }
Logic: 
1. Verify user is the sitter for this booking
2. Check booking status is CONFIRMED
3. Compute distance from parent's address (use src/lib/geo.ts haversineDistanceMeters)
4. Create BookingEvent record (type: CHECK_IN, gpsVerified: distance < 200m)
5. Update booking status to IN_PROGRESS
6. Notify parent (push notification — use src/lib/push.ts)
Return: { event: BookingEvent, gpsVerified: boolean }
```

### For React components

```
Build the SitterCard component following the standards in 
docs/guidelines/06-component-standards.md.

Props:
- sitter: SitterSearchResult (from @/types/sitter)
- onClick?: () => void
- className?: string

Display:
- 4:3 profile photo with Verified badge (top-right)
- Name + distance from search location
- Star rating + review count (or "New Sitter" badge if <3 reviews)
- Starting price from money.format(sitter.hourlyRate1Hr)
- Accepted pets icons (dog/cat)

This is a Server Component (no interactivity needed — the parent 
handles navigation on click).
```

### For tests

```
Write unit tests for src/lib/bookings.ts → getCancellationPolicy function.

Test all three cancellation policies:
1. FULL_REFUND (>24hrs before visit) — including the exact 24hr boundary
2. PARTIAL_REFUND (6–24hrs before visit)  
3. NO_REFUND (<6hrs before visit) — including the exact 6hr boundary

Use Vitest. Mock nothing — this is a pure function with no external dependencies.
The function signature is:
getCancellationPolicy(booking: { date: Date, startTime: string, totalAmount: number })
  → { policy: CancellationPolicy, refundAmount: number }
```

---

## Session Management for Long Tasks

For tasks that span multiple files (e.g., building an entire feature):

1. Start with the schema/data model — confirm it's correct before proceeding
2. Build API route — confirm it works (test with curl or Bruno) before building UI
3. Build the UI component — confirm it renders before adding interactions
4. Write tests last — after the feature works correctly

Break the prompts into steps. Don't ask for an entire feature in one prompt — you'll get a large code dump that's hard to review.

---

## When AI Gets It Wrong

If the AI generates code that:
- Doesn't follow the patterns in `docs/guidelines/`
- Has TypeScript errors
- Misses edge cases

**Don't just accept it and fix it manually.** Go back and correct the prompt — either by providing more context, referencing the specific guideline that was missed, or being more specific about the constraint. This improves the next generation and keeps the AI context accurate.
