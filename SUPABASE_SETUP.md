# Supabase setup

The Command Center (`apps/command-center`) uses one hosted Supabase project for sign-in and data.
This page lists what is set up on the Supabase side and how to manage it. Connecting the app
(the two `EXPO_PUBLIC_` variables on Vercel) is in
[`apps/command-center/README.md` → Sign-in](apps/command-center/README.md#sign-in-phase-2).

> **History.** Migrations 0001–0004 (the old app's workspace, conflict-safe saves, mutual funds,
> and auth hardening) have been applied and were removed from the repository with their rollback
> scripts and SQL tests; they are in Git history at commit `224176d`. The old Vite app itself was
> removed in October 2026. Migrations 0005–0008, which the Command Center depends on, are in
> `supabase/migrations/`. New database changes add new numbered files there.

## What is in the database

| Part                                               | From                | Used by                                                                     |
| -------------------------------------------------- | ------------------- | --------------------------------------------------------------------------- |
| Sign-up allowlist and its Before User Created hook | 0004                | Every new account (only allowlisted emails can sign up)                     |
| `profiles`, `user_preferences`, `audit_logs`       | 0004                | Created per account; `audit_logs` records changes by column name, no values |
| Finance and notes tables                           | 0005                | The Command Center                                                          |
| `load_ledger()` and `sync_ledger(jsonb)`           | 0006, replaced 0007 | The Command Center, to load and save (now including investments)            |
| Mutual fund and stock tables                       | 0007                | Mutual funds and Stocks pages                                               |
| Market data tables and their functions             | 0007                | Prices, written only by the `market-refresh` Edge Function                  |
| `user_workspaces`, `public_portfolios`             | 0001–0003 (old app) | Nothing. Deleted by 0008 (the app starts from scratch)                      |

`internal` (allowlist, hook, helpers) is not exposed through the Data API, so none of it is
reachable from the browser.

## One-time setup checklist

1. **Migrations applied, in order:** 0001–0004 (done earlier), then
   `202610080005_core_finance.sql`, `202610080006_ledger_sync.sql`,
   `202610090007_investments.sql` and `202610100008_retire_old_app.sql` from
   `supabase/migrations/` (SQL Editor → paste → Run).
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
6. **Prices (optional, recommended):** deploy the `market-refresh` Edge Function and its daily
   schedule ([below](#prices-the-market-refresh-function)). Without it, funds and stocks work
   with NAVs and prices you enter by hand.

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

## Mutual funds and stocks (migration 0007)

Run `202610090007_investments.sql` after 0006. It adds:

- **Your investments:** `mf_funds`, `mf_sips`, `mf_transactions`, `stocks`, `stock_trades`, with the
  same protections as the ledger (own rows only, two-step sign-in, composite keys, audit by column
  name). The database also refuses a redemption or sale of more units or shares than were held on
  that date, and an SIP instalment that belongs to another fund.
- **Market data:** `mf_schemes` (AMFI list with the latest NAV), `mf_nav_history` (only for
  schemes someone holds), `securities` and `security_prices` (end-of-day prices; history only for
  held shares) and `market_refresh_runs` (a log of every update). Signed-in users can only read
  them; only the service role (the Edge Function) writes.
- **Functions:** `load_market()`, `search_funds(text)`, `search_securities(text)`,
  `nav_on(integer, date)` for the app; `market_*` functions for the Edge Function only.
- `load_ledger()` and `sync_ledger(jsonb)` are replaced to carry the new tables (same rules).

The file ends with a commented rollback.

## Retiring the old app's data (migration 0008)

The Command Center starts from scratch: the old app's data is not imported (owner's decision,
October 2026). `202610100008_retire_old_app.sql` **permanently deletes** `user_workspaces` and
`public_portfolios` with the functions that wrote them. Nothing in the Command Center reads them.
Take a backup first (Database → Backups) if you might want them again; there is no rollback.

Your own data in the Command Center (entries, notes, funds, stocks) is not touched by it. To clear
that as well and load your funds and shares from the Excel tracker, a one-time SQL file was made
for you outside the repository (it holds your personal data, so it is never committed).

## Prices: the market-refresh function

`supabase/functions/market-refresh` downloads, on Supabase's servers, AMFI's daily NAV file and
the exchange end-of-day price file (NSE; BSE if NSE is unavailable), plus older NAVs from mfapi.in
for the schemes you hold. It never runs in the browser. Details:
[`docs/features/INVESTMENTS.md`](docs/features/INVESTMENTS.md#prices).

### 1. Deploy it (once; again only when the function changes)

**Option A, automatic from GitHub (recommended):** add two repository secrets
(GitHub → Settings → Secrets and variables → Actions):

- `SUPABASE_ACCESS_TOKEN`: create one at supabase.com/dashboard/account/tokens.
- `SUPABASE_PROJECT_REF`: the part of your Project URL before `.supabase.co`.

Then run **Actions → Deploy Edge Functions → Run workflow** (it also runs on every change to
`supabase/functions` on `main`).

**Option B, Supabase CLI:** `supabase functions deploy market-refresh --project-ref <ref> --no-verify-jwt`.

**Option C, dashboard:** Edge Functions → Deploy a new function → via editor, name it
`market-refresh`, add the files `index.ts`, `handler.ts` and `parse.ts` from
`supabase/functions/market-refresh/`, and turn **Verify JWT** off (the function checks callers
itself: a signed-in user's token, or the schedule's secret).

Test it: open the app signed in → Mutual funds → **Update prices**. The message says what was
updated; `market_refresh_runs` in the Table Editor shows each run.

### 2. Daily schedule (optional, recommended)

1. Make a long random secret (at least 24 characters) and add it as an Edge Function secret named
   `MARKET_REFRESH_SECRET` (Edge Functions → Secrets).
2. Database → Extensions: enable `pg_cron` and `pg_net`.
3. In the SQL Editor, store the URL and the same secret in Vault, then schedule two runs on
   weekdays: after the exchange file and AMFI NAVs are out (23:45 IST), and a morning catch-up
   (07:00 IST):

```sql
select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/market-refresh', 'market_refresh_url');
select vault.create_secret('<the MARKET_REFRESH_SECRET value>', 'market_refresh_secret');

select cron.schedule('market-refresh-evening', '15 18 * * 1-5', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_refresh_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-refresh-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'market_refresh_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000)
$$);
select cron.schedule('market-refresh-morning', '30 1 * * 2-6', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_refresh_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-refresh-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'market_refresh_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000)
$$);
```

The secret is stored encrypted in Vault and as a function secret; it is never in the repository or
the app. To stop: `select cron.unschedule('market-refresh-evening');` (and `-morning`).

### Other settings and troubleshooting

- `ALLOWED_ORIGINS` (function secret, optional): the web addresses allowed to call the function,
  comma-separated. Default: `https://devabalan-command-center.vercel.app,http://localhost:8081`.
- "Automatic prices are not set up yet": the function is not deployed (step 1).
- A failed NSE run followed by an ok BSE run is normal if NSE refuses downloads from the server.
  If both fail, the run's message says why; values keep the last known price, and a price entered
  by hand (Edit stock / Edit fund) is used when it is newer.
- Share prices are end of day; there is no free official live-quote service.

## Two-step sign-in

Turn it on in the app under **Settings → Two-step sign-in**: scan the QR code with an
authenticator app (or type the setup key), then enter the first code. From then on, signing in
asks for your password and then the 6-digit code.

- **Day-to-day use:** tick **Keep me signed in on this device** at sign-in on your own phone or
  computer; the code is then asked for only when you sign in again. Choose the automatic sign-out
  under **Settings → This device**.
- If you lose the authenticator app, remove the factor in **Authentication → Users → (your user)
  → Multi-factor authentication**, then set it up again.

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
