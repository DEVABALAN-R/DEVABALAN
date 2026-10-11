# What this is (product definition)

Written from the code as it is in October 2026, not from plans. Where the code and an intention
differ, the code wins here, and the difference is listed under [Open questions](#open-questions).

## In one sentence

**Devabalan Command Center is a private money-and-notes workspace for its one owner that helps
them see and manage everyday spending, mutual funds and shares, and a public developer portfolio
in one place, by keeping everything in the owner's own secured Supabase database and showing it
on web and phone from a single app.**

## In plain words

- **What you are building:** your own personal finance app, the kind you would otherwise piece
  together from an expense tracker, a broker's app, a notes app and a website builder. One
  sign-in, one place, your data in your own database.
- **Why:** your money is spread across cash, bank accounts, cards, mutual funds and shares;
  spending is shared with friends; and you keep notes and a public profile. Separate apps each
  see one slice. This one shows the whole picture (net worth, where money goes, how investments
  are doing) and stays private.
- **Who it is for:** you. Sign-up is closed to everyone except allowlisted emails, there is one
  owner per account, and features are shaped around Indian money (rupees, AMFI mutual funds,
  NSE/BSE shares, Zerodha tradebooks).
- **What it is not:** not a multi-user product, not a bank connection (nothing is pulled from your
  bank automatically), not a trading app (it records trades, it does not place them), and not tax
  software.
- **Why the parts belong together:** expenses and investments both feed **net worth** on the
  Overview; notes sit next to them because day-to-day money decisions need them; the portfolio is
  the public face of the same person, edited from the same private dashboard.
- **How to use it day to day:** add each expense as it happens (a few taps); record fund
  purchases and SIPs, or import a Zerodha tradebook now and then; press **Update prices**; look
  at the Overview, Stats and Budget to see where you stand. Keep notes as you go. Update the
  portfolio when your work changes, preview, publish.

## The main user journeys

1. **Record an expense:** Expenses → **+** → amount → category → account → Save. Saved to the
   database within a second (the badge says Saved).
2. **See where money went:** Expenses → Stats (by category, drill into subcategories) and Budget
   (monthly limits per category).
3. **Split with friends:** add people, split an expense, record repayments; Expenses → People
   shows who owes what.
4. **Track investments:** Mutual funds / Stocks → add holdings and transactions (or Import a
   Zerodha tradebook, reviewed before saving) → Update prices → holdings, gains (first in, first
   out), XIRR, allocation and growth.
5. **Know net worth:** Overview adds accounts, funds and shares.
6. **Publish a portfolio:** Dashboard → Portfolio → edit → Preview → Publish; it is the home page
   of the site, with a Dashboard button to sign in.

## Feature map

Status: **Working** (built, saved to the database, tested), **Partial**, **Placeholder** (a
labelled "Planned" screen, no function), **Planned** (not in the code).

| Feature                               | What it does                                                         | Why it exists                             | User benefit                           | Status                                | Recommendation                                                     |
| ------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Sign-in, two-step code, idle sign-out | Allowlisted sign-in, TOTP, device trust, automatic sign-out          | Financial data must stay private          | Safe to use on any device              | Working                               | Keep                                                               |
| Expenses: transactions                | Expense, income and transfer entries with categories and accounts    | Core of the product                       | Know every rupee in and out            | Working                               | Keep (core)                                                        |
| Expenses: Stats and Budget            | Spending by category and month; monthly limits                       | Turns entries into understanding          | Spot overspending early                | Working                               | Keep (core)                                                        |
| Accounts                              | Cash, bank, card, wallet balances                                    | Balances and net worth need them          | One view of all balances               | Working                               | Keep (core)                                                        |
| People and splits                     | Shared expenses, who owes whom, repayments                           | Shared spending is common                 | No separate splitting app              | Working                               | Keep                                                               |
| Receipt photo                         | Attach a photo to an entry                                           | Proof of purchase                         | Find the bill later                    | Partial (kept on the device only)     | Improve later (Storage), low priority                              |
| Notes                                 | Notes and checklists with labels, pins, archive                      | Money decisions need notes                | Notes next to the numbers              | Working                               | Keep; it is the least connected module (a candidate to stay small) |
| Mutual funds                          | Holdings, SIPs, purchases/redemptions, FIFO gains, XIRR, AMFI NAVs   | Investments are a large part of net worth | Real returns, not just invested amount | Working                               | Keep (core)                                                        |
| Stocks                                | Trades, dividends, bonus/splits, FIFO P&L, XIRR, end-of-day prices   | Same as funds                             | Same                                   | Working                               | Keep (core)                                                        |
| Tradebook import                      | Read Zerodha files, review, approve                                  | Typing every trade is error-prone         | Fast, checked catch-up                 | Working (Zerodha only)                | Keep                                                               |
| Price updates                         | Server fetches AMFI and exchange closing prices                      | Valuations need prices                    | Up-to-date values                      | Working (needs the function deployed) | Keep; schedule it daily                                            |
| Overview                              | Net worth, cash flow, budget, recent activity, investments           | The "one place" promise                   | The whole picture at a glance          | Working                               | Keep (core)                                                        |
| Portfolio (public site + editor)      | Developer portfolio at the site's home page, edited in the dashboard | Owner's public professional profile       | Always current CV site, no redeploys   | Working                               | Keep, but it is a separate product sharing the app (see below)     |
| Reports, Goals, Insights              | Labelled "Planned" screens                                           | Future analysis features                  | None yet                               | Placeholder                           | Defer; consider hiding until built                                 |
| Search (header)                       | Labelled "Planned" sheet                                             | Find any entry                            | None yet                               | Placeholder                           | Build next among placeholders (high daily value)                   |
| Settings → Data & privacy             | Labelled "Planned": export, import, account deletion                 | Data ownership                            | None yet                               | Placeholder                           | Build export first (backup)                                        |
| Import from your other app            | Planned (waiting for its export file)                                | Bring old history in                      | Continuity                             | Planned                               | Next on the roadmap                                                |
| PF/EPF tracker, salary payslips       | Planned                                                              | Complete the net-worth picture            | Retirement savings visible             | Planned                               | After import                                                       |

## Recommended direction

- **Core experience:** recording money in seconds and seeing where you stand (Overview, Stats,
  Budget, net worth with investments). Everything else should support this.
- **Most important journey:** add an expense → it is saved → Overview and Budget reflect it.
  Keep it fast and never lose an entry (the October 2026 audit fixed two ways entries could be
  lost or doubled).
- **Minimum essential set:** sign-in and security, expenses (entries, accounts, categories,
  stats, budget), funds and stocks with prices, Overview.
- **Postpone:** Reports, Goals and Insights (placeholders today); consider hiding them from the
  navigation until they do something, so the app does not promise what it cannot do.
- **Clear next value:** global search, data export (your own backup), the import from your
  current app, then PF/EPF.
- **Avoid:** more modules before the core is complete (habit trackers, journals, AI assistants);
  real-time multi-device sync machinery (one person rarely edits on two devices at once; a reload
  on return is enough); paid market-data feeds before end-of-day prices prove insufficient.

## Open questions

Decisions only you can make; the code does not settle them.

1. **Is the portfolio part of this product or a neighbour?** It shares the sign-in and the
   address, but nothing in it touches money. Keeping it here is simple; if the dashboard ever
   grows other users, it should move to its own address again (ADR 0010 explains how).
2. **Hide placeholders?** Reports, Goals, Insights and Search are visible but do nothing.
3. **Receipts:** should photos be stored in Supabase Storage (so they survive a phone change), or
   stay on the device?
4. **Two devices:** is it acceptable that edits made on two devices at the same moment end with
   the last save winning? (Today it is; see `docs/architecture/EDGE_CASES.md`.)
