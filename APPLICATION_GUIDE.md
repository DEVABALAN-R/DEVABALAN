# Application behavior and architecture

This document describes the application as it is implemented in this repository. It covers the public portfolio, the private dashboard, finance and investment behavior, persistence, authentication, and the current architectural boundaries. It is intended as a map for future maintenance and the planned React growth of the app.

## 1. Product overview

The application has two surfaces:

1. A public professional portfolio at `/`.
2. A private, Supabase-authenticated personal dashboard for portfolio editing, finance tracking, and mutual-fund tracking.

Finance and fund values are denominated in INR. The dashboard's Home page is an **Insights** screen, not a blank landing page. Transactions, accounts, and fund purchases start empty for a newly created cloud workspace. A first-run workspace is seeded with editable default expense and income categories; it is not seeded with sample transactions, accounts, or mutual funds. If there is no published portfolio row, the public portfolio falls back to the built-in portfolio profile in `src/features/portfolio/model/portfolio.ts`.

## 2. Route and navigation behavior

| URL | Access | Screen / behavior |
| --- | --- | --- |
| `/` | Public | Published portfolio page. Its Dashboard action opens sign-in. |
| `/login` | Public | Supabase email/password sign-in; there is no public sign-up flow. |
| `/dashboard` | Private | Home Insights with monthly Finance / Stocks sections. |
| `/dashboard/finance/expense` | Private | Expense tracker with Calendar, Transactions, and Insights views. |
| `/dashboard/finance/accounts` | Private | Bank and credit-card account setup. |
| `/dashboard/finance/categories` | Private | Expense/income category and subcategory setup. |
| `/dashboard/stock` | Private | Stock overview placeholder, with a link into Mutual Funds. |
| `/dashboard/stock/mutual-funds` | Private | Mutual-fund overview, funds, current NAVs, and purchase ledger. |
| `/dashboard/portfolio` | Private | Portfolio editor; changes publish to the public portfolio after save. |

`src/features/auth/components/ProtectedRoute.tsx` gates the `/dashboard/*` route until Supabase confirms the current user. A signed-out user is sent to `/login` with the requested dashboard path in route state; after sign-in the app returns to that path when it is recognized. Unknown dashboard child paths fall back to `/dashboard`. `src/app/dashboardRouting.ts` maps the supported paths to views. Browser history, direct links, and refresh are therefore intended to preserve the selected page; the static host must serve the app entry point for these paths.

Desktop navigation uses a collapsible left rail and Finance / Stock groups. Mobile uses a bottom navigation bar and expandable Finance / Stock menus. The profile menu contains the theme toggle and logout action. Theme preference and recent transaction searches are saved in local storage. If no stored theme exists, the system color preference provides the initial theme.

## 3. Authentication and session lifecycle

1. App startup asks Supabase Auth for the current user and subscribes to later auth changes.
2. Each observed signed-in identity is checked with `supabase.auth.getUser()` before private workspace routes render.
3. Sign-in calls Supabase email/password Auth. Sign-out clears the current tab's local session.
4. The session is held in `sessionStorage`, with refresh-token handling enabled. This scopes the session to the tab; it does not replace database authorization.
5. After 28 minutes idle, a 2-minute countdown is shown. Activity resets the 30-minute idle timer. Expiry signs out and routes to `/login`; the profile menu can also log out immediately.

RLS and owner-checked Supabase RPCs are the security boundary. Client route guards are a UX/access gate only. Public portfolio rows marked published can be read without signing in; portfolio writes require the owner session.

## 4. Startup and data synchronization

### Private workspace

`src/app/DashboardShell.tsx` loads one `public.user_workspaces` row for the authenticated user. The row contains JSON arrays for transactions, accounts, categories, mutual funds, and fund purchases. It is keyed by `auth.users.id` and protected by row-level security.

- If the cloud row exists, normalized cloud data becomes the workspace state.
- If it does not exist and this browser has old local finance records, the user must choose to import them or start empty. Local data is cleared only after the chosen cloud write succeeds.
- If there is no prior local data, the app creates an empty finance/fund workspace with the default categories.
- Changes are saved after a short debounce through the revision-checked `save_user_workspace` RPC.
- A revision conflict merges independent record changes. If two sessions changed the same record, the app displays a conflict banner and offers a JSON download of the current local snapshot or reloading the latest cloud data.
- Failed cloud writes remain visible as a sync warning with a retry action. The in-memory screen may contain unsynced edits until reload; the UI warns that they may not be synced.

The workspace JSONB design keeps the current interface compatible and supports snapshot-level optimistic concurrency. It is not a normalized relational ledger; SQL reporting, row-level record queries, and very large histories will require a later data migration.

### Portfolio data

The app loads the published portfolio profile from `public.public_portfolios`. It also caches portfolio data locally for display/fallback. If the remote profile cannot be loaded, the local cached or built-in profile is shown. The private editor keeps a draft in component state and sends it to the owner-checked `save_public_portfolio` RPC only when the user chooses Save. A revision mismatch is surfaced instead of silently overwriting a concurrent portfolio edit.

### Validation and defaults

Finance and investment data is normalized at the persistence boundary. Invalid records can be discarded while reading. Default finance categories are defined in `src/features/finance/model/defaultCategories.ts`; the one-time default is guarded by the category setup marker so intentionally deleting all categories does not recreate them on the next render.

## 5. Home: Insights

`src/features/dashboard/pages/DashboardHome.tsx` provides a month switcher and Finance / Stocks tabs.

### Finance insights

- Summary values include current-month income, expenses, net, bank closing balance, and a savings rate.
- The twelve-month line graph follows the selected month and can show the income/expense series or a selected category/subcategory series.
- Expense/income type, category, and subcategory selectors narrow the selected total and chart.
- A pie chart and breakdown list show the selected month's distribution by category, or by subcategory when a category is selected.
- A link opens the Expense tracker.

### Stock insights

The Home Stocks tab is a placeholder for future stock-wide insights and links to Mutual Funds. It does not currently chart fund returns in Home; fund-level valuation and purchase-NAV charts are in the Mutual Funds page.

## 6. Finance behavior

### 6.1 Expense tracker

The tracker keeps a selected calendar month and a selected date. Its three mutually exclusive views are Calendar, Transactions, and Insights. Account filters apply to the calendar and transaction lists; type filters and text search apply to transaction results. Search is debounced and recent submitted searches are stored locally. Keyboard shortcuts while on this page: `/` opens/focuses transaction search, and `N` opens a new transaction unless focus is inside an input or editor.

**Summary math**

- Income and expenses include only `income` and `expense` transactions for the selected month.
- Net is income minus expenses.
- Closing balance is the opening bank balance carried into the month plus that month's bank-account income less bank-account expenses.
- Closing balance excludes credit-card balances and card-payment transactions. The month-over-month badge compares the current value with the prior calendar month.

**Calendar**

The calendar displays daily income and expense totals, heat intensity by spending, and a split income/expense bar. Neighbouring-month days are dimmed and not selectable. Selecting an in-month date opens a day drawer listing that date's records; Add transaction in the drawer pre-fills its date. A selected day is used by the external Add transaction and mobile quick-add actions as well.

**Transactions**

The list can be filtered by account and transaction type and searched by description/category/subcategory/note. A row expands to expose edit/delete. Description or amount can be double-clicked for inline editing. Deletion uses a confirmation. The `+` action and keyboard shortcut open the transaction form.

**Transaction types and account effects**

- **Income:** bank account only; increases that bank account's calculated balance.
- **Expense:** bank or credit account; reduces bank balance or increases the credit-card liability, respectively. It requires a matching income/expense category; subcategory is optional.
- **Card payment:** bank source and credit-card destination; it reduces the calculated credit-card liability and is excluded from income, expense, and net totals.

Current implementation detail to verify before changing business logic: the bank-balance calculation ignores `payment` entries entirely, including the bank source of a card payment. This preserves the requested exclusion from closing balance, but means account-level bank balance does not show the outgoing payment either. Confirm the intended accounting rule before altering it.

**Monthly insights**

The Expense tracker's Insights view shows a category donut, top category bars, and recent transactions for the selected month. Calendar view shows the same monthly spending panel beside the calendar on wide screens. These are month-based. Annual summaries are not currently a separate Expense tracker mode.

### 6.2 Accounts

Accounts are either bank accounts or credit cards, with a name and opening balance. The list displays current computed balance and linked transaction context. A linked account cannot be removed; the current UI asks the user to rename it instead. Account type is locked while linked transactions exist. Bank totals exclude card accounts.

### 6.3 Categories and subcategories

Categories are divided by Expense or Income tabs. Each category has a name, type, subcategories, optional icon/color presentation, and optional monthly budget. The initial personal workspace receives a small set of default categories/subcategories, but no sample spending or income records.

Users can add/edit/delete categories, search/filter them, inline-rename categories and subcategories, create subcategories inline, move a subcategory to another category, and reorder category tiles with drag interactions. Deleting a category warns about linked transactions and allows reassigning them or clearing their category. Deleting a subcategory leaves its transactions under the parent category without a subcategory and offers an Undo action for five seconds.

## 7. Stocks and Mutual Funds

The Stock overview is reserved for future instruments; the implemented investment product is Mutual Funds.

### Tabs

- **Overview:** total investment/current value/profit-loss summary, an individual fund's purchase-NAV graph, and a per-fund performance list.
- **Funds:** holding metadata, units, net invested, editable current NAV, calculated market value/return, and fund edit/add/delete actions. Saving a changed NAV stores a NAV checkpoint using today's date.
- **Purchases:** searchable, fund-filterable, sortable ledger with fund, order and execution dates, invested amount, net amount, stamp duty, purchase NAV, and units.

### Investment calculations

- Net amount spent = invested amount − stamp duty.
- Units allotted = net amount spent ÷ purchase NAV, rounded to 3 decimals per purchase record.
- Current fund value = total units × manually entered current NAV.
- Profit/loss = current value − net amount spent; return percentage = profit/loss ÷ net amount spent.
- Portfolio totals sum the individual funds. NAVs are user-maintained; no live market-data feed is connected.

The Overview chart plots each recorded purchase NAV as a point for the selected fund. Multiple purchases within a month receive small horizontal offsets to keep their dots visible. The 6M / 1Y / ALL controls filter by purchase month. Hovering/focusing a point updates the readout with date, purchase NAV, invested amount, and units.

### Purchase date rule

The current form treats a record with different purchase and execution dates as an inconsistent monthly SIP: it saves both dates as the first day of the purchase-date month. On authenticated workspace load, legacy records with differing dates are canonicalized the same way through the revision-checked save RPC. The purchase NAV, units, investment amount, and stamp duty are preserved. This is a business rule chosen for this imported history; review it before changing date-entry semantics.

Deleting a fund also removes its purchases after confirmation. Deleting an individual purchase is confirmed separately. Updating current NAV changes valuation and return totals; it does not alter past purchase NAV records.

## 8. Public Portfolio and Editor

The public page is assembled from the profile, hero, work/projects, experience, about/skills/education, and contact components. Sections are omitted when their content is empty. The public page has responsive navigation and a Dashboard action that leads to sign-in.

The private Portfolio editor manages profile/hero fields, profile image URL/path, organization and role details (including project/client, impact, technologies, and recognition per role), projects, skill groups, certifications, education, contact links, resume path, and custom fields. Draft edits are local to the editor until Save. Successful save updates the public profile; a conflict/error is shown without pretending the save succeeded. The current editor does not expose an image crop-position control. Built-in default content comes from the portfolio model when no remote/cached profile exists, so inspect it before publishing a fresh Supabase project.

## 9. Component and folder boundaries

```text
src/
  App.tsx                         Compatibility re-export to app/App.tsx
  main.tsx                        React mount, BrowserRouter, global tokens
  app/
    App.tsx                       Route table, auth startup, portfolio data flow
    DashboardShell.tsx            Private app shell, route view, workspace state and modals
    dashboardRouting.ts            Stable path ↔ dashboard view mapping
  features/
    auth/                          Sign-in, protected route, auth service, timeout
    dashboard/pages/               Home monthly insights
    finance/
      components/                  Calendar and legacy analytics component
      data/                        One-time legacy localStorage reader/import support
      hooks/                       Finance transaction/account/category mutations
      model/                       Domain types, calculations, and default categories
      pages/                       Expense tracker, accounts, category manager
    portfolio/
      components/                  Public sections and experience editor
      data/                        Portfolio normalization/cache and Supabase adapter
      model/                       Portfolio schema and built-in profile
      pages/                       Public portfolio and private editor
    stocks/
      model/                       Mutual fund/purchase types and calculations
      pages/                       Mutual funds dashboard and entry forms
    workspace/data/                Per-user workspace load/save/merge logic
  shared/
    components/                    Transaction day context shared across screens
    lib/                            Supabase client and browser-only preferences
    styles/                        Tokens and page/feature styling
supabase/migrations/                Workspace tables, RLS and save RPCs
public/                             Public portfolio assets
```

Pages mostly receive data and callbacks from the central `DashboardShell`; domain calculations live in models, finance edit operations in `useFinanceMutations`, and cloud writes in repositories. This is a workable feature-first starting point for a future React/TypeScript application split.

## 10. Architecture and behavior review notes

This review found a few places to keep in mind for future maintenance; they are documented here rather than silently changed as part of a behavior guide:

1. `DashboardShell.tsx` is the largest coordination point: route-level selection, workspace state/sync, responsive navigation, transaction dialog state, profile interactions, and feature callbacks all live there. As the app grows, split it into a route shell, a workspace provider/hook, and feature-specific dialogs/actions while keeping repository ownership centralized.
2. `ExpenseLedger.tsx` and `MutualFundsPage.tsx` contain dense, long JSX lines and local form logic. Extract named components for transaction rows, KPI strip, chart, and entry forms to improve reviewability and unit-level testing.
3. `src/features/finance/components/Insights.tsx` appears not to be imported anywhere. The active Home and Expense Insights are implemented separately. Confirm whether the older monthly/yearly analytics component is intentionally retired; then either remove it or wire/reuse it so there is one source of insight behavior.
4. The dashboard stylesheet is an ordered import stack of older and newer overrides. Consolidate by feature and remove superseded rules gradually, verifying the theme and responsive layouts at each step.
5. `user_workspaces` stores all private domain collections in JSONB. This suits a single-user product at current scale, but normalized tables and database-side financial queries would be easier to audit and report on as history grows.
6. `package.json` currently defines typecheck/build scripts but no automated unit, integration, or browser-test script. Add focused tests around balance calculations, transaction editing, purchase-date normalization, workspace conflict handling, and authentication redirects before larger business-logic changes.
7. `portfolioStorage.ts` contains the built-in portfolio fallback and browser cache; keep public portfolio content free of private data. Finance secrets and service credentials must never enter browser storage or `VITE_` variables.

## 11. Runtime and release commands

The project is a Vite SPA. Node.js 22.19.0 is pinned in `.nvmrc`.

```cmd
npm ci
npm run dev
npm run typecheck
npm run build
npm run preview
```

`dist/` is the static production bundle. Configure a host SPA rewrite to `index.html`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the hosting build environment, and set the exact HTTPS origin/redirects in Supabase Auth. Apply SQL migrations `202610040001_private_workspace.sql`, `202610040002_conflict_safe_workspace.sql`, and `202610040003_mutual_funds_workspace.sql` in order. See [RUN_ON_ANOTHER_LAPTOP.md](RUN_ON_ANOTHER_LAPTOP.md) for laptop setup and [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for backend security configuration.
