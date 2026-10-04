# Run the dashboard on another laptop

This guide assumes the app will connect to the same hosted Supabase project, so existing account, finance and portfolio data remain there. `.env.local` contains project configuration and is intentionally not committed or transferred with the source.

## 1. Install prerequisites

Install Git and Node.js **22.19.0** on the new laptop. The project includes this version in `.nvmrc`. Open a new Command Prompt and check:

```cmd
node --version
npm --version
git --version
```

## 2. Get the application source

If the project is in a Git repository:

```cmd
git clone <YOUR-REPOSITORY-URL> devabalan-dashboard
cd devabalan-dashboard
```

For a manual copy, copy the source and configuration files. Do **not** copy `node_modules`, `.npm-cache`, `dist`, `.env.local`, or editor/temporary files. Never email `.env.local` or commit it.

## 3. Configure Supabase

In the existing Supabase project:

1. Open **Project Settings → API** and copy the Project URL and publishable key. Do not use a secret or service-role key.
2. In **Authentication → URL Configuration**, make sure the local app URL is allowed for development (normally `http://localhost:5173`).
3. If setting up a new Supabase project, run these SQL files in order from **SQL Editor**:
   - `supabase/migrations/202610040001_private_workspace.sql`
   - `supabase/migrations/202610040002_conflict_safe_workspace.sql`
   - `supabase/migrations/202610040003_mutual_funds_workspace.sql`

Do not rerun migrations blindly on an existing production database. Check the schema/migration history first. Keep public sign-ups disabled. Provision the single owner in Supabase Auth if that account does not already exist.

## 4. Add local environment settings

From the project folder:

```cmd
copy .env.example .env.local
notepad .env.local
```

Replace the placeholders and save:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

These are browser-visible project settings. **Never** use a Supabase secret/service-role key or database password here. `.env.local` is ignored by Git.

## 5. Install and start

```cmd
npm ci
npm run dev
```

Open the Vite URL shown in Command Prompt, usually `http://localhost:5173`, and sign in with the existing owner account. Direct dashboard links and page refreshes should stay on the requested dashboard page after authentication.

To open the development app on a phone on the same trusted Wi-Fi, run:

```cmd
npm run dev -- --host 0.0.0.0
```

Find the laptop's local IPv4 address with `ipconfig`, then open `http://<LAPTOP-IP>:5173` on the phone. This is for local development only; do not expose the Vite development server to the public internet.

## 6. Build and preview

```cmd
npm run typecheck
npm run build
npm run preview
```

The build creates `dist/`. The preview server is for local review, not a production web server.

## Troubleshooting

- **Missing Supabase configuration:** confirm `.env.local` is beside `package.json`, the variable names match exactly, and restart Vite after editing it.
- **Sign-in redirect error:** add the exact local URL to Supabase Auth's allowed redirect URLs.
- **Private data/table errors:** verify migrations were applied in order and RLS policies exist. Do not disable RLS to work around an error.
- **Dependencies fail to install:** confirm Node.js is 22.19.0, remove only the generated `node_modules` folder if needed, then run `npm ci` again.
- **Phone cannot connect:** check both devices are on the same trusted network, use the laptop's IPv4 address, and allow Node.js through the private-network firewall. Do not use a public network for this development server.

## Production deployment

Set the two Supabase variables in the host's build environment, deploy the generated `dist/` output, and set the exact HTTPS site URL and allowed redirect URLs in Supabase Auth. Confirm all required migrations and RLS policies are applied, keep public sign-ups disabled, use HTTPS, and maintain Supabase backups. Never deploy `.env.local`, `node_modules`, `.npm-cache` or local scratch files.
