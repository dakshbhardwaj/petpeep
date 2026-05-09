# 03 — Git Workflow & Commit Conventions

A clean Git history is a project's memory. Treat it with the same care as the codebase.

---

## Branch Strategy

```
main        ← Production. Auto-deploys to petpeep.in via Vercel.
            ← Only receives merges from dev (or hotfix branches)
            ← Protected: no direct pushes, requires PR + review

staging     ← Pre-production. Auto-deploys to staging.petpeep.in
            ← Receives merges from dev before going to main

dev         ← Integration branch. All feature branches merge here.
            ← Protected: no direct pushes, requires PR

feature/    ← Individual feature branches (branch from dev)
fix/        ← Bug fix branches (branch from dev; from main if hotfix)
hotfix/     ← Critical production fixes (branch from main)
docs/       ← Documentation-only changes (branch from dev)
refactor/   ← Refactoring with no functional change (branch from dev)
chore/      ← Dependency updates, config changes (branch from dev)
```

### Branch naming format

```
[type]/[linear-issue-id]-short-description-in-kebab-case

Examples:
feature/HR-42-sitter-search-api
fix/HR-67-booking-timeout-edge-case
hotfix/HR-89-razorpay-duplicate-charge
docs/HR-12-update-phase-3-spec
refactor/HR-55-extract-booking-logic-to-lib
chore/HR-23-upgrade-prisma-5-14
```

Rules:
- Always include the Linear issue ID
- Keep the description short (≤5 words)
- Use kebab-case (no underscores, no spaces)
- Branch name must match the work being done — no `temp`, `wip`, or `test` branches

---

## Commit Message Format

```
type(scope): imperative short description

[optional body — explain the WHY, not the what]

[optional footer — breaking changes, closes issue]
```

### Types

| Type | Use When |
|---|---|
| `feat` | Adding new functionality |
| `fix` | Fixing a bug or broken behavior |
| `refactor` | Restructuring code without changing behavior |
| `docs` | Documentation changes only |
| `test` | Adding or updating tests |
| `chore` | Dependency updates, build config, tooling |
| `perf` | Performance improvements |
| `style` | Formatting only (no logic change) |

### Scopes (use these consistently)

`auth` `booking` `sitter` `parent` `search` `payments` `chat` `photos` `admin` `api` `db` `ui` `infra` `deps`

### Examples

```bash
# Good commits
feat(auth): add email OTP sign-up flow
fix(booking): prevent duplicate Razorpay order on payment retry
refactor(search): extract PostGIS radius query into reusable helper
docs(api-spec): add photo upload endpoint documentation
test(payments): add cancellation refund calculation unit tests
chore(deps): upgrade Prisma to 5.14.0
perf(search): add PostGIS index on sitter coordinates
style(sitter-card): fix inconsistent padding on mobile

# With body (when context is needed)
fix(booking): auto-cancel expired requests after 2-hour window

The timeout job was running every 15 minutes but wasn't correctly
filtering for bookings created more than 2 hours ago. The query
was using `createdAt` instead of `sitterResponseDeadline`.

Closes HR-78

# Bad commits — never do these
git commit -m "fix"
git commit -m "WIP"
git commit -m "asdfasdf"
git commit -m "update stuff"
git commit -m "changes"
```

### Commit rules

- **One logical change per commit** — if you're fixing a bug AND adding a feature, that's two commits
- **Present tense, imperative mood** — "add" not "added" or "adding"
- **Subject line ≤72 characters**
- **No period at the end of the subject line**
- **Commit often** — small, focused commits are always better than one massive commit

---

## Pull Request Process

### Before opening a PR

- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run type-check` passes with 0 errors
- [ ] Feature tested locally end-to-end
- [ ] Tested on mobile viewport (375px Chrome DevTools)
- [ ] No `console.log` left in code
- [ ] Linear issue is linked

### Opening a PR

1. Go to GitHub → "New Pull Request"
2. Base branch: **`dev`** (almost always — hotfixes use `main`)
3. Title format: `[HR-XX] Short description of what this does`
4. Fill in the PR template (see below)
5. Request review from at least one reviewer
6. Link the Linear issue in the PR description

### PR Template (`.github/pull_request_template.md`)

```markdown
## What does this PR do?
<!-- 1–2 sentences. What problem does it solve? -->

## Linear Issue
<!-- https://linear.app/houserules/issue/HR-XX -->

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactor / cleanup
- [ ] Documentation only
- [ ] Chore (deps, config)

## Testing Done
- [ ] Tested locally end-to-end
- [ ] Tested on mobile viewport (375px)
- [ ] Tested edge cases: [describe them]

## Code Checklist
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No lint errors (`npm run lint`)
- [ ] No `console.log` left in code
- [ ] No hardcoded secrets or API keys
- [ ] Monetary amounts stored in paise (integers), not rupees (floats)
- [ ] All API routes validate input with Zod
- [ ] All API routes check authentication before processing
- [ ] New API routes documented in `docs/03-api-spec.md`
- [ ] Schema changes run through `prisma db push` locally

## Screenshots (if UI change)
<!-- Add before/after screenshots or a short Loom video for UI changes -->

## Notes for Reviewer
<!-- Anything the reviewer should pay special attention to -->
```

### Reviewing a PR

**When reviewing, check for:**

1. **Correctness** — Does it do what it says? Does it handle edge cases?
2. **Security** — Are API routes authenticated? Is user input validated? No secrets exposed?
3. **Money** — Are all financial values in paise? Is commission calculated correctly?
4. **Scope** — Does this PR stay within its stated purpose? No scope creep?
5. **Performance** — Any N+1 queries? Any missing DB indexes?
6. **Consistency** — Does it follow the patterns in `docs/guidelines/02-coding-standards.md`?

**How to give feedback:**

- **Blocker** (must fix before merge): Prefix with `[BLOCKER]`
- **Suggestion** (should fix, easy): Prefix with `[SUGGESTION]`
- **Nit** (minor style, optional): Prefix with `[NIT]`
- **Question** (need clarification): Prefix with `[QUESTION]`

```markdown
[BLOCKER] This API route doesn't check if the authenticated user owns the booking they're trying to cancel. A parent could cancel another parent's booking.

[SUGGESTION] Extract this calculation to `src/lib/money.ts` — it's going to be needed in at least 3 other places.

[NIT] Prefer `const` over `let` here since `result` is never reassigned.
```

### Merging a PR

- **Squash and merge** for feature branches (keeps `dev` history clean)
- **Merge commit** for `dev → staging` and `staging → main` (preserves full history)
- Delete the feature branch after merging
- Move the Linear issue to "Done"

---

## Release Flow

```
feature/HR-XX → dev (PR + review + squash merge)
                    ↓
               staging (PR + smoke test)
                    ↓
                 main (PR + final review + merge commit)
                    ↓
              Auto-deploys to production via Vercel
```

**Never merge `dev → main` without testing on staging first.**

---

## Hotfix Flow

For critical production bugs only (payment errors, SOS failures, auth broken):

```
main → hotfix/HR-XX-description
  ↓ Fix the issue
  ↓ Open PR → main
  ↓ Review + merge
  ↓ Also merge main → dev (to keep branches in sync)
```

---

## Git Hygiene Rules

1. **Rebase, don't merge from dev** — keep your feature branch clean:
   ```bash
   git fetch origin
   git rebase origin/dev
   ```

2. **Never force-push to `dev` or `main`** — ever

3. **Never force-push to a shared branch** — if someone else has checked out your feature branch, discuss before force-pushing

4. **Delete branches after merge** — don't let stale branches accumulate

5. **Never commit secrets** — if you do accidentally:
   1. Immediately rotate the secret (invalidate the old one)
   2. Contact the team
   3. Remove from git history using `git filter-branch` or BFG Repo Cleaner
