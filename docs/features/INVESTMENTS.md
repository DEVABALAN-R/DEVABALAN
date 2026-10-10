# Mutual funds and stocks

How the investment pages work: what you can record, where prices come from, and how every number
is calculated. Server setup (migration 0007, the price function and its schedule) is in
[`SUPABASE_SETUP.md`](../../SUPABASE_SETUP.md#mutual-funds-and-stocks-migration-0007).

## Mutual funds

**Add a fund**: Mutual funds → **Add fund**.

- **From the AMFI list** (signed in, once prices are set up): type three letters of the scheme
  name or its AMFI code and pick it. The fund is linked to its scheme: name, category and fund
  house come from AMFI, and its NAV is updated automatically.
- **By hand**: type the name, pick a type (Equity, Debt, Hybrid, Index & ETF, Gold & silver,
  Other) and, if you like, a NAV with its date. Use this for funds not in the list.
- Folio number and notes are optional. **Archive** hides a fund once it has no units left.

**Record transactions**: open a fund → **Add transaction**.

| Type       | What to enter                         | Notes                                                                                                                                                                                          |
| ---------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purchase   | NAV date, amount paid, NAV            | Lump sum, SIP instalment, switch in or reinvested dividend. Stamp duty (0.005 %) is filled in; units are worked out as (amount − stamp duty) ÷ NAV to 3 decimals, or typed from the statement. |
| Redemption | NAV date, amount received, NAV, units | Switch outs too. Refused if more units than were held on that date.                                                                                                                            |
| Dividend   | Date, amount paid out                 | Counted as a return; no units.                                                                                                                                                                 |

For a fund linked to AMFI, **Use AMFI NAV for this date** fills in the NAV published on that
date (or the last one before it on a holiday) from stored history.

**SIP plans**: in a fund, **Add SIP**: monthly amount, day (1–28), start and optional end date;
pause it with **Active**. The SIPs card lists instalments that are due but not recorded (with
**Record**, pre-filled) and the next month's instalments.

## Stocks

**Add a stock**: Stocks → **Add stock**. Search the listed shares (signed in, once prices are set
up) or enter the symbol, exchange (NSE/BSE) and company name by hand. Pick a sector for the sector
chart. A price entered by hand (with its date) is used when there is no newer closing price.

**Trades**: open a stock (press its row twice, or **Details**) → **Add trade**.

| Type     | What to enter                       | How it counts                                                               |
| -------- | ----------------------------------- | --------------------------------------------------------------------------- |
| Buy      | Shares, price, charges              | Cost = shares × price + charges                                             |
| Sell     | Shares, price, charges              | Refused if more than held on that date. Proceeds = shares × price − charges |
| Dividend | Amount received                     | A return; shares unchanged                                                  |
| Bonus    | New : held (e.g. 1 : 1)             | New shares at zero cost, dated on the ex-date                               |
| Split    | From → to (e.g. 1 → 5 for ₹10 → ₹2) | Shares multiplied; cost and purchase dates unchanged                        |

Bonus issues and splits apply to the shares held before that day; whole shares only (fractions
are paid in cash and rounded down). ETFs and listed bonds can be tracked as stocks.

## Funds from the old app

Settings → **Old app's data** brings over each fund (name, folio, the last NAV you saved with its
date; expense ratio and exit load go into the note) and every purchase on its execution date,
with the amount paid, stamp duty, units and NAV exactly as recorded. The free-text category
("Large Cap") is filed under its asset class (Equity, Debt, Hybrid, Index & ETF, Gold & silver)
so the allocation chart can group it. Afterwards, open each fund → **Edit fund** and pick its AMFI
scheme: the NAV then updates every day and AMFI's category replaces the old one.

## Prices

| What                  | Source                                                                      | When                                                       |
| --------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Fund NAVs             | AMFI daily NAV file (official)                                              | Daily schedule; **Update prices** at most every 30 minutes |
| Share prices          | NSE end-of-day file (BSE if NSE is unavailable): closing and previous close | Same                                                       |
| Older NAVs for charts | mfapi.in, only for schemes you hold                                         | After you add a fund with older purchases                  |

- Prices are **end of day**. Under each page title: "NAVs as of Tue, 7 Oct (AMFI)".
- A holding's price is the newest of: the market price, a price you entered by hand, and
  otherwise the price of your latest transaction (each labelled in the details).
- Prices are fetched on the server; the app never contacts AMFI or the exchanges. Until the price
  function is deployed, **Update prices** says so and manual prices work as usual.

## How the numbers are worked out

- **Units and shares held** replay every transaction in date order (purchases before redemptions
  on the same day; bonus and splits before trades). The database checks the same order and refuses
  a sale of units or shares not held.
- **Invested** is the cost of what you still hold, first in first out: a redemption uses the
  oldest units first, and their cost leaves "invested". Stamp duty and charges are part of cost.
- **Average cost** = invested ÷ units (or shares) held.
- **Value** = units × NAV (shares × price), rounded to paise once.
- **Unrealised gain** = value − invested. **Realised gain** = proceeds − FIFO cost of what was
  sold. Dividends are shown with realised gains.
- **XIRR** is the annual rate that makes every purchase (money in), sale and dividend (money out)
  and today's value add up to zero, taking each date into account. It suits SIPs, where money goes
  in at different times. A holding of a few weeks can show a large XIRR; read it with the gain.
- **Day change** = holdings × (latest price − previous price), from AMFI history or the exchange's
  previous close.
- **Allocation** groups funds by AMFI category (Equity, Debt, Hybrid, Index & ETF, Gold & silver,
  Other) and stocks by the sector you chose.
- **Growth** shows month-end value against the cost of what you held then, using stored NAV and
  price history (or your own transaction prices before that).

## Not yet

- Capital-gains report by financial year (realised lots already carry buy and sell dates and
  holding periods) and tax estimates (rates change by budget; they will come with a source and a
  date, never hard-coded silently).
- Importing a CAMS/KFintech consolidated account statement and broker tradebooks. (The older
  app's funds and purchases come in from Settings → Old app's data; see above.)
- Live share prices (needs a paid or broker data provider), price alerts, benchmark comparison.

See [`ROADMAP.md`](../architecture/ROADMAP.md) for when these arrive.
