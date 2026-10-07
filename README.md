# Devabalan Personal Dashboard

A responsive React + TypeScript dashboard with a public portfolio and a private, Supabase-authenticated personal workspace. The workspace includes an expense tracker, accounts, configurable categories, and mutual-fund holdings and purchase history. Finance amounts use Indian rupees (INR).

> **Redesign in progress.** A new cross-platform app (Expo: iOS, Android and web) is being built in
> [`apps/command-center/`](apps/command-center/README.md) following
> [`docs/architecture/MODERNIZATION_PLAN.md`](docs/architecture/MODERNIZATION_PLAN.md). Until it
> reaches parity, this Vite app remains the production app.

## Run locally

Requirements: Node.js 22.19.0 (see `.nvmrc`) and npm.

```cmd
copy .env.example .env.local
```

Edit `.env.local` and enter the Supabase project URL and **publishable** key. Then run:

```cmd
npm ci
npm run dev
```

Open the local URL printed by Vite. To access the development server from another device on the same trusted network, run `npm run dev -- --host 0.0.0.0` and use this computer's LAN IP from the other device.

For complete setup on another laptop, see [RUN_ON_ANOTHER_LAPTOP.md](RUN_ON_ANOTHER_LAPTOP.md). For schema, RLS and security details, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Production build

```cmd
npm run typecheck
npm run build
npm run preview
```

The production bundle is written to `dist/`. Deploy it to a static host that supports SPA fallback routing. Vercel and Netlify fallback configuration is included. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the host's build environment and configure the production origin in Supabase Auth.

## Project structure

```text
src/
  app/                 App shell, routing and shared workspace layout
  features/
    auth/              Sign-in, protected routes and session timeout
    dashboard/         Home page
    finance/           Expense tracker, accounts, categories and models
    portfolio/         Public portfolio and private editor
    stocks/            Mutual-fund dashboard and investment calculations
    workspace/         Authenticated cloud workspace persistence
  shared/              Shared components, Supabase client and styles
supabase/migrations/   Database schema, RPCs and row-level security
public/                Static assets used by the portfolio
```

See [APPLICATION_GUIDE.md](APPLICATION_GUIDE.md) for application behavior, routes, data boundaries and architecture notes.

## Security

- The browser must use only the Supabase publishable key. Never put a service-role key, database password or other secret in a `VITE_` variable.
- Keep `.env.local` private. It is ignored by Git; `.env.example` contains placeholders only.
- Disable public sign-ups for this single-owner app and provision the owner in Supabase Auth.
- Supabase RLS policies and owner-checked RPCs enforce data access; frontend route guards are not the database security boundary.
- Use HTTPS in production and configure only the required Auth redirect URLs.
