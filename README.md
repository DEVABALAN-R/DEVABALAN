# Devabalan Command Center

Personal finance and productivity app with a public portfolio: expenses, accounts, budgets,
people and splits, notes, mutual funds and stocks. Amounts are in Indian rupees (INR).

The repository holds two apps while the new one takes over:

| App                                          | Where                                                    | Status                                                                                                          |
| -------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Command Center** (Expo: web, iOS, Android) | [`apps/command-center/`](apps/command-center/README.md)  | The new app. Sign-in, two-step sign-in and the full expense manager are built; your data is saved from Phase 3. |
| **Legacy dashboard** (Vite + React)          | repository root (`src/`, `index.html`, `vite.config.ts`) | Still the app that **saves** your finances and portfolio. Kept until Phase 3 moves the data, then retired.      |

The plan and the current phase order: [`docs/architecture/ROADMAP.md`](docs/architecture/ROADMAP.md)
(detail in [`MODERNIZATION_PLAN.md`](docs/architecture/MODERNIZATION_PLAN.md)).

## Repository map

```text
apps/command-center/   New Expo app (its README covers running, checks and sign-in setup)
supabase/migrations/   Finance tables (0005) and load/save functions (0006), both applied
docs/architecture/     Roadmap, modernization plan, expense manager flows
SUPABASE_SETUP.md      Supabase setup, sign-up allowlist, two-step sign-in, security notes
src/, public/, ...     Legacy Vite app (until cutover)
```

`supabase/migrations/` keeps the two migrations the new app depends on (0005, 0006); the older migrations, rollbacks and SQL tests were removed after being applied and remain in Git history at commit `224176d`. See `SUPABASE_SETUP.md`.

## Legacy dashboard: run and deploy

Requirements: Node.js 22 (see `.nvmrc`) and npm. It connects to the same hosted Supabase project.

```bash
cp .env.example .env.local   # then fill in the project URL and the publishable key
npm ci
npm run dev                  # local development
npm run typecheck && npm run build   # production bundle in dist/
```

On Vercel, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` on the project that builds
the repository root. Routes: `/` public portfolio, `/login`, `/dashboard/...` private (finance,
accounts, categories, mutual funds, portfolio editor). Data lives in one `user_workspaces` row per
user, protected by Row Level Security and written through revision-checked RPCs.

## Security

- Apps use only the Supabase **publishable** key. Never put a secret or service-role key, a
  database password or any other secret in a `VITE_` or `EXPO_PUBLIC_` variable, or commit one.
- Keep `.env.local` private (ignored by Git; `.env.example` holds placeholders only).
- New accounts are blocked server-side except for allowlisted emails (see `SUPABASE_SETUP.md`).
- Row Level Security and owner-checked RPCs are the security boundary; screens and route guards
  are convenience only.
