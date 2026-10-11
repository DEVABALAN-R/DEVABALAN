# Devabalan Command Center

Personal finance and productivity app: expenses, accounts, budgets, people and splits, notes,
mutual funds and stocks. Amounts are in Indian rupees (INR). One Expo codebase for web, iOS and
Android, backed by Supabase.

Live web app: **devabalan-command-center.vercel.app**

## Repository map

```text
apps/command-center/   The app (Expo Router, React Native Web). Its README covers running,
                       checks, deployment and connecting to Supabase
supabase/migrations/   Ledger and notes (0005), load/save (0006), mutual funds, stocks and
                       market data (0007), retiring the old app's data (0008), fund ISINs (0009)
supabase/one-time/     One-run update (0007 + 0008 + Zerodha funds and stocks) and the Zerodha load
supabase/functions/    market-refresh: fetches NAVs and closing prices on the server
docs/architecture/     ARCHITECTURE.md, ROADMAP.md, decision records, expense manager flows
docs/features/         How features work (INVESTMENTS.md)
SUPABASE_SETUP.md      Supabase side: migrations, price function and schedule, sign-in, security
.github/workflows/     CI (app checks, Edge Function checks) and Edge Function deployment
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

Done: sign-in with two-step codes; the expense manager, Notes, **mutual funds and stocks**
(holdings, SIPs, FIFO gains, XIRR, AMFI NAVs and end-of-day share prices) saved to Supabase; the
Overview's net worth includes them; Zerodha tradebooks import after you review and approve each
trade. The ledger starts from scratch (the old app's data is
retired by migration 0008). Next: importing from the export of the app you use today, then the
PF / EPF tracker and salary payslips. The full plan, including goals, other assets and personal
trackers: [`docs/architecture/ROADMAP.md`](docs/architecture/ROADMAP.md). How it is built:
[`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md).

To get automatic prices, run migration 0007 and deploy the price function
([`SUPABASE_SETUP.md`](SUPABASE_SETUP.md#prices-the-market-refresh-function)).

The earlier Vite app was removed in October 2026; it is in Git history (last commit before
removal: `efc04a9`). Its saved data is deleted by migration 0008.

## Security

- The app uses only the Supabase **publishable** key. Never put a secret or service-role key, a
  database password or any other secret in an `EXPO_PUBLIC_` variable, or commit one.
- Keep `.env.local` private (ignored by Git; `.env.example` holds placeholders only).
- New accounts are blocked server-side except for allowlisted emails (see `SUPABASE_SETUP.md`).
- Row Level Security and the database checks are the security boundary; screens and route guards
  are convenience only.
