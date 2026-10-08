# Supabase setup

The Command Center (`apps/command-center`) uses one hosted Supabase project for sign-in and data.
This page lists what is set up on the Supabase side and how to manage it. Connecting the app
(the two `EXPO_PUBLIC_` variables on Vercel) is in
[`apps/command-center/README.md` → Sign-in](apps/command-center/README.md#sign-in-phase-2).

> **History.** Migrations 0001–0004 (the old app's workspace, conflict-safe saves, mutual funds,
> and auth hardening) have been applied and were removed from the repository with their rollback
> scripts and SQL tests; they are in Git history at commit `224176d`. The old Vite app itself was
> removed in October 2026. Migrations 0005 and 0006, which the Command Center depends on, are kept
> in `supabase/migrations/`. New database changes add new numbered files there.

## What is in the database

| Part                                               | From                | Used by                                                                     |
| -------------------------------------------------- | ------------------- | --------------------------------------------------------------------------- |
| Sign-up allowlist and its Before User Created hook | 0004                | Every new account (only allowlisted emails can sign up)                     |
| `profiles`, `user_preferences`, `audit_logs`       | 0004                | Created per account; `audit_logs` records changes by column name, no values |
| Finance and notes tables                           | 0005                | The Command Center                                                          |
| `load_ledger()` and `sync_ledger(jsonb)`           | 0006                | The Command Center, to load and save                                        |
| `user_workspaces`, `public_portfolios`             | 0001–0003 (old app) | Nothing now. Holds your older data until Phase 3.3 imports it               |

`internal` (allowlist, hook, helpers) is not exposed through the Data API, so none of it is
reachable from the browser.

## One-time setup checklist

1. **Migrations applied, in order:** 0001–0004 (done earlier), then
   `202610080005_core_finance.sql` and `202610080006_ledger_sync.sql` from `supabase/migrations/`.
2. **Sign-up hook on:** Authentication → Hooks → Before User Created → Postgres → schema `internal`,
   function `before_user_created`. The **Allow new users to sign up** switch can stay off as a
   second layer.
3. **Two-step sign-in available:** Authentication → Multi-Factor → TOTP enabled (on by default).
4. **Redirect URLs:** Authentication → URL Configuration → add
   `https://devabalan-command-center.vercel.app/reset-password` (and
   `http://localhost:8081/reset-password` for local development). Set the Site URL to
   `https://devabalan-command-center.vercel.app`.
5. **Keys:** the app uses only the **Project URL** and the **publishable** key. Never use the
   secret or service-role key anywhere in the app or its Vercel variables.

## Managing access (SQL Editor)

```sql
-- Let someone sign up
insert into internal.auth_allowlist (email, note) values ('person@example.com', 'why');
-- Remove them from the list (it does not delete an existing account)
delete from internal.auth_allowlist where email = 'person@example.com';
```

## Finance and notes tables (migration 0005)

`accounts`, `categories`, `people`, `transactions`, `transaction_splits`, `repayment_settles` and
`notes`.

- Every row belongs to the signed-in user; others cannot read, change or link to it (RLS plus
  composite foreign keys).
- Accounts with two-step sign-in turned on must enter the code before these tables open (`aal2`,
  enforced by the database).
- The rules the app checks (amounts, transfer accounts, category types, split totals, note sizes)
  are also enforced by the database.
- Changes are recorded in `audit_logs` by column name only.

## Loading and saving (migration 0006)

`load_ledger()` and `sync_ledger(jsonb)` run as the signed-in user (`security invoker`), so Row
Level Security, two-step sign-in and every rule from 0005 still apply. They let the app read
everything in one request and save a batch of changes all at once (all or nothing).

Signed in, the app shows **your** data (empty at first) and saves changes automatically; the
badge next to the page title reads **Saved**, **Saving…** or **Offline · will retry**. Receipt
photos stay on the device until private storage arrives (Phase 5).

## Two-step sign-in

Turn it on in the app under **Settings → Two-step sign-in**: scan the QR code with an
authenticator app (or type the setup key), then enter the first code. From then on, signing in
asks for your password and then the 6-digit code.

- **Day-to-day use:** tick **Keep me signed in on this device** at sign-in on your own phone or
  computer; the code is then asked for only when you sign in again. Choose the automatic sign-out
  under **Settings → This device**.
- If you lose the authenticator app, remove the factor in **Authentication → Users → (your user)
  → Multi-factor authentication**, then set it up again.

## Older data (`user_workspaces`)

Your finances saved by the old app are still in `user_workspaces` (and the portfolio in
`public_portfolios`). Removing the old app's code did not touch them. Phase 3.3 imports them into
the new tables with a parity report (counts and balances must match). Do not drop these tables
before that import is confirmed and a backup is taken.

## Security boundaries

- Row Level Security is the security boundary; screens and route guards are convenience only.
- Table grants are revoked from `PUBLIC` and `anon`; only `authenticated` gets the operations it
  needs, and only on its own rows.
- No service-role keys, database passwords or admin tokens in the app, in `EXPO_PUBLIC_`
  variables, or in the repository.

## Verification before relying on it

Use two separate accounts in separate browsers. Confirm each sees only its own data, that a
signed-out session gets nothing, and that changing a `user_id` in a request is rejected. Use
HTTPS in production.
