# Supabase backend setup

> **Note:** all migrations below have been applied to the project. The SQL files were removed from the repository in October 2026 after being applied; they are in Git history at commit `224176d` (`supabase/migrations`, `supabase/rollbacks`, `supabase/tests`).

## Current implementation

The dashboard authenticates with Supabase email/password Auth. Transactions, accounts, and categories remain in a private per-user `user_workspaces` JSONB snapshot for compatibility. Revision-checked writes prevent silent last-write-wins overwrites: independent record changes merge automatically, while conflicting edits to the same record stop and offer a local export or cloud reload. Portfolio content is stored separately in `public_portfolios`; only published profiles are readable without signing in, and saving requires the owner session.

## One-time project setup

1. In Supabase, confirm the project URL and publishable key match `.env.local`. `.env.local` is ignored by Git. The browser publishable key is expected to be public; never put a service-role or secret key in a `VITE_` variable.
2. Open **SQL Editor** and run `202610040001_private_workspace.sql` if it has not already been applied.
3. Then run `202610040002_conflict_safe_workspace.sql`. This is additive: it preserves the existing workspace row and finance records, adds a revision, routes writes through an owner-checked RPC, creates the published portfolio table, and copies the existing portfolio JSON into it.
4. Run `202610040003_mutual_funds_workspace.sql` to add the per-user mutual-fund and purchase collections. Apply migrations in numeric order before deploying a version of the app that uses mutual funds.
5. Create your account under **Authentication → Users**. For this personal app, turn off public sign-ups after creating the owner account. Do not expose an admin/service key in the app to create users.
6. Run `202610080004_auth_hardening.sql` (Phase 2.2, see [Auth hardening](#auth-hardening-migration-0004) below), then enable the sign-up hook:
   **Authentication → Hooks → Before User Created → Postgres → schema `internal`, function `before_user_created`**.
7. Configure the Supabase Auth site URL and allowed redirect URLs for localhost during development and your exact production origin after deployment.
8. Restart Vite after changing `.env.local`:

   ```cmd
   npm run dev -- --host 0.0.0.0
   ```

## Auth hardening (migration 0004)

What it adds, all enforced in the database rather than the app:

- **Sign-up allowlist.** `internal.auth_allowlist` holds the emails that may create an account, and the Before User Created hook rejects every other sign-up with the same generic message. Every email that already has an account is added when the migration runs. The **Allow new users to sign up** switch can stay off as a second layer.
- **`profiles` and `user_preferences`**, created automatically for every account (existing accounts are backfilled). Users can read and edit only their own row, and only the display name, currency and timezone (profiles) or theme, motion, dashboard layout and the AI opt-in (preferences). The AI opt-in is off by default.
- **`audit_logs`**: an append-only record of who saved what, for example `workspace.save` with the names of the collections that changed. It never stores amounts, notes or any other values. Users can read only their own entries. Nobody can edit or delete entries, not even the table owner, without first removing the trigger.
- **RPC hardening.** `save_user_workspace` and `save_public_portfolio` now pin an empty `search_path`, reject oversized payloads (8 MB for the workspace, 256 KB for the portfolio) and write an audit entry. The unused four-argument `save_user_workspace` is removed; the app calls the six-argument version.
- **Portfolio owner gate.** Only accounts in `internal.portfolio_owners` can publish the public portfolio. Whoever already publishes it is added by the migration.

`internal` is not one of the Data API's exposed schemas, so none of it is reachable from the browser.

**Managing it (SQL Editor):**

```sql
-- Let someone sign up
insert into internal.auth_allowlist (email, note) values ('person@example.com', 'why');
-- Remove them from the list (it does not delete an existing account)
delete from internal.auth_allowlist where email = 'person@example.com';
-- Allow an account to publish the public portfolio
insert into internal.portfolio_owners (user_id) values ('<auth user id>');
```

**Tests.** The SQL tests that checked these rules (run in CI against a fresh Postgres) were removed with the files; see the commit above.

**Rollback.** First remove the hook under Authentication → Hooks, then run `202610080004_auth_hardening_down.sql`. It restores the earlier RPCs and drops the new tables **with their data** (export `audit_logs` first if you need it). Workspace and portfolio data are not touched.

## Finance and notes tables (migration 0005, Phase 3.1)

Run `202610080005_core_finance.sql` after 0004. It creates `accounts`, `categories`, `people`, `transactions`, `transaction_splits`, `repayment_settles` and `notes` for the Command Center. Nothing uses them until Phase 3.2 connects the app, and the legacy app keeps using `user_workspaces`.

- Every row belongs to the signed-in user; others cannot read, change or link to it (RLS plus composite foreign keys).
- Accounts with two-step sign-in turned on must enter the code before these tables open (`aal2`, enforced by the database).
- The rules the app checks (amounts, transfer accounts, category types, split totals, note sizes) are also enforced by the database.
- Changes are recorded in `audit_logs` by column name only.
- Rollback: `202610080005_core_finance_down.sql` drops these tables **with their data**.

## Loading and saving (migration 0006, Phase 3.2)

Run `202610080006_ledger_sync.sql` after 0005. It adds `load_ledger()` and `sync_ledger(jsonb)`, which the Command Center calls when you are signed in. Both run as you (`security invoker`), so Row Level Security, two-step sign-in and every rule from 0005 still apply: they only let the app read everything in one request and save a batch of changes all at once (all or nothing).

Once it is applied and the app is deployed with the Supabase settings, signing in shows **your** data (empty at first) instead of the sample, and changes are saved automatically: the badge next to the page title reads **Saved**, **Saving…** or **Offline · will retry**. Receipt photos stay on the device until private storage arrives (Phase 5).

## Two-step sign-in (Command Center, Phase 2.3)

Turn it on in the app under **Settings → Two-step sign-in**: scan the QR code with an authenticator app (or type the setup key), then enter the first code. From then on, signing in asks for your password and then the 6-digit code. Supabase signs out your other sessions when it is turned on.

- **Day-to-day use:** tick **Keep me signed in on this device** at sign-in on your own phone or computer. The session then survives closing the browser, so the code is asked for only when you sign in again (on a new device, after signing out, or when the session expires). Choose the automatic sign-out under **Settings → This device**.
- TOTP must be enabled in Supabase under **Authentication → Multi-Factor** (on by default).
- Keep access to the authenticator app. If you lose it, the factor can be removed in **Authentication → Users → (your user) → Multi-factor authentication**, then set up again.
- The legacy Vite app does not ask for the code, so its `user_workspaces` data is not protected by two-step sign-in. The new tables from migration 0005 are.

## Existing browser data

When an authenticated user has no cloud workspace and this browser has older local data, the app stops and asks whether to import it or start empty. It never silently assigns local data to an account. Local finance records are removed from browser storage only after the chosen cloud write succeeds. If the write fails, the local copy remains available for retry.

## Security boundaries

- `user_workspaces.user_id` is the primary key and references `auth.users` with cascade deletion.
- RLS is enabled and forced. Separate SELECT, INSERT, UPDATE, and DELETE policies require `auth.uid() = user_id`.
- Table grants are revoked from `PUBLIC` and `anon`; only `authenticated` receives the required table operations.
- The app verifies the current Supabase user before every workspace read and write, and checks that a loaded row belongs to the expected user. RLS remains the actual security boundary.
- The Supabase session is stored in `sessionStorage`; private finance data is no longer written back to local storage after migration.
- Published portfolio content is intentionally public on the public portfolio page. Do not put secrets in portfolio fields. The portfolio save RPC verifies the authenticated owner.
- Do not add service-role keys, database passwords, or admin tokens to frontend files or environment variables prefixed with `VITE_`.

## Verification before deployment

Use two separate Supabase Auth users and browser sessions. Confirm each user sees only their own workspace, that a signed-out session cannot query the table, and that manually changing `user_id` in a request is rejected. Review RLS policies and grants in Supabase before storing real financial records. Use HTTPS in production.

## Current limits

Finance data still uses a single JSONB row rather than normalized transaction, account, and category tables. Revision checks and three-way merging prevent silent overwrites of independent records, but large datasets and analytics will eventually benefit from normalized tables and database backups. The browser app must be online to save; failed saves remain visible and retryable.
