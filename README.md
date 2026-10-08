# Devabalan Command Center

Personal finance and productivity app: expenses, accounts, budgets, people and splits, notes,
mutual funds and stocks. Amounts are in Indian rupees (INR). One Expo codebase for web, iOS and
Android, backed by Supabase.

Live web app: **devabalan-command-center.vercel.app**

## Repository map

```text
apps/command-center/   The app (Expo Router, React Native Web). Its README covers running,
                       checks, deployment and connecting to Supabase
supabase/migrations/   Finance and notes tables (0005) and load/save functions (0006)
docs/architecture/     Roadmap, the original modernization plan, expense manager flows
SUPABASE_SETUP.md      Supabase side: hooks, two-step sign-in, access management, security
.github/workflows/     CI: typecheck, lint, format, tests, web build, bundle size
```

## Quick start

Requirements: Node.js 22 (see `.nvmrc`) and npm.

```bash
cd apps/command-center
cp .env.example .env.local   # fill in the Supabase Project URL and publishable key
npm ci
npm run web                  # or: npm run ios / npm run android
```

Without the two Supabase values the app runs as a labelled **preview** with sample data and no
sign-in.

## Deploy (Vercel)

The Vercel project **devabalan-command-center** builds `apps/command-center` (Root Directory)
using its `vercel.json` (build `npm run build:web`, output `dist`, security headers).

1. Settings → Environment Variables: `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for **All Environments**.
2. Redeploy with **Use existing build cache** unticked whenever they change (they are built into
   the bundle).
3. The site should open on **Sign in**. If it shows "Preview · not saved", the build did not get
   the variables.

Full steps: [`apps/command-center/README.md` → Sign-in](apps/command-center/README.md#sign-in-phase-2).
Supabase side: [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md).

## Status

Done: sign-in with two-step codes, the expense manager and Notes saved to Supabase. Next: import
the older data from `user_workspaces` (Phase 3.3), then the Overview on real data. Mutual funds
and Stocks are design previews on labelled sample data. Phase order:
[`docs/architecture/ROADMAP.md`](docs/architecture/ROADMAP.md).

The earlier Vite app was removed in October 2026; it is in Git history (last commit before
removal: `efc04a9`). Its saved data is still in Supabase until Phase 3.3 imports it.

## Security

- The app uses only the Supabase **publishable** key. Never put a secret or service-role key, a
  database password or any other secret in an `EXPO_PUBLIC_` variable, or commit one.
- Keep `.env.local` private (ignored by Git; `.env.example` holds placeholders only).
- New accounts are blocked server-side except for allowlisted emails (see `SUPABASE_SETUP.md`).
- Row Level Security and the database checks are the security boundary; screens and route guards
  are convenience only.
