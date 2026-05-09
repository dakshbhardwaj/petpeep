# PetPeep — Contributing Guidelines

This is the **single source of truth** for how work gets done on PetPeep. Every developer and AI agent must read this before touching the codebase. No exceptions.

---

## The Non-Negotiables

These five rules override everything else:

1. **Never commit directly to `main` or `dev`** — always use a feature branch + PR
2. **Never store monetary amounts as floats** — always use paise (integer). `₹500 = 50000`
3. **Never compute quiz scores or payment logic on the client** — always server-side
4. **Never commit `.env.local` or any secret** — use `.env.example` for documentation
5. **Never build a feature that's not in the current phase** — scope is sacred

---

## Quick Reference — Where to Find What

| Topic | Document |
|---|---|
| Folder structure & file naming | [01-project-structure.md](docs/guidelines/01-project-structure.md) |
| TypeScript, React, naming conventions | [02-coding-standards.md](docs/guidelines/02-coding-standards.md) |
| Git branching, commits, PR process | [03-git-workflow.md](docs/guidelines/03-git-workflow.md) |
| How to document code and features | [04-documentation-rules.md](docs/guidelines/04-documentation-rules.md) |
| How to build a feature end-to-end | [05-feature-development-process.md](docs/guidelines/05-feature-development-process.md) |
| Reusable component standards | [06-component-standards.md](docs/guidelines/06-component-standards.md) |
| Testing approach and practices | [07-testing-practices.md](docs/guidelines/07-testing-practices.md) |
| Working with AI tools (Claude, etc.) | [08-ai-collaboration.md](docs/guidelines/08-ai-collaboration.md) |
| Architecture and scalability principles | [09-architecture-principles.md](docs/guidelines/09-architecture-principles.md) |
| Deployment and CI/CD | [10-deployment-practices.md](docs/guidelines/10-deployment-practices.md) |

---

## Before You Start Any Work

Run through this checklist mentally every time:

- [ ] Am I on the right branch? (`feature/xxx` branched from `dev`)
- [ ] Is this feature in the current phase? (check `README.md` → Project Status)
- [ ] Is there a Linear issue for this work? (if not, create one first)
- [ ] Have I read the relevant phase doc? (`docs/phases/phase-X.md`)
- [ ] Do I understand the acceptance criteria for this feature?

---

## The Development Loop (Short Version)

```
1. Pick issue from Linear → move to "In Progress"
2. Create branch: git checkout -b feature/[issue-id]-short-description
3. Build schema → API → logic → UI → tests (always in this order)
4. Write/update docs if anything changed
5. Open PR → fill in the template → request review
6. Address feedback → merge → close Linear issue
```

---

## PR Checklist (Copy This Into Every PR)

```
## What does this PR do?
<!-- 1-2 sentence description -->

## Linear issue
<!-- Link: https://linear.app/houserules/issue/HR-XX -->

## Type of change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation

## Testing done
- [ ] Tested locally end-to-end
- [ ] Tested on mobile viewport (375px)
- [ ] Edge cases handled

## Code checklist
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No lint errors (`npm run lint`)
- [ ] No console.log left in code
- [ ] No hardcoded secrets or API keys
- [ ] Monetary amounts stored in paise (not rupees)
- [ ] API routes validate input with Zod
- [ ] API routes check authentication
- [ ] Docs updated if needed
```

---

## Commit Message Format

```
type(scope): short description in present tense

Examples:
feat(auth): add email OTP sign-up flow
fix(booking): prevent duplicate Razorpay orders on retry
refactor(search): extract radius query into reusable helper
docs(phase-3): update booking flow acceptance criteria
test(payments): add cancellation refund calculation tests
chore(deps): update Prisma to 5.14
```

Types: `feat` `fix` `refactor` `docs` `test` `chore` `perf` `style`

---

## For AI Agents — Read First

Before generating any code, read:
1. `CLAUDE.md` — project context, tech stack, key rules
2. `docs/guidelines/08-ai-collaboration.md` — AI-specific rules
3. The relevant phase doc for the feature being built

Key rules for AI-generated code:
- Always use the existing patterns from `src/lib/` — do not introduce new patterns
- All API routes must follow the standard pattern in `docs/guidelines/02-coding-standards.md`
- Do not generate placeholder/TODO code — if something requires a decision, ask
- Do not modify `prisma/schema.prisma` without an explicit instruction to do so
