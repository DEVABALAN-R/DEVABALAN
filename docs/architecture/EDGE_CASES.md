# Edge cases and failure states

How the dashboard and the public portfolio behave when things go wrong, from the October 2026
audit ([report](AUDIT_2026-10.md)). **Status:** Handled (how), **Fixed** (changed in the audit),
**Risk** (known and accepted for now), N/A (does not apply to this app).

## Sign-in and access

| Scenario                                   | Current behaviour                                                                                      | Status                                                                                | Test coverage                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------- |
| Opening `/dashboard/...` signed out        | Redirect to sign-in, then back to the same page (only app paths are allowed as the return address)     | Handled                                                                               | `authScreens.test`, `redirects.test`         |
| Session expires or is revoked elsewhere    | Auth reports signed out → sync stops first, stores are cleared, sign-in shown                          | Handled                                                                               | `sessionProvider.test`                       |
| Password correct, two-step code still owed | Treated as not signed in until the code is entered; the database refuses data without it (aal2 policy) | Handled                                                                               | `verifyCode.test`, database tests (local)    |
| Refreshing the page                        | Session restored from browser storage (session-only unless "keep me signed in"); data reloaded         | Handled                                                                               | `authStorage.test`                           |
| Reading or changing another user's rows    | Impossible: Row Level Security, `user_id` fixed to the caller, composite foreign keys                  | Handled (database)                                                                    | Database tests (local, kept out of the repo) |
| A sign-up attempt by a stranger            | Refused by the allowlist hook                                                                          | Handled (database)                                                                    | Database tests (local)                       |
| Idle for the chosen time                   | Warning, then pending changes are sent and the user is signed out                                      | Handled; **Risk**: if offline at that moment, unsent changes are lost (no one to ask) | `idle.test`                                  |

## Saving and the network

| Scenario                                                                | Current behaviour                                                                                                                                                      | Status               | Test coverage                     |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------- |
| Supabase down when the dashboard opens                                  | "Your data could not be loaded" with **Try again**; nothing is shown as if it were yours                                                                               | Handled              | `cloudSync.test`                  |
| Offline while editing                                                   | Edits stay on screen; badge shows "Offline · will retry"; retried with back-off up to every 30 s until it works                                                        | Handled              | `cloudSync.test`                  |
| A request hangs                                                         | Abandoned after 30 s (price update: 150 s) and retried like an offline failure                                                                                         | **Fixed**            | `rpc.test`                        |
| The save reached the server but the reply was lost                      | The retry sends the same rows again; `sync_ledger` upserts by id, so nothing is duplicated                                                                             | Handled              | Database design                   |
| The database refuses a change (a rule is broken)                        | Data is reloaded from the database and a "change was refused" note is shown; **other unsaved edits made in the same moment are reloaded away too**                     | Handled; Risk (rare) | `cloudSync.test`                  |
| Closing or reloading the tab right after an edit                        | The change is sent as soon as the tab is hidden; leaving with something still unsent asks first                                                                        | **Fixed**            | `unsavedChanges.test`             |
| Signing out while offline with unsent changes                           | Asks: stay signed in (they are sent when back online) or sign out and lose them                                                                                        | **Fixed**            | `accountCard.test`                |
| Double tap on **Save** in the entry sheet                               | One entry (a second Save while the sheet closes is ignored)                                                                                                            | **Fixed**            | `transactionForm.test`            |
| Double tap on Save in other sheets (funds, trades, accounts, portfolio) | Those sheets are removed on the first save rather than animated away, so a second tap has nothing to press; the portfolio sheet disables Save while saving             | Handled              | Sheet tests                       |
| Adding a fund (AMFI) or share (ISIN), or importing a tradebook          | Prices for the new holding are loaded right after it is saved                                                                                                          | **Fixed**            | `cloudSync.test`                  |
| "Update prices" twice quickly                                           | The button is disabled while updating; the server skips a run within 30 minutes of the last one and the app says prices are up to date or an update is already running | Handled              | `store.test`, Deno function tests |
| Leaving a screen before a request finishes                              | Stores are app-wide, so the result still lands; results for a signed-out session are dropped (generation check)                                                        | Handled              | `cloudSync.test`                  |

## Two devices and stale data

| Scenario                                                                  | Current behaviour                                                      | Status                                                             |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Editing on phone and laptop at the same time                              | Each device sends its own changes; for the same row the last save wins | **Risk** (one owner; rare)                                         |
| A row deleted on one device, then edited on another that has not reloaded | The edit re-creates the row (upsert by id)                             | **Risk**                                                           |
| Changes made on another device                                            | Not shown until the next sign-in or page reload (no live updates)      | **Risk**; a reload on return to the tab is the suggested next step |
| New contact messages while Portfolio is open                              | Shown after the next reload of the dashboard                           | Risk (minor)                                                       |

## Forms, input and display

| Scenario                               | Current behaviour                                                                                             | Status             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------ |
| Invalid or missing fields              | Messages next to the field and focus on the first problem; the database checks again                          | Handled            |
| Very long text, huge numbers           | Most inputs have length limits; the database bounds amounts (up to ₹1,00,00,00,000 in paise) and text lengths | Handled            |
| Sale of more units or shares than held | Refused by the form and again by the database (`check_fund_units`, `check_stock_quantity`)                    | Handled            |
| Empty data (new account)               | Empty states with a next step (for example **Add starter categories**)                                        | Handled            |
| Dates and time zones                   | Dates are calendar dates (no time); "today" is the device's date                                              | Handled            |
| Rupee formatting                       | Indian grouping (lakhs, crores) everywhere amounts are shown                                                  | Handled            |
| Phones and small screens               | Layouts adapt; sheets become bottom sheets; checked at 390 px wide                                            | Handled            |
| Phone menu on the public site (Safari) | Covers the page (the header's blur moved to a background layer)                                               | **Fixed** (PR #21) |
| Keyboard use                           | Sheets are dialogs with focus kept inside and Escape to close                                                 | Handled            |

## Public portfolio

| Scenario                                | Current behaviour                                                                                    | Status                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Nothing published yet                   | "Nothing is published here yet" (404) with a Dashboard button                                        | Handled                                         |
| Database unreachable                    | 503 page; the browser retries                                                                        | Handled                                         |
| Unknown project address                 | 404 page                                                                                             | Handled                                         |
| Expired preview link                    | "This preview link has expired"                                                                      | Handled                                         |
| Contact form spam                       | Hidden field and minimum fill time (silently dropped), at most 3 links, per-network and daily limits | Handled; limits slow abuse, they cannot stop it |
| Contact form sent twice                 | The button is disabled while sending                                                                 | Handled                                         |
| A secret key put in the site's settings | The server refuses to use it and answers 500                                                         | Handled                                         |
