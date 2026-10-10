-- Command Center: your mutual funds and stocks from Zerodha (generated 2026-10-10).
-- Holds the owner's fund and share history; committed at the owner's request (public repository).
--
-- Replaces ONLY your funds and stocks (with their SIP plans and trades). Entries, accounts,
-- categories, people and notes are not touched. Runs as YOU, with the same Row Level Security
-- and checks as the app, and keeps nothing if the totals differ from your Kite holdings.
--
-- Source: your Zerodha Console tradebooks (2025-02-10 to 2026-10-01); the same trade in two files is
-- counted once. Dates, units, NAVs, quantities and prices are exactly as Zerodha recorded them.
--   * Invested = units x NAV (shares x price), as Kite shows it: stamp duty and charges are not
--     in the tradebooks. Kite's totals: funds 41,998.19, stocks 6,994.20.
--   * Today's value uses the NAVs and prices on your Kite screen (2026-10-09) as prices entered
--     by hand; automatic prices replace them once the price function runs. Funds link to their
--     AMFI scheme by ISIN when the AMFI list is loaded: run this file again after the first
--     price update (before adding SIP plans; running it again replaces funds and stocks).
--   * Left out: funds sold in Feb 2025 whose purchases were before 2025 (not in these
--     tradebooks). Send the 2024 tradebook to add them with their realised gains.
--
-- Before running: close the app (or sign out). Then run this whole file in Supabase -> SQL Editor
-- and open the app again. Needs migrations 0005-0007 (after 0009, each fund also gets its ISIN).

begin;

select set_config('request.jwt.claims', pg_catalog.json_build_object(
  'sub', (select u.id from auth.users u where pg_catalog.lower(u.email) = pg_catalog.lower('devabalan1983@gmail.com')),
  'role', 'authenticated', 'aal', 'aal2')::text, true);
do $$ begin
  if auth.uid() is null then raise exception 'No account with that email: edit the email above'; end if;
end $$;
set local role authenticated;

delete from public.mf_funds;   -- SIP plans and fund transactions go with them
delete from public.stocks;     -- trades go with them

-- Mutual funds -------------------------------------------------------------------------------

with f as (
  insert into public.mf_funds (scheme_code, name, category, fund_house, manual_nav, manual_nav_date, note, sort_order)
  values ((select m.scheme_code from public.mf_schemes m where m.isin_growth = 'INF879O01027' limit 1),
    'Parag Parikh Flexi Cap Fund - Direct Growth', 'Equity Scheme - Flexi Cap Fund', 'PPFAS Mutual Fund', 88.9258, '2026-10-09', 'ISIN INF879O01027', 0)
  returning id
)
insert into public.mf_transactions (fund_id, kind, trade_date, amount, units, nav)
select f.id, v.kind, v.d::date, v.amount, v.units, v.nav
from f, (values
  ('2025-02-24', 'buy', 99996, 11.825, 84.5628),
  ('2025-03-03', 'buy', 99991, 12.063, 82.891),
  ('2025-04-01', 'buy', 99994, 11.769, 84.9643),
  ('2025-05-02', 'buy', 99995, 11.365, 87.9847),
  ('2025-06-02', 'buy', 99997, 11.113, 89.9823),
  ('2025-07-01', 'buy', 99991, 10.789, 92.6786),
  ('2025-08-01', 'buy', 99997, 10.949, 91.3302),
  ('2025-09-01', 'buy', 99996, 10.926, 91.5207),
  ('2025-10-01', 'buy', 99992, 10.813, 92.4742),
  ('2025-11-03', 'buy', 99993, 10.586, 94.4577),
  ('2025-12-01', 'buy', 99991, 10.532, 94.9398),
  ('2026-01-01', 'buy', 99993, 10.533, 94.9335),
  ('2026-02-02', 'buy', 99992, 10.736, 93.1373),
  ('2026-03-02', 'buy', 99997, 10.938, 91.422),
  ('2026-04-01', 'buy', 99995, 11.581, 86.3439),
  ('2026-05-04', 'buy', 100000, 10.958, 91.2571),
  ('2026-06-01', 'buy', 109998, 12.266, 89.6775),
  ('2026-07-01', 'buy', 109996, 12.181, 90.3012),
  ('2026-08-03', 'buy', 109997, 11.751, 93.6064),
  ('2026-09-01', 'buy', 109992, 12.115, 90.7896),
  ('2026-10-01', 'buy', 109995, 12.463, 88.2569)
) as v(d, kind, amount, units, nav);

with f as (
  insert into public.mf_funds (scheme_code, name, category, fund_house, manual_nav, manual_nav_date, note, sort_order)
  values ((select m.scheme_code from public.mf_schemes m where m.isin_growth = 'INF959L01FP2' limit 1),
    'Navi Nifty 50 Index Fund - Direct Growth', 'Other Scheme - Index Funds', 'Navi Mutual Fund', 14.8819, '2026-10-09', 'ISIN INF959L01FP2', 1)
  returning id
)
insert into public.mf_transactions (fund_id, kind, trade_date, amount, units, nav)
select f.id, v.kind, v.d::date, v.amount, v.units, v.nav
from f, (values
  ('2025-03-03', 'buy', 49997, 34.811, 14.3625),
  ('2025-04-01', 'buy', 49997, 33.244, 15.0395),
  ('2025-05-02', 'buy', 49998, 31.631, 15.8065),
  ('2025-06-02', 'buy', 49998, 31.096, 16.0787),
  ('2025-07-01', 'buy', 49997, 30.017, 16.6563),
  ('2025-08-01', 'buy', 49998, 31.149, 16.0511),
  ('2025-09-01', 'buy', 49998, 31.032, 16.1119),
  ('2025-10-01', 'buy', 49998, 30.768, 16.2501),
  ('2025-11-03', 'buy', 49998, 29.634, 16.8717),
  ('2025-12-01', 'buy', 49999, 29.156, 17.1487),
  ('2026-01-01', 'buy', 49997, 29.19, 17.1282),
  ('2026-02-02', 'buy', 49998, 30.407, 16.443),
  ('2026-03-02', 'buy', 49999, 30.665, 16.3048),
  ('2026-04-01', 'buy', 49998, 33.622, 14.8707),
  ('2026-05-04', 'buy', 49998, 31.611, 15.8166),
  ('2026-06-01', 'buy', 54998, 35.812, 15.3573),
  ('2026-07-01', 'buy', 54997, 34.779, 15.8134),
  ('2026-08-03', 'buy', 54997, 33.617, 16.36),
  ('2026-09-01', 'buy', 54997, 34.611, 15.89),
  ('2026-10-01', 'buy', 54996, 37.116, 14.8174)
) as v(d, kind, amount, units, nav);

with f as (
  insert into public.mf_funds (scheme_code, name, category, fund_house, manual_nav, manual_nav_date, note, sort_order)
  values ((select m.scheme_code from public.mf_schemes m where m.isin_growth = 'INF247L01445' limit 1),
    'Motilal Oswal Midcap Fund - Direct Growth', 'Equity Scheme - Mid Cap Fund', 'Motilal Oswal Mutual Fund', 114.9479, '2026-10-09', 'ISIN INF247L01445', 2)
  returning id
)
insert into public.mf_transactions (fund_id, kind, trade_date, amount, units, nav)
select f.id, v.kind, v.d::date, v.amount, v.units, v.nav
from f, (values
  ('2025-03-03', 'buy', 49998, 4.926, 101.498),
  ('2025-04-01', 'buy', 50001, 4.792, 104.3427),
  ('2025-05-02', 'buy', 50003, 4.632, 107.9502),
  ('2025-06-02', 'buy', 50001, 4.386, 114.0019),
  ('2025-07-01', 'buy', 49998, 4.173, 119.8121),
  ('2025-08-01', 'buy', 50003, 4.303, 116.2041),
  ('2025-09-01', 'buy', 50003, 4.17, 119.9115),
  ('2025-10-01', 'buy', 49999, 4.359, 114.703),
  ('2025-11-03', 'buy', 50002, 4.177, 119.7089),
  ('2025-12-01', 'buy', 50000, 4.205, 118.9068),
  ('2026-01-01', 'buy', 49996, 4.389, 113.9116),
  ('2026-02-02', 'buy', 49996, 4.737, 105.5445),
  ('2026-03-02', 'buy', 49996, 4.932, 101.3711),
  ('2026-04-01', 'buy', 49997, 5.229, 95.6147),
  ('2026-05-04', 'buy', 49996, 4.744, 105.3881),
  ('2026-06-01', 'buy', 54996, 5.241, 104.934),
  ('2026-07-01', 'buy', 54998, 5.033, 109.2744),
  ('2026-08-03', 'buy', 55002, 4.677, 117.602),
  ('2026-09-01', 'buy', 54996, 4.566, 120.4476),
  ('2026-10-01', 'buy', 54996, 4.858, 113.207)
) as v(d, kind, amount, units, nav);

-- Stocks and ETFs ---------------------------------------------------------------------------
with st as (
  insert into public.stocks (isin, symbol, exchange, name, sector, manual_price, manual_price_date, sort_order)
  values ('INF204KB17I5', 'GOLDBEES', 'NSE', 'Nippon India ETF Gold BeES', 'Other', 12275, '2026-10-09', 0)
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
  ('2026-08-10', 'sell', 16, 12476),
  ('2026-08-10', 'sell', 24, 12476)
) as v(d, kind, qty, price);

with st as (
  insert into public.stocks (isin, symbol, exchange, name, sector, manual_price, manual_price_date, sort_order)
  values ('INF204KC1402', 'SILVERBEES', 'NSE', 'Nippon India Silver ETF', 'Other', 20968, '2026-10-09', 1)
  returning id
)
insert into public.stock_trades (stock_id, kind, trade_date, quantity, price)
select st.id, v.kind, v.d::date, v.qty, v.price
from st, (values
  ('2025-08-01', 'buy', 2, 10614),
  ('2025-08-01', 'buy', 2, 10602),
  ('2025-10-14', 'buy', 31, 17214),
  ('2025-10-20', 'sell', 15, 14917),
  ('2026-02-02', 'sell', 10, 20713)
) as v(d, kind, qty, price);

with st as (
  insert into public.stocks (isin, symbol, exchange, name, sector, manual_price, manual_price_date, sort_order)
  values ('INE040H01021', 'SUZLON', 'NSE', 'Suzlon Energy Ltd', 'Industrials', 3760, '2026-10-09', 2)
  returning id
)
insert into public.stock_trades (stock_id, kind, trade_date, quantity, price)
select st.id, v.kind, v.d::date, v.qty, v.price
from st, (values
  ('2026-03-12', 'buy', 5, 4151)
) as v(d, kind, qty, price);

-- Checks: units, invested amounts and shares must match Kite ------------------------------
set constraints all immediate;
do $$
begin
  if (select sum(case when t.kind = 'buy' then t.units else -t.units end) || '/' || sum(t.amount) filter (where t.kind = 'buy')
      from public.mf_transactions t join public.mf_funds f on f.id = t.fund_id where f.name = 'Parag Parikh Flexi Cap Fund - Direct Growth')
      <> '238.2520/2149888' then
    raise exception 'Check failed: %', 'Parag Parikh Flexi Cap Fund - Direct Growth';
  end if;
  if (select sum(case when t.kind = 'buy' then t.units else -t.units end) || '/' || sum(t.amount) filter (where t.kind = 'buy')
      from public.mf_transactions t join public.mf_funds f on f.id = t.fund_id where f.name = 'Navi Nifty 50 Index Fund - Direct Growth')
      <> '643.9680/1024953' then
    raise exception 'Check failed: %', 'Navi Nifty 50 Index Fund - Direct Growth';
  end if;
  if (select sum(case when t.kind = 'buy' then t.units else -t.units end) || '/' || sum(t.amount) filter (where t.kind = 'buy')
      from public.mf_transactions t join public.mf_funds f on f.id = t.fund_id where f.name = 'Motilal Oswal Midcap Fund - Direct Growth')
      <> '92.5290/1024977' then
    raise exception 'Check failed: %', 'Motilal Oswal Midcap Fund - Direct Growth';
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
end $$;

-- After migration 0009: each fund keeps its ISIN in its own column (tradebook imports match by it).
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'mf_funds' and column_name = 'isin') then
    execute $q$update public.mf_funds set isin = substring(note from '^ISIN ([A-Z]{2}[A-Z0-9]{9}[0-9])$'), note = ''
                where note ~ '^ISIN [A-Z]{2}[A-Z0-9]{9}[0-9]$'$q$;
  end if;
end $$;

commit;
