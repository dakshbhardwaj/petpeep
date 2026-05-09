# 10 — Deployment & CI/CD Practices

How code gets from a developer's machine to production, safely and reliably.

---

## Environment Overview

| Environment | Branch | URL | Purpose | Auto-deploys |
|---|---|---|---|---|
| Development | local | localhost:3000 | Individual development | N/A |
| Staging | `staging` | staging.petpeep.in | Pre-production testing | On push to `staging` |
| Production | `main` | petpeep.in | Live product | On push to `main` |

Each environment has its own:
- Supabase project (separate databases)
- Razorpay key set (test mode for staging, live mode for production)
- Environment variables in Vercel

---

## CI/CD Pipeline

### GitHub Actions — runs on every PR to `dev` or `main`

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [dev, main, staging]

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm run test

  build:
    name: Build Check
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          # Use dummy values for build-time env validation
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder
          DATABASE_URL: postgresql://placeholder
```

**The CI pipeline must pass before any PR can be merged.** This is enforced via GitHub branch protection rules on `dev` and `main`.

---

## Deployment Process

### Feature → Dev

1. Feature branch PR opened → CI runs → reviewer approves → squash merge to `dev`
2. Vercel auto-deploys `dev` to a preview URL (not staging — just a preview)

### Dev → Staging

1. When a milestone is complete (or enough features for a batch test), merge `dev` → `staging` via PR
2. Staging auto-deploys to `staging.petpeep.in`
3. Manual smoke test on staging (see checklist below)

### Staging → Production

1. After staging smoke test passes, open PR: `staging → main`
2. Final review — at least one approval required
3. Merge (merge commit, not squash — preserves history)
4. Production auto-deploys via Vercel
5. Monitor Sentry for new errors in the 30 minutes after deploy

---

## Staging Smoke Test Checklist

Run this manually after every staging deploy before promoting to production:

```
Authentication
- [ ] New user can sign up with email OTP
- [ ] Returning user can log in
- [ ] Unauthenticated user redirected to login

Parent flows (current phase features)
- [ ] Pet parent can complete onboarding
- [ ] Pet profile creation works (including photo upload)
- [ ] Sitter search returns results
- [ ] Booking request can be submitted

Sitter flows
- [ ] Sitter application form works
- [ ] Quiz submits and scores correctly

Payments (use Razorpay test cards)
- [ ] UPI payment succeeds: test UPI ID `success@razorpay`
- [ ] Card payment succeeds: 4111 1111 1111 1111
- [ ] Failed payment handled correctly

Mobile
- [ ] All flows work on mobile viewport (test in Chrome DevTools, 375px)
- [ ] No horizontal overflow
- [ ] Touch targets are usable

Performance
- [ ] Landing page loads in < 3 seconds on 4G (Chrome DevTools throttle)
- [ ] Search results load in < 2 seconds
```

---

## Environment Variables Management

### Adding a new environment variable

1. Add to `.env.example` with a descriptive comment:
   ```
   # Razorpay API key (get from razorpay.com > Settings > API Keys)
   RAZORPAY_KEY_ID=
   ```
2. Add validation to `src/lib/env.ts`:
   ```typescript
   const envSchema = z.object({
     RAZORPAY_KEY_ID: z.string().min(1),
     // ...
   })
   ```
3. Add to Vercel environment variables for all three environments
4. Update `docs/04-environment-setup.md` with setup instructions

### Secrets rotation

If a secret is accidentally committed:
1. **Immediately invalidate the old secret** (rotate the key in the service's dashboard)
2. Generate a new secret
3. Update Vercel environment variables
4. Notify the team
5. Remove from git history (use `git filter-repo` — not `git filter-branch`)

---

## Vercel Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "regions": ["bom1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

**Regions:** `bom1` = Mumbai. Always deploy to the region closest to users.

---

## Database Migrations

### Development

During active development (before the first real users), use:
```bash
npx prisma db push   # Applies schema changes directly (no migration file)
```

### Production (after first real users)

Once real user data exists, switch to proper migrations:
```bash
# Create a migration
npx prisma migrate dev --name add-sitter-bio-field

# Apply migrations in production (run in Vercel build or CI)
npx prisma migrate deploy
```

**Never run `prisma db push` in production after real users exist.** It can cause data loss.

### Migration safety rules

Before applying a migration to production with live data:
- [ ] Is this a new table or column? → Safe
- [ ] Is this dropping a column? → Dangerous — deploy code change first (that doesn't use the column), then drop
- [ ] Is this adding a NOT NULL column to an existing table? → Must include a `@default` value
- [ ] Is this renaming a column? → Never rename — add new + migrate data + remove old

---

## Monitoring

### Sentry (error monitoring)

Configure alerts for:
- Error rate > 5 errors/minute → Slack/email alert
- New error type appearing → Slack/email alert
- Payment-related errors → Immediate alert

### Vercel Analytics

Review weekly:
- Core Web Vitals (LCP, CLS, FID)
- Page load times by route
- Geographic distribution of users

### Supabase Dashboard

Review weekly:
- Database storage usage (alert if approaching 400MB of free 500MB)
- Auth sign-ups and MAU
- Storage usage

---

## Rollback Process

If a bad deployment reaches production:

1. **Vercel instant rollback:** Go to Vercel dashboard → Deployments → Previous deployment → "Promote to Production". Takes < 60 seconds.

2. **Database rollback (if schema migration was part of the bad deploy):** This is harder. Assess whether a rollback migration can be applied safely. If data was written in the new schema, rolling back may cause data loss — the decision requires human judgment.

3. After rolling back: create a hotfix branch, fix the issue, re-deploy.

---

## Production Deployment Checklist

Run this before merging `staging → main`:

```
Pre-deploy
- [ ] All CI checks green on staging branch
- [ ] Staging smoke test passed
- [ ] No known P0 issues in Linear that haven't been resolved
- [ ] If schema migration: migration tested on staging DB with production-scale data

Deploy
- [ ] Merge staging → main
- [ ] Vercel deployment completes successfully (check Vercel dashboard)
- [ ] No build errors

Post-deploy (first 30 minutes)
- [ ] Monitor Sentry for new errors
- [ ] Verify key user flows work on production
- [ ] Check Vercel function logs for unexpected errors
- [ ] If payments involved: verify one test transaction completes

All clear?
- [ ] Update Linear — mark any deployed issues as Done
- [ ] Update project status in README.md if a phase completed
```
