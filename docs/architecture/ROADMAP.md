# Command Center roadmap (revised October 2026)

This updates the phase order in [`MODERNIZATION_PLAN.md`](MODERNIZATION_PLAN.md) §22 to match where the
app actually is. The detailed design for each phase (tables, security rules, tests, rollback) is
still in that document; this page says **what is done, what comes next, and in which order**.

## Where we are

| Area                                                     | Status                       | Notes                                                                                                                                   |
| -------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0: audit and plan                                  | Done                         | `MODERNIZATION_PLAN.md`                                                                                                                 |
| Phase 1: Expo app, design system, CI                     | Done                         | `apps/command-center`, deployed on Vercel (`deva_portfolio` project)                                                                    |
| UI redesign (monochrome, compact, black dark-mode tiles) | Done                         |                                                                                                                                         |
| Expense manager (Money Manager style)                    | Done on **preview data**     | Transactions, Stats pie and category trend, Budget, Categories, Accounts. Flows in [`EXPENSE_MANAGER_FLOW.md`](EXPENSE_MANAGER_FLOW.md) |
| One line-chart style across the app                      | Done                         | Accounts, Stocks, Mutual funds, sparklines                                                                                              |
| Mutual funds and Stocks screens                          | Design only, **sample data** | Labelled "Sample data · design preview"                                                                                                 |
| Sign-in, real saved data                                 | **Not started**              | Everything you add today is lost on reload                                                                                              |

The original plan built the database (Phase 3) before the screens (Phases 4–5). In practice the
screens were built first on an in-memory store whose actions already match the planned
repositories. So the most valuable next step is to **make the data real**: sign-in first, then
persistence, before adding more screens.

## Revised phase order

| #     | Phase                                   | Goal                                                                                                                                                                 | Depends on           |
| ----- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **2** | **Sign-in and security foundation**     | Only you can open the app; sessions are safe on web and phone                                                                                                        | —                    |
| 3     | Save the expense ledger                 | Accounts, categories, transactions and budgets stored in Supabase with RLS; preview store replaced by repositories; old Vite workspace imported with a parity report | 2                    |
| 4     | Overview on real data                   | Overview numbers from the ledger and read models; first insight rules; decide bar vs line for Cash flow                                                              | 3                    |
| 5     | Money Manager import and power features | CSV import from Money Manager (pulled forward from Phase 9 because it is your current app), search, recurring entries, offline add queue                             | 3                    |
| 6     | Mutual funds on real data               | Holdings and typed transactions, NAV from AMFI via an Edge Function (never from the browser), XIRR                                                                   | 3                    |
| 7     | Stocks on real data (new phase)         | Holdings and trades; quotes from a server-side provider you choose                                                                                                   | 3, provider decision |
| 8     | Reports and insights                    | Monthly, category, investment and net-worth reports with CSV export                                                                                                  | 4–7                  |
| 9     | Polish                                  | Motion, PWA install, notifications, JSON backup export                                                                                                               | —                    |
| 10–12 | Hardening, performance, cutover         | Unchanged from the plan: threat-model tests, bundle ≤ 350 KiB, move the main domain from the Vite app, retire it after 30 days                                       | all                  |

## Phase 2 in steps

Each step is one PR that passes CI on its own.

| Step                  | What ships                                                                                                                                                                                                                                                                                                                                                                                                       | Needs from you                                                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2.1 (in progress)** | Supabase client with the secret-key guards ported from the Vite app; session kept in `sessionStorage` on web and SecureStore on phones; sign-in, forgot-password and reset-password screens; the dashboard requires a session **when Supabase is configured**, and stays in labelled preview mode when it is not; safe `?redirect=` handling; security headers (CSP, HSTS, frame blocking) on the Vercel project | Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the `deva_portfolio` Vercel project; add the app's URLs to Supabase Auth → URL configuration |
| 2.2                   | Migration `0004_auth_hardening.sql`: `internal` schema, sign-up allowlist with a Before-User-Created hook, `profiles`, append-only `audit_logs`, `search_path` fixes on existing functions, legacy 4-argument RPC removed; database tests                                                                                                                                                                        | Run the migration in the Supabase SQL editor (or CLI) after review; enable the Auth hook                                                                                  |
| 2.3                   | Two-factor sign-in (TOTP): enrol in Settings → Security, challenge after password; sessions screen with "sign out other devices"; idle sign-out                                                                                                                                                                                                                                                                  | Scan the QR code with an authenticator app                                                                                                                                |
| 2.4                   | Error reporting with a scrubber that never sends amounts, notes or tokens (optional)                                                                                                                                                                                                                                                                                                                             | A Sentry DSN, if you want it                                                                                                                                              |

## Decisions needed from you

These change Phases 3, 6 and 7; none blocks Phase 2.1.

1. Stamp duty in mutual fund cost basis? (recommended: yes)
2. Review historical category-type flips by hand during import? (plan §3.5, F4)
3. AMFI as the first NAV provider?
4. Phone app stores, or web plus an installable web app first?
5. Should the public portfolio keep showing phone and email?
6. **New:** which stock-quote provider (it must be called from an Edge Function, and its terms must allow personal use)?

## Rules that hold for every phase

- No service-role or secret keys in the app; only the publishable key, protected by RLS.
- Authorization is enforced in the database (RLS, checks, RPCs); screens and route guards are only convenience.
- No financial data or tokens in logs; no financial data sent to external AI services by default.
- No hard-coded market data or personal balances; sample data stays clearly labelled until replaced.
- We do not claim the app cannot be hacked; we reduce risk and test the controls.
