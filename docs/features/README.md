# Features

One section per feature: what it is for, where it lives in the code, what it reads and writes,
and what to watch out for. Paths are under `apps/command-center/src/` unless noted. Every
feature that saves data does so through the same sync (`features/sync/cloudSync.ts` →
`load_ledger` / `sync_ledger`), except the Portfolio editor, which saves item by item. The
Supabase calls are listed in [`../architecture/DATA_ACCESS.md`](../architecture/DATA_ACCESS.md),
and failure behaviour in [`../architecture/EDGE_CASES.md`](../architecture/EDGE_CASES.md).

## Sign-in and security

- **Purpose:** keep financial data private: allowlisted sign-in, two-step code (TOTP), automatic
  sign-out when idle, "keep me signed in" per device.
- **Access:** `/sign-in`, `/verify-code`, `/forgot-password`, `/reset-password`; Settings →
  Account & security, Two-step sign-in, This device.
- **Code:** `features/auth/` (screens, `SessionProvider`, `sessionStore`, `useIdleSignOut`),
  `features/settings/` (`AccountCard`, `SecurityCard`, `DeviceSignInCard`), `lib/data/authRepository.ts`,
  `mfaRepository.ts`, `authStorage*.ts`, `lib/security/redirects.ts`.
- **Data:** Supabase Auth only (no tables of its own from the app).
- **State:** `useSession` (`loading` / `signedOut` / `needsCode` / `signedIn` / `preview`); the
  dashboard layout redirects on it; the database enforces it anyway.
- **Edge cases:** expired session → stores cleared and sign-in shown; signing out with unsent
  changes asks first; idle sign-out sends pending changes first.

## Expenses (transactions, accounts, categories, budgets, people)

- **Purpose:** record every rupee in and out in a few taps and see where it went.
- **Access:** Expenses (Transactions, Stats, Budget, Categories, People), Accounts, the **+** /
  Add expense button on Overview.
- **Code:** `features/expenses/` (`entry/` the add/edit sheet, `components/` lists and calendar,
  `stats/`, `budget/`, `categories/`, `accounts/`, `people/`, `state/expenseStore.ts`,
  `state/transactionForm.ts`), rules in `lib/domain/expenses/`.
- **Data:** `accounts`, `categories`, `people`, `transactions`, `transaction_splits`,
  `repayment_settles` through `load_ledger` / `sync_ledger`.
- **State:** `useExpenseStore` holds the ledger; screens compute balances, totals and budgets
  from it (pure functions, tested).
- **Edge cases:** validation in the form and the database; a double tap on Save adds one entry;
  receipt photos stay on the device (`photos/`). Flows in detail:
  [`../architecture/EXPENSE_MANAGER_FLOW.md`](../architecture/EXPENSE_MANAGER_FLOW.md).

## Notes

- **Purpose:** notes and checklists next to the numbers (colours, pins, labels, archive, search).
- **Access:** Notes.
- **Code:** `features/notes/` (`NotesScreen.tsx`, `components/`, `state/notesStore.ts`).
- **Data:** `notes` through `load_ledger` / `sync_ledger`.
- **Edge cases:** checklist and label sizes are bounded in the database.

## Mutual funds, stocks and tradebook import

- **Purpose:** real returns on investments (FIFO gains, XIRR), SIP tracking, net worth.
- **Access:** Mutual funds, Stocks, **Import**, **Update prices**.
- **Code:** `features/mutual-funds/`, `features/stocks/`, `features/investments/` (stores, hooks,
  import), rules in `lib/domain/investments/`, prices from `supabase/functions/market-refresh`.
- **Guide:** [`INVESTMENTS.md`](INVESTMENTS.md).

## Overview

- **Purpose:** the whole picture at a glance: net worth (accounts, funds, shares), cash flow,
  budget use, recent activity.
- **Access:** `/dashboard`.
- **Code:** `features/overview/` (`useOverviewData.ts` computes everything from the stores).
- **Data:** none of its own; reads the expense, portfolio and market stores.

## Portfolio (public site and editor)

- **Purpose:** the owner's public developer portfolio, the site's home page, edited in the
  dashboard and published without a redeploy.
- **Access:** `/` (public); Dashboard → Portfolio (editor).
- **Code:** `apps/portfolio/` (site), `features/portfolio-site/` and `lib/domain/site/` (editor),
  `apps/command-center/api/site.mjs` (serves the site at `/`).
- **Guide:** [`PORTFOLIO.md`](PORTFOLIO.md).

## Placeholders (not built)

Reports, Goals, Insights, the header Search and Settings → Data & privacy show a labelled
"Planned" screen or sheet and touch no data (`features/shell/PlannedScreen.tsx`,
`PlaceholderSheets.tsx`). See [`../PRODUCT.md`](../PRODUCT.md) for the recommendation.
