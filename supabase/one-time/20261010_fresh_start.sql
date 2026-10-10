-- Command Center: one-time fresh start (generated 2026-10-10).
-- Holds the owner's fund and share history; committed at the owner's request (public repository).
-- Run once. Running it again clears everything you saved since and reloads the same history.
--
-- What it does, as YOU (same Row Level Security and checks as the app):
--   1. Deletes everything you saved in the app: entries, accounts, categories, people,
--      notes, funds, SIPs, stocks and trades. Your sign-in, two-step code and settings stay.
--   2. Loads your mutual funds and stocks from the Excel tracker (MUTUAL FUNDS and EQUITY sheets).
--   3. Checks the loaded totals against the sheet; if anything differs, nothing is kept.
--
-- Read from the sheet, please confirm:
--   * Mutual funds: the first purchase date as shown in the sheet (1 Mar 2025; 22 Feb 2025 for
--     Parag Parikh), then the 1st of each following month, as you asked.
--   * Shares: no date is after the sheet was last saved (2026-10-04).
--   * GOLDBEES: the 40 units at 124.76 (dated 10 Aug 2026) are a SALE; SILVERBEES: the 10 units
--     at 207.13 on 2 Feb 2026 are a SALE. Only then do the sheet's own "invested" figures match.
--   * SUZLON bought on 12 Mar 2026 (the sheet said 3 Dec 2026, a future date).
--   * Brokerage and charges are not in the sheet, so they are zero.
--   * NAVs and prices in the sheet's header are used as prices entered by hand, dated 2026-10-04;
--     automatic NAVs and prices replace them once the price function is running.
--   * Not loaded: digital gold (GOLD sheet) waits for the "other assets" module; PF, salary and
--     everything else stay out.
--
-- Before running: sign out of the app on every device (or close it). Then run this whole file
-- in Supabase → SQL Editor, and sign in again. Run migration 0008 (retire old app) first.

begin;

select set_config('request.jwt.claims', pg_catalog.json_build_object(
  'sub', (select u.id from auth.users u where pg_catalog.lower(u.email) = pg_catalog.lower('devabalan1983@gmail.com')),
  'role', 'authenticated', 'aal', 'aal2')::text, true);
do $$ begin
  if auth.uid() is null then raise exception 'No account with that email: edit the email above'; end if;
end $$;
set local role authenticated;

-- 1. Start from scratch -------------------------------------------------------------------
delete from public.transactions;      -- splits and settle-ups go with them
delete from public.people;
delete from public.categories;        -- subcategories go with them
delete from public.accounts;
delete from public.notes;             -- remove this line to keep your notes
delete from public.mf_funds;          -- SIPs and fund transactions go with them
delete from public.stocks;            -- trades go with them

-- 2a. Mutual funds -------------------------------------------------------------------------
with s as (
  select case when count(*) = 1 then min(m.scheme_code) end as code
  from public.mf_schemes m
  where m.name ilike '%motilal oswal midcap fund%' and m.name ilike '%direct%' and m.name ilike '%growth%'
    and m.name not ilike '%idcw%' and m.name not ilike '%bonus%'
), f as (
  insert into public.mf_funds (scheme_code, name, category, fund_house, folio, manual_nav, manual_nav_date, note, sort_order)
  select s.code, 'MOTILAL OSWAL MIDCAP FUND - DIRECT GROWTH', 'Equity Scheme - Mid Cap Fund', 'Motilal Oswal Mutual Fund', '910109043375', 120.0335, '2026-10-04', 'Expense ratio 0.64% · Exit load 1%', 0
  from s
  returning id
)
insert into public.mf_transactions (fund_id, kind, trade_date, amount, stamp_duty, units, nav)
select f.id, 'buy', v.d::date, v.amount, v.duty, v.units, v.nav
from f, (values
  ('2025-03-01', 50000, 2, 4.9260, 101.5000),
  ('2025-04-01', 50000, 2, 4.7920, 104.3400),
  ('2025-05-01', 50000, 2, 4.6320, 107.9500),
  ('2025-06-01', 50000, 2, 4.3860, 114.0000),
  ('2025-07-01', 50000, 2, 4.1730, 119.8100),
  ('2025-08-01', 50000, 2, 4.3030, 116.2000),
  ('2025-09-01', 50000, 2, 4.1700, 119.9100),
  ('2025-10-01', 50000, 2, 4.3590, 114.7000),
  ('2025-11-01', 50000, 2, 4.1770, 119.7100),
  ('2025-12-01', 50000, 2, 4.2050, 118.9100),
  ('2026-01-01', 50000, 2, 4.3890, 113.9100),
  ('2026-02-01', 50000, 2, 4.7370, 105.5400),
  ('2026-03-01', 50000, 2, 4.9320, 101.3700),
  ('2026-04-01', 50000, 2, 5.2290, 95.6100),
  ('2026-05-01', 50000, 2, 4.7440, 105.3900),
  ('2026-06-01', 55000, 3, 5.2410, 104.9300),
  ('2026-07-01', 55000, 3, 5.0330, 109.2700),
  ('2026-08-01', 55000, 3, 4.6770, 117.6000),
  ('2026-09-01', 55000, 3, 4.5660, 120.4500)
) as v(d, amount, duty, units, nav);

with s as (
  select case when count(*) = 1 then min(m.scheme_code) end as code
  from public.mf_schemes m
  where m.name ilike '%parag parikh flexi cap fund%' and m.name ilike '%direct%' and m.name ilike '%growth%'
    and m.name not ilike '%idcw%' and m.name not ilike '%bonus%'
), f as (
  insert into public.mf_funds (scheme_code, name, category, fund_house, folio, manual_nav, manual_nav_date, note, sort_order)
  select s.code, 'PARAG PARIKH FLEXI CAP FUND - DIRECT PLAN GROWTH', 'Equity Scheme - Flexi Cap Fund', 'PPFAS Mutual Fund', '16558251', 89.8569, '2026-10-04', 'Expense ratio 0.63% · Exit load 2%', 1
  from s
  returning id
)
insert into public.mf_transactions (fund_id, kind, trade_date, amount, stamp_duty, units, nav)
select f.id, 'buy', v.d::date, v.amount, v.duty, v.units, v.nav
from f, (values
  ('2025-02-22', 100000, 5, 11.8250, 84.5600),
  ('2025-03-01', 100000, 5, 12.0630, 82.8900),
  ('2025-04-01', 100000, 5, 11.7690, 84.9600),
  ('2025-05-01', 100000, 5, 11.3650, 87.9800),
  ('2025-06-01', 100000, 5, 11.1130, 89.9800),
  ('2025-07-01', 100000, 5, 10.7890, 92.6800),
  ('2025-08-01', 100000, 5, 10.9490, 91.3300),
  ('2025-09-01', 100000, 5, 10.9260, 91.5200),
  ('2025-10-01', 100000, 5, 10.8130, 92.4700),
  ('2025-11-01', 100000, 5, 10.5860, 94.4600),
  ('2025-12-01', 100000, 5, 10.5320, 94.9400),
  ('2026-01-01', 100000, 5, 10.5330, 94.9300),
  ('2026-02-01', 100000, 5, 10.7360, 93.1400),
  ('2026-03-01', 100000, 5, 10.9380, 91.4200),
  ('2026-04-01', 100000, 5, 11.5810, 86.3400),
  ('2026-05-01', 100000, 5, 10.9580, 91.2600),
  ('2026-06-01', 110000, 5, 12.2660, 89.6800),
  ('2026-07-01', 110000, 5, 12.1810, 90.3000),
  ('2026-08-01', 110000, 5, 11.7510, 93.6100),
  ('2026-09-01', 110000, 5, 12.1150, 90.7900)
) as v(d, amount, duty, units, nav);

with s as (
  select case when count(*) = 1 then min(m.scheme_code) end as code
  from public.mf_schemes m
  where m.name ilike '%navi nifty 50 index fund%' and m.name ilike '%direct%' and m.name ilike '%growth%'
    and m.name not ilike '%idcw%' and m.name not ilike '%bonus%'
), f as (
  insert into public.mf_funds (scheme_code, name, category, fund_house, folio, manual_nav, manual_nav_date, note, sort_order)
  select s.code, 'NAVI NIFTY 50 INDEX FUND DIRECT PLAN GROWTH', 'Other Scheme - Index Funds', 'Navi Mutual Fund', '9778156387', 15.4254, '2026-10-04', 'Expense ratio 0.06% · Exit load 0%', 2
  from s
  returning id
)
insert into public.mf_transactions (fund_id, kind, trade_date, amount, stamp_duty, units, nav)
select f.id, 'buy', v.d::date, v.amount, v.duty, v.units, v.nav
from f, (values
  ('2025-03-01', 50000, 2, 34.8110, 14.3600),
  ('2025-04-01', 50000, 2, 33.2440, 15.0400),
  ('2025-05-01', 50000, 2, 31.6310, 15.8100),
  ('2025-06-01', 50000, 2, 31.0960, 16.0800),
  ('2025-07-01', 50000, 2, 30.0170, 16.6600),
  ('2025-08-01', 50000, 2, 31.1490, 16.0500),
  ('2025-09-01', 50000, 2, 31.0320, 16.1100),
  ('2025-10-01', 50000, 2, 30.7680, 16.2500),
  ('2025-11-01', 50000, 2, 29.6340, 16.8700),
  ('2025-12-01', 50000, 2, 29.1560, 17.1500),
  ('2026-01-01', 50000, 2, 29.1900, 17.1300),
  ('2026-02-01', 50000, 2, 30.4070, 16.4400),
  ('2026-03-01', 50000, 2, 30.6650, 16.3000),
  ('2026-04-01', 50000, 2, 33.6220, 14.8700),
  ('2026-05-01', 50000, 2, 31.6110, 15.8200),
  ('2026-06-01', 55000, 3, 35.8120, 15.3600),
  ('2026-07-01', 55000, 3, 34.7790, 15.8100),
  ('2026-08-01', 55000, 3, 33.6170, 16.3600),
  ('2026-09-01', 55000, 3, 34.6110, 15.8900)
) as v(d, amount, duty, units, nav);

-- 2b. Stocks and ETFs ----------------------------------------------------------------------
with st as (
  insert into public.stocks (isin, symbol, exchange, name, sector, manual_price, manual_price_date, sort_order)
  values ('INF204KB17I5', 'GOLDBEES', 'NSE', 'Nippon India ETF Gold BeES', 'Other', 12648, '2026-10-04', 0)
  returning id
)
insert into public.stock_trades (stock_id, kind, trade_date, quantity, price)
select st.id, v.kind, v.d::date, v.qty, v.price
from st, (values
  ('2025-08-01', 'buy', 2, 8173),
  ('2025-08-01', 'buy', 2, 8169),
  ('2025-08-05', 'buy', 1, 8365),
  ('2025-10-14', 'buy', 45, 10470),
  ('2025-10-20', 'buy', 20, 10475),
  ('2026-02-05', 'buy', 10, 12574),
  ('2026-03-04', 'buy', 5, 13317),
  ('2026-08-10', 'sell', 40, 12476)
) as v(d, kind, qty, price);

with st as (
  insert into public.stocks (isin, symbol, exchange, name, sector, manual_price, manual_price_date, sort_order)
  values ('INF204KC1402', 'SILVERBEES', 'NSE', 'Nippon India Silver ETF', 'Other', 22407, '2026-10-04', 1)
  returning id
)
insert into public.stock_trades (stock_id, kind, trade_date, quantity, price)
select st.id, v.kind, v.d::date, v.qty, v.price
from st, (values
  ('2025-10-14', 'buy', 20, 17214),
  ('2026-02-02', 'sell', 10, 20713)
) as v(d, kind, qty, price);

with st as (
  insert into public.stocks (isin, symbol, exchange, name, sector, manual_price, manual_price_date, sort_order)
  values ('INE040H01021', 'SUZLON', 'NSE', 'Suzlon Energy Ltd', 'Industrials', 4330, '2026-10-04', 2)
  returning id
)
insert into public.stock_trades (stock_id, kind, trade_date, quantity, price)
select st.id, v.kind, v.d::date, v.qty, v.price
from st, (values
  ('2026-03-12', 'buy', 5, 4151)
) as v(d, kind, qty, price);

-- 3. Checks: totals must match the sheet ----------------------------------------------------
set constraints all immediate;
do $$
begin
  if (select count(*) || '/' || sum(t.amount) || '/' || sum(t.units) from public.mf_transactions t
      join public.mf_funds f on f.id = t.fund_id where f.name = 'MOTILAL OSWAL MIDCAP FUND - DIRECT GROWTH') <> '19/970000/87.6710' then
    raise exception 'Check failed: %', 'MOTILAL OSWAL MIDCAP FUND - DIRECT GROWTH';
  end if;
  if (select count(*) || '/' || sum(t.amount) || '/' || sum(t.units) from public.mf_transactions t
      join public.mf_funds f on f.id = t.fund_id where f.name = 'PARAG PARIKH FLEXI CAP FUND - DIRECT PLAN GROWTH') <> '20/2040000/225.7890' then
    raise exception 'Check failed: %', 'PARAG PARIKH FLEXI CAP FUND - DIRECT PLAN GROWTH';
  end if;
  if (select count(*) || '/' || sum(t.amount) || '/' || sum(t.units) from public.mf_transactions t
      join public.mf_funds f on f.id = t.fund_id where f.name = 'NAVI NIFTY 50 INDEX FUND DIRECT PLAN GROWTH') <> '19/970000/606.8520' then
    raise exception 'Check failed: %', 'NAVI NIFTY 50 INDEX FUND DIRECT PLAN GROWTH';
  end if;
  if (select sum(case when t.kind = 'buy' then t.quantity else -t.quantity end) from public.stock_trades t
      join public.stocks s on s.id = t.stock_id where s.symbol = 'GOLDBEES') <> 45 then
    raise exception 'Check failed: %', 'GOLDBEES';
  end if;
  if (select sum(case when t.kind = 'buy' then t.quantity else -t.quantity end) from public.stock_trades t
      join public.stocks s on s.id = t.stock_id where s.symbol = 'SILVERBEES') <> 10 then
    raise exception 'Check failed: %', 'SILVERBEES';
  end if;
  if (select sum(case when t.kind = 'buy' then t.quantity else -t.quantity end) from public.stock_trades t
      join public.stocks s on s.id = t.stock_id where s.symbol = 'SUZLON') <> 5 then
    raise exception 'Check failed: %', 'SUZLON';
  end if;
  if (select count(*) from public.transactions) + (select count(*) from public.accounts) <> 0 then
    raise exception 'Check failed: the ledger is not empty';
  end if;
end $$;

commit;
