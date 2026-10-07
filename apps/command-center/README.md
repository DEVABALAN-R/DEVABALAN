# Command Center (Expo)

The new cross-platform app (iOS, Android, web) that will replace the Vite app at the
repository root. It is being built in phases — see
[`docs/architecture/MODERNIZATION_PLAN.md`](../../docs/architecture/MODERNIZATION_PLAN.md).

**Status: Phase 1, the 2026 UI redesign, the expense manager, and Phase 2.1 (sign-in).** The
current phase order is in [`ROADMAP.md`](../../docs/architecture/ROADMAP.md).

- **Expense manager** (Expenses › Transactions, Stats, Budget, Categories, plus Accounts and the
  global add/edit sheet) works end to end against an **in-memory preview store** seeded with
  labelled sample data. You can add, edit and delete entries, categories, budgets and accounts.
  Every change is lost on reload, and a "Preview · not saved" badge says so. Flows and rules:
  [`EXPENSE_MANAGER_FLOW.md`](../../docs/architecture/EXPENSE_MANAGER_FLOW.md).
- **People and splits:** split an expense with friends; Stats and budgets count your share, and
  Expenses › People tracks who owes you and records repayments. Notes are suggested as you type,
  and entries can carry a receipt photo (kept in memory in the preview).
- **Notes** (Google Keep style): text notes and checklists with colours, pins, labels, archive
  and search, on the same preview footing.
- **Overview** reads the same expense ledger. Mutual funds and Stocks are designs driven by
  static sample data (fictional names, "Sample data · design preview" badge).
- Goals, Insights and Reports are labelled placeholders.

Nothing reads or writes your real data yet (that is Phase 3). Keep using the existing app for
real finances.

## Sign-in (Phase 2.1)

Without Supabase settings the app runs as a labelled **preview** and asks for no sign-in. With
them, every `/dashboard` page requires a session (the guard is convenience; Row Level Security
is the real boundary).

1. Copy `.env.example` to `.env.local` and fill in the project URL and the **publishable** key
   (Supabase → Project Settings → API). The app refuses `sb_secret_` and service-role keys.
2. In Supabase → Authentication → URL configuration, add the app's URLs to the redirect
   allowlist, for example `https://<your-app>.vercel.app/reset-password` and
   `http://localhost:8081/reset-password`.
3. On Vercel, add the same two `EXPO_PUBLIC_` variables to the project that builds
   `apps/command-center`, then redeploy. Locally, restart with `npx expo start --clear`:
   public variables are inlined at build time.

Sessions live in `sessionStorage` on web (they end with the tab) and in the encrypted
SecureStore on iOS/Android. Security headers (CSP, HSTS, frame blocking) are set in
`vercel.json`.

## Run

```bash
cd apps/command-center
npm ci
npm run web        # browser
npm run ios        # iOS simulator / Expo Go
npm run android    # Android emulator / Expo Go
```

The design-system gallery is at `/dev/components` (development builds only; production
builds redirect it away).

## Checks (same as CI)

```bash
npm run typecheck
npx eslint . --max-warnings 0
npm run format:check
npm test
npm run build:web && npm run check:bundle
```

## Structure

```
src/
  app/                 routes only (Expo Router); thin, ≤ 80 lines each
    dashboard/         adaptive shell + destinations
    dev/components     design-system gallery (dev only)
  components/          ui · layout · navigation · feedback · overlays · icons.ts
  components/charts/   BarChart, AreaChart, DonutChart, PieChart (callouts), Sparkline
                       (react-native-svg, no extra deps)
  features/            shell (header, nav, rail, tab bar), overview, expenses, mutual-funds,
                       stocks, settings, dev-gallery
  features/expenses/   state/ (preview store, seed, entry-form state) · entry/ (add/edit sheet)
                       · components/ (Transactions) · stats/ · budget/ · categories/ · accounts/
  lib/domain/expenses/ pure, tested money rules: balances, totals, breakdowns, budgets,
                       validation (no React, no storage)
  features/preview/    SAMPLE DATA for the design preview — delete when real data lands
  hooks/               useBreakpoint, useInteractionState
  lib/formatting/      display-only money/percent formatting (integer paise in)
  state/               small Zustand UI store (no financial data)
  theme/               tokens, typography, semantic colours (light/dark), motion, ThemeProvider
```

## Conventions

- **Colours** come from semantic roles in `src/theme/colors.ts`; no hex values elsewhere.
  `src/theme/__tests__/contrast.test.ts` enforces WCAG contrast for every text/UI pairing.
- **Icons** are imported from `@/components/icons` (per-icon imports). Importing the
  `lucide-react-native` barrel is a lint error because it adds ~2 MB to the web bundle.
- **Money** is passed to UI as integer minor units (paise); formatting happens only at display.
- **Motion** uses React Native's built-in `Animated` (no Reanimated: it cost ~140 KiB gzip on
  web). Timings come from `useMotion()`, which honours the OS reduced-motion setting; `Appear`
  and `useSlidingIndicator` cover entrances and moving selection indicators.
- **Focus rings** show for keyboard focus only (`useInteractionState` follows :focus-visible).
- **Responsive layouts** are chosen per breakpoint (`useBreakpoint`), not shrunk from desktop.
- **Single-screen pages** (all Expenses pages, Accounts, Mutual funds, Stocks) use `<Screen fit>`: on desktop the
  page never scrolls and panels scroll internally; windows 700–819 px tall get a denser layout,
  and below 700 px the page scrolls rather than clipping. Tablets and phones always scroll.
- Web output is a single-page app; `vercel.json` rewrites unknown paths to `index.html`. To
  deploy, create a Vercel project from this repo with **Root Directory** `apps/command-center`;
  `vercel.json` supplies the install, build (`npm run build:web`) and output (`dist`) settings.
