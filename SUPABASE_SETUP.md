# Supabase backend setup

## Current implementation

The dashboard authenticates with Supabase email/password Auth. Transactions, accounts, and categories remain in a private per-user `user_workspaces` JSONB snapshot for compatibility. Revision-checked writes prevent silent last-write-wins overwrites: independent record changes merge automatically, while conflicting edits to the same record stop and offer a local export or cloud reload. Portfolio content is stored separately in `public_portfolios`; only published profiles are readable without signing in, and saving requires the owner session.

## One-time project setup

1. In Supabase, confirm the project URL and publishable key match `.env.local`. `.env.local` is ignored by Git. The browser publishable key is expected to be public; never put a service-role or secret key in a `VITE_` variable.
2. Open **SQL Editor** and run [`supabase/migrations/202610040001_private_workspace.sql`](supabase/migrations/202610040001_private_workspace.sql) if it has not already been applied.
3. Then run [`supabase/migrations/202610040002_conflict_safe_workspace.sql`](supabase/migrations/202610040002_conflict_safe_workspace.sql). This is additive: it preserves the existing workspace row and finance records, adds a revision, routes writes through an owner-checked RPC, creates the published portfolio table, and copies the existing portfolio JSON into it.
4. Run [`supabase/migrations/202610040003_mutual_funds_workspace.sql`](supabase/migrations/202610040003_mutual_funds_workspace.sql) to add the per-user mutual-fund and purchase collections. Apply migrations in numeric order before deploying a version of the app that uses mutual funds.
5. Create your account under **Authentication → Users**. For this personal app, turn off public sign-ups after creating the owner account. Do not expose an admin/service key in the app to create users.
6. Configure the Supabase Auth site URL and allowed redirect URLs for localhost during development and your exact production origin after deployment.
7. Restart Vite after changing `.env.local`:

   ```cmd
   npm run dev -- --host 0.0.0.0
   ```

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
