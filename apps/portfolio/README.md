# Devabalan portfolio (public site)

The public developer portfolio. Its content is edited in the Command Center (Dashboard →
Portfolio) and stored in Supabase; this site shows the version you last **published**. How it
fits together: [`docs/features/PORTFOLIO.md`](../../docs/features/PORTFOLIO.md) and
[ADR 0010](../../docs/architecture/decisions/0010-public-portfolio-site.md).

- Vite + React 19 + TypeScript, rendered on the server by one Vercel Function
  (`api/render.ts`) and hydrated in the browser. No UI or animation library: CSS,
  IntersectionObserver, one canvas and View Transitions.
- Reads only `portfolio_public(handle)` (published snapshot), `portfolio_preview(token)` and
  writes only through `portfolio_contact(…)`. No sign-in and no secrets.

## Settings

Server-side environment variables (Vercel → Settings → Environment Variables, or `.env` for
local runs; see [`.env.example`](.env.example)):

| Variable                   | Required | Value                                                                              |
| -------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `SUPABASE_URL`             | Yes      | The Supabase Project URL (`https://<ref>.supabase.co`)                             |
| `SUPABASE_PUBLISHABLE_KEY` | Yes      | The **publishable** key (`sb_publishable_…`). Never the secret or service-role key |
| `PORTFOLIO_HANDLE`         | Yes      | The site address set in Dashboard → Portfolio → Profile (e.g. `devabalan`)         |
| `SITE_URL`                 | No       | This site's public address, used for canonical links, the sitemap and social cards |

These values are public by design: the page hands the URL, key and handle to the browser so it
can refresh content and send the contact form. If the key looks secret (`sb_secret_…` or a
service-role token), the server does not use it and answers every page with a 500 error.

## Run locally

Requirements: Node.js 22.13 or later.

```bash
cd apps/portfolio
cp .env.example .env     # fill in the values above
npm ci
npm run dev              # http://localhost:5173, server-rendered like production
```

Production build served the way Vercel serves it:

```bash
npm run build            # dist/ (browser) and dist-server/ (server bundle)
npm run preview:local    # http://localhost:4180 (reads the same variables)
```

For layout work without a database, `MOCK_DOCUMENT=path/to/document.json npm run preview:local`
answers Supabase calls from a JSON file shaped like `portfolio_public`'s result. It is a local
aid only and is not part of the deployed site.

## Checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm test                 # Vitest: parsing, Markdown, SEO, server responses, hydration, contact, preview
npm run build
npm run check:bundle     # JavaScript ≤ 110 KiB, CSS ≤ 16 KiB (gzip)
```

CI runs all of them (`.github/workflows/ci.yml`, job "Portfolio site (Vite)").

`package-lock.json` was created with npm 11 (`npx npm@11 install`), because npm 10.9 stops
with an internal error while resolving Vitest's dependencies. `npm ci` works with npm 10 and 11.
When adding or updating packages, use npm 11.

## Deploy on Vercel

A separate Vercel project from the dashboard (its own address, so the public site never shares
a browser origin with your signed-in dashboard).

1. Vercel → **Add New → Project** → import `DEVABALAN-R/DEVABALAN`.
2. **Root Directory:** `apps/portfolio`. Framework Preset: **Other** (the settings come from
   `vercel.json`: install `npm ci`, build `npm run build`, output `dist`, the render function and
   security headers).
3. **Environment Variables:** the four above, for Production (and Preview if you use preview
   deployments). Changing them needs a redeploy.
4. Deploy, then open the site. Until you publish from the dashboard it shows "Nothing is
   published here yet" (HTTP 404).
5. In the dashboard → Portfolio → Profile: set **Site address** to the same value as
   `PORTFOLIO_HANDLE` and **Public site URL** to the deployed address (Preview uses it). Add your
   content, use **Preview**, then **Publish**.

Publishing never needs a redeploy: pages are cached for 60 seconds at the edge and refreshed in
the browser when older than 30 seconds.

### What the server sends

| Path                  | Response                                                                    |
| --------------------- | --------------------------------------------------------------------------- |
| `/`                   | The portfolio (200); 404 when nothing is published; 503 if Supabase is down |
| `/projects/<address>` | A project page (200) or a 404 page                                          |
| `/preview#t=…`        | A private preview from the dashboard: not cached, `noindex`, no referrer    |
| `/sitemap.xml`        | Home and every published project                                            |
| `/robots.txt`         | Allows everything except `/preview`, points to the sitemap                  |
| `/assets/*`           | Hashed files, cached for a year                                             |

Every page gets a Content Security Policy (scripts only from this site plus one hashed inline
script; images and requests only from this site and your Supabase project), HSTS, `nosniff`,
frame blocking and a strict referrer policy.

## Licences

Fonts: Geist and Geist Mono (SIL Open Font License), Instrument Serif (SIL OFL), from
Fontsource. A few icon outlines are adapted from Lucide (ISC), see
[`licenses/lucide.txt`](licenses/lucide.txt).
