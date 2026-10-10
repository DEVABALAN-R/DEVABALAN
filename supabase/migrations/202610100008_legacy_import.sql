-- Phase 3.3: bring the old app's data (public.user_workspaces) into the Command Center.
-- Apply after 202610090007_investments.sql.
--
-- import_legacy_workspace(p_commit) runs as the signed-in user (security invoker): it reads
-- only the caller's own user_workspaces row and writes through the same RLS, two-step sign-in
-- (aal2), CHECKs and triggers as the app.
--   p_commit = false  does the whole import inside a savepoint, builds the check report from
--                     the rows it wrote, then rolls everything back (a true preview).
--   p_commit = true   keeps the rows and records the run in legacy_imports.
--
-- Running it again adds only what is missing: new ids are derived from the user and the old
-- id (md5), and inserts skip ids that already exist. Accounts, categories and funds whose name
-- matches one already in the app are reused, not duplicated.
--
-- Conversions: rupees become paise; a card's opening balance (stored as the amount owed)
-- becomes negative; a "payment" becomes a transfer (the old app did not take card payments out
-- of the paying account, the new app does; the report shows that difference per account);
-- fund purchases become buys on their allotment (execution) date with stamp duty and units as
-- recorded. The old app's personal profile page (column portfolio) is not money and is left
-- as it is.
--
-- Rollback (imported rows stay; delete them in the app if needed):
--   drop function if exists public.import_legacy_workspace(boolean);
--   drop function if exists internal.legacy_import_report(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb);
--   drop function if exists internal.legacy_paise(text), internal.legacy_num(text),
--     internal.legacy_day(text), internal.legacy_name(text, integer), internal.legacy_array(jsonb),
--     internal.legacy_category_icon(text), internal.legacy_fund_category(text);
--   drop table if exists public.legacy_imports;

create table if not exists public.legacy_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() unique references auth.users (id) on delete cascade,
  imported_at timestamptz not null default pg_catalog.now(),
  -- Counts of rows added by the last run (never names or amounts).
  summary jsonb not null default '{}'::jsonb check (pg_catalog.jsonb_typeof(summary) = 'object'),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);
select internal.secure_user_table('legacy_imports', true);

-- ---------------------------------------------------------------------------
-- Parsing helpers: anything malformed becomes null and the row is skipped with a reason.
-- ---------------------------------------------------------------------------
create or replace function internal.legacy_array(p jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case when pg_catalog.jsonb_typeof(p) = 'array' then p else '[]'::jsonb end
$$;

create or replace function internal.legacy_num(p text)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case when p ~ '^\s*-?\d{1,15}(\.\d+)?\s*$' then pg_catalog.btrim(p)::numeric end
$$;

-- Rupees (as stored by the old app) to paise.
create or replace function internal.legacy_paise(p text)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case when p ~ '^\s*-?\d{1,13}(\.\d+)?\s*$'
    then pg_catalog.round(pg_catalog.btrim(p)::numeric * 100)::bigint end
$$;

create or replace function internal.legacy_day(p text)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  v date;
begin
  if p is null or p !~ '^\d{4}-\d{2}-\d{2}$' then
    return null;
  end if;
  v := p::date;
  return case when v between date '1900-01-01' and date '2100-12-31' then v end;
exception
  when others then return null;
end;
$$;

create or replace function internal.legacy_name(p text, p_max integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.btrim(pg_catalog.left(pg_catalog.btrim(coalesce(p, '')), p_max))
$$;

-- The old app used emoji; pick the closest icon key by the category name.
create or replace function internal.legacy_category_icon(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when n ~ '(food|dining|grocer|restaurant|snack|meal)' then 'food'
    when n ~ '(coffee|tea)' then 'coffee'
    when n ~ '(fuel|petrol|diesel)' then 'fuel'
    when n ~ '(transport|taxi|bus|metro|train|cab)' then 'transport'
    when n ~ '(travel|trip|flight|holiday)' then 'travel'
    when n ~ '(household|maintenance)' then 'household'
    when n ~ '(rent|home|house)' then 'home'
    when n ~ '(electric|utilit|water)' then 'utilities'
    when n ~ '(bill|internet|broadband)' then 'bills'
    when n ~ '(mobile|recharge|phone)' then 'mobile'
    when n ~ '(cloth|dress)' then 'clothing'
    when n ~ '(shop)' then 'shops'
    when n ~ '(personal care|groom|salon)' then 'grooming'
    when n ~ '(medic|pharma)' then 'medicine'
    when n ~ '(health|hospital|doctor)' then 'health'
    when n ~ '(educat|course|school|college)' then 'education'
    when n ~ '(movie|entertain)' then 'entertainment'
    when n ~ '(gift)' then 'gift'
    when n ~ '(family|parent)' then 'family'
    when n ~ '(salary|bonus)' then 'salary'
    when n ~ '(freelance|project|consult)' then 'freelance'
    when n ~ '(interest)' then 'interest'
    when n ~ '(refund|cashback)' then 'refund'
    else 'other'
  end
  from (select pg_catalog.lower(coalesce(p_name, '')) as n) s
$$;

-- The old app's fund category was free text ("Large Cap"). Prefix it the way AMFI names
-- categories so the allocation chart can group it; linking the fund to its AMFI scheme later
-- replaces it with AMFI's own category.
create or replace function internal.legacy_fund_category(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when n in ('', 'unclassified') then ''
    when n ~ 'scheme' then c
    when n ~ '(gold|silver|index|etf|fund of fund|fof)' then 'Other Scheme - ' || c
    when n ~ '(hybrid|balanced|arbitrage|multi asset|equity savings|aggressive|conservative)'
      then 'Hybrid Scheme - ' || c
    when n ~ '(debt|liquid|gilt|overnight|money market|bond|duration|credit risk|psu|floater|income)'
      then 'Debt Scheme - ' || c
    when n ~ '(equity|cap|elss|tax sav|flexi|multi|focused|value|contra|dividend yield|sector|themat)'
      then 'Equity Scheme - ' || c
    else c
  end
  from (select pg_catalog.left(pg_catalog.btrim(coalesce(p, '')), 140) as c,
    pg_catalog.lower(pg_catalog.btrim(coalesce(p, ''))) as n) s
$$;

revoke all on function internal.legacy_array(jsonb), internal.legacy_num(text),
  internal.legacy_paise(text), internal.legacy_day(text), internal.legacy_name(text, integer),
  internal.legacy_category_icon(text), internal.legacy_fund_category(text) from public, anon;
grant execute on function internal.legacy_array(jsonb), internal.legacy_num(text),
  internal.legacy_paise(text), internal.legacy_day(text), internal.legacy_name(text, integer),
  internal.legacy_category_icon(text), internal.legacy_fund_category(text) to authenticated;

-- ---------------------------------------------------------------------------
-- The check report: old totals (old app's rules) next to what is now in the database.
-- Money in paise; balances as of today with the new sign (negative = owed).
-- ---------------------------------------------------------------------------
create or replace function internal.legacy_import_report(
  p_uid uuid, p_transactions jsonb, p_accounts jsonb, p_funds jsonb, p_purchases jsonb,
  p_acct jsonb, p_fund jsonb, p_reused jsonb
)
returns jsonb
language sql
stable
set search_path = ''
-- Runs right after thousands of inserts, when the planner's row estimates are still those of
-- the empty tables: nested loops over those estimates take seconds, hash joins milliseconds.
-- (Without nested loops the cost estimate is huge, which would also start a slow JIT compile.)
set enable_nestloop = off
set jit = off
as $$
  with lt as (
    select t ->> 'type' as typ, t ->> 'accountId' as acc, t ->> 'toAccountId' as to_acc,
      internal.legacy_paise(t ->> 'amount') as amount,
      case when t ->> 'type' = 'income' then 'income' else 'expense' end as kind,
      internal.legacy_name(t ->> 'category', 40) as top_name,
      pg_catalog.lower(internal.legacy_name(t ->> 'category', 40)) as top,
      -- The old app counted entries dated up to today.
      coalesce(t ->> 'date' <= pg_catalog.to_char(current_date, 'YYYY-MM-DD'), false) as counted,
      n.id as new_id
    from pg_catalog.jsonb_array_elements(internal.legacy_array(p_transactions)) as t
    left join public.transactions n
      on n.id = pg_catalog.md5(p_uid::text || ':transaction:' || (t ->> 'id'))::uuid
  ),
  la as (
    select a ->> 'id' as lid, internal.legacy_name(a ->> 'name', 60) as name,
      coalesce(a ->> 'type', 'bank') as typ,
      coalesce(internal.legacy_paise(a ->> 'openingBalance'), 0) as opening,
      (p_acct ->> (a ->> 'id'))::uuid as new_id, x.ord
    from pg_catalog.jsonb_array_elements(internal.legacy_array(p_accounts)) with ordinality as x(a, ord)
  ),
  -- Effect of each old entry on each old account, under the old rules and the new ones.
  effect as (
    select la.lid, lt.new_id, lt.counted,
      case
        when la.typ = 'credit' then
          case when lt.typ = 'expense' and lt.acc = la.lid then -lt.amount
            when lt.typ = 'payment' and lt.to_acc = la.lid then lt.amount else 0 end
        else
          case when lt.typ = 'income' and lt.acc = la.lid then lt.amount
            when lt.typ = 'expense' and lt.acc = la.lid then -lt.amount else 0 end
      end as old_amount,
      case
        when lt.typ = 'income' and lt.acc = la.lid then lt.amount
        when lt.typ = 'expense' and lt.acc = la.lid then -lt.amount
        when lt.typ = 'payment' and lt.acc = la.lid then -lt.amount
        when lt.typ = 'payment' and lt.to_acc = la.lid then lt.amount
        else 0
      end as new_amount
    from la join lt on lt.acc = la.lid or lt.to_acc = la.lid
    where lt.amount is not null
  ),
  accounts as (
    select la.ord, pg_catalog.jsonb_build_object(
      'name', a.name,
      'legacy_name', la.name,
      'group', a.account_group,
      'reused', coalesce((p_reused ->> a.id::text)::boolean, false),
      'legacy', case when la.typ = 'credit' then -la.opening else la.opening end
        + coalesce((select sum(e.old_amount) from effect e where e.lid = la.lid and e.counted), 0),
      'new', a.opening_balance + coalesce((
        select sum(case
          when t.kind = 'income' and t.account_id = a.id then t.amount
          when t.kind = 'expense' and t.account_id = a.id then -t.amount
          when t.kind = 'transfer' and t.account_id = a.id then -t.amount - t.fee
          when t.kind = 'transfer' and t.to_account_id = a.id then t.amount
          else 0 end)
        from lt join public.transactions t on t.id = lt.new_id
        where (t.account_id = a.id or t.to_account_id = a.id) and t.occurred_on <= current_date
      ), 0),
      -- Payments the old app left out of this account's balance (and refunds on a card).
      'transfers', coalesce((select sum(e.new_amount - e.old_amount) from effect e
        where e.lid = la.lid and e.counted and e.new_id is not null), 0),
      -- Old entries on this account that were not brought over.
      'skipped', coalesce((select sum(e.old_amount) from effect e
        where e.lid = la.lid and e.counted and e.new_id is null), 0)
    ) as row
    from la join public.accounts a on a.id = la.new_id
  ),
  categories as (
    select pg_catalog.jsonb_build_object('kind', o.kind, 'name', o.name, 'legacy', o.legacy,
      'new', coalesce(n.total, 0)) as row, o.kind, o.legacy
    from (
      select lt.kind, lt.top as key, pg_catalog.max(lt.top_name) as name, sum(lt.amount) as legacy
      from lt where lt.typ in ('income', 'expense') and lt.amount is not null
      group by lt.kind, lt.top
    ) o
    left join (
      select t.kind, coalesce(pg_catalog.lower(pg_catalog.btrim(p.name)), '') as key,
        sum(t.amount) as total
      from lt join public.transactions t on t.id = lt.new_id
      left join public.categories c on c.id = t.category_id
      left join public.categories p on p.id = coalesce(c.parent_id, c.id)
      where t.kind in ('income', 'expense')
      group by t.kind, coalesce(pg_catalog.lower(pg_catalog.btrim(p.name)), '')
    ) n on n.kind = o.kind and n.key = o.key
  ),
  lp as (
    select p ->> 'fundId' as fund, internal.legacy_paise(p ->> 'investedAmount') as amount,
      pg_catalog.round(internal.legacy_num(p ->> 'units'), 4) as units, m.id as new_id,
      m.amount as new_amount, m.units as new_units
    from pg_catalog.jsonb_array_elements(internal.legacy_array(p_purchases)) as p
    left join public.mf_transactions m
      on m.id = pg_catalog.md5(p_uid::text || ':fund-purchase:' || (p ->> 'id'))::uuid
  ),
  funds as (
    select x.ord, pg_catalog.jsonb_build_object(
      'name', f.name,
      'reused', coalesce((p_reused ->> f.id::text)::boolean, false),
      'legacy_invested', coalesce((select sum(lp.amount) from lp where lp.fund = x.f ->> 'id'), 0),
      'legacy_units', coalesce((select sum(lp.units) from lp where lp.fund = x.f ->> 'id'), 0),
      'new_invested', coalesce((select sum(lp.new_amount) from lp where lp.fund = x.f ->> 'id'), 0),
      'new_units', coalesce((select sum(lp.new_units) from lp where lp.fund = x.f ->> 'id'), 0),
      'skipped', (select count(*) from lp where lp.fund = x.f ->> 'id' and lp.new_id is null)
    ) as row
    from pg_catalog.jsonb_array_elements(internal.legacy_array(p_funds)) with ordinality as x(f, ord)
    join public.mf_funds f on f.id = (p_fund ->> (x.f ->> 'id'))::uuid
  )
  select pg_catalog.jsonb_build_object(
    'as_of', current_date,
    'accounts', coalesce((select pg_catalog.jsonb_agg(row order by ord) from accounts), '[]'::jsonb),
    'categories', coalesce((select pg_catalog.jsonb_agg(row order by kind desc, legacy desc)
      from categories), '[]'::jsonb),
    'funds', coalesce((select pg_catalog.jsonb_agg(row order by ord) from funds), '[]'::jsonb)
  )
$$;
revoke all on function internal.legacy_import_report(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb)
  from public, anon;
grant execute on function internal.legacy_import_report(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb)
  to authenticated;

-- ---------------------------------------------------------------------------
-- The import
-- ---------------------------------------------------------------------------
create or replace function public.import_legacy_workspace(p_commit boolean default false)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  w record;
  v_acct jsonb := '{}';    -- old account id → account id
  v_cat jsonb := '{}';     -- 'kind|lower(name)' → top-level category id
  v_fund jsonb := '{}';    -- old fund id → fund id
  v_reused jsonb := '{}';  -- ids of accounts and funds that were already in the app
  v_counts jsonb := '{}';
  v_skipped jsonb := '[]';
  v_report jsonb;
  v_id uuid;
  v_order integer;
  v_added integer;
  v_reused_n integer;
  v_n integer;
  v_skip jsonb;
  r record;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if pg_catalog.to_regclass('public.user_workspaces') is null then
    return pg_catalog.jsonb_build_object('status', 'none');
  end if;
  select u.transactions, u.accounts, u.categories, u.mutual_funds, u.fund_purchases
    into w from public.user_workspaces u where u.user_id = v_uid;
  if not found then
    return pg_catalog.jsonb_build_object('status', 'none');
  end if;

  begin
    -- Accounts ---------------------------------------------------------------------------
    v_added := 0;
    v_reused_n := 0;
    select coalesce(pg_catalog.max(a.sort_order) + 1, 0) into v_order from public.accounts a;
    for r in
      select a ->> 'id' as lid, internal.legacy_name(a ->> 'name', 60) as name,
        coalesce(a ->> 'type', 'bank') as typ,
        coalesce(internal.legacy_paise(a ->> 'openingBalance'), 0) as opening, x.ord
      from pg_catalog.jsonb_array_elements(internal.legacy_array(w.accounts)) with ordinality as x(a, ord)
    loop
      if coalesce(r.lid, '') = '' or r.name = '' or pg_catalog.abs(r.opening) > 1000000000000 then
        v_skipped := v_skipped || pg_catalog.jsonb_build_object('area', 'accounts',
          'reason', 'name or opening balance missing', 'count', 1);
        continue;
      end if;
      select a.id into v_id from public.accounts a
      where pg_catalog.lower(pg_catalog.btrim(a.name)) = pg_catalog.lower(r.name);
      if found then
        v_n := 0;
      else
        v_id := pg_catalog.md5(v_uid::text || ':account:' || r.lid)::uuid;
        insert into public.accounts (id, name, account_group, opening_balance, sort_order)
        values (v_id, r.name, case when r.typ = 'credit' then 'card' else 'bank' end,
          case when r.typ = 'credit' then -r.opening else r.opening end,
          least(v_order + r.ord::integer, 100000))
        on conflict (id) do nothing;
        get diagnostics v_n = row_count;
      end if;
      v_acct := v_acct || pg_catalog.jsonb_build_object(r.lid, v_id);
      if v_n = 1 then
        v_added := v_added + 1;
      else
        v_reused_n := v_reused_n + 1;
        v_reused := v_reused || pg_catalog.jsonb_build_object(v_id::text, true);
      end if;
    end loop;
    v_counts := v_counts || pg_catalog.jsonb_build_object('accounts', pg_catalog.jsonb_build_object(
      'legacy', pg_catalog.jsonb_array_length(internal.legacy_array(w.accounts)),
      'added', v_added, 'reused', v_reused_n));

    -- Categories: the old list, then names used by entries but missing from it -----------
    v_added := 0;
    v_reused_n := 0;
    for r in
      with listed as (
        select case when c ->> 'type' = 'income' then 'income' else 'expense' end as kind,
          internal.legacy_name(c ->> 'name', 40) as name,
          internal.legacy_paise(c ->> 'monthlyBudget') as budget, x.ord
        from pg_catalog.jsonb_array_elements(internal.legacy_array(w.categories)) with ordinality as x(c, ord)
      ),
      used as (
        select distinct case when t ->> 'type' = 'income' then 'income' else 'expense' end as kind,
          internal.legacy_name(t ->> 'category', 40) as name
        from pg_catalog.jsonb_array_elements(internal.legacy_array(w.transactions)) as t
        where t ->> 'type' in ('income', 'expense')
      )
      select l.kind, l.name, l.budget, l.ord from listed l where l.name <> ''
      union all
      select u.kind, u.name, null, 100000 from used u
      where u.name <> '' and not exists (select 1 from listed l
        where l.kind = u.kind and pg_catalog.lower(l.name) = pg_catalog.lower(u.name))
      order by 4, 2
    loop
      continue when v_cat ? (r.kind || '|' || pg_catalog.lower(r.name));
      select c.id into v_id from public.categories c
      where c.kind = r.kind and c.parent_id is null
        and pg_catalog.lower(pg_catalog.btrim(c.name)) = pg_catalog.lower(r.name);
      if found then
        v_n := 0;
      else
        v_id := pg_catalog.md5(v_uid::text || ':category:' || r.kind || ':' || pg_catalog.lower(r.name))::uuid;
        select coalesce(pg_catalog.max(c.sort_order) + 1, 0) into v_order from public.categories c
        where c.kind = r.kind and c.parent_id is null;
        insert into public.categories (id, kind, parent_id, name, icon, tint, budget, sort_order)
        values (v_id, r.kind, null, r.name, internal.legacy_category_icon(r.name), (v_added % 8)::smallint,
          case when r.kind = 'expense' and r.budget between 1 and 1000000000000 then r.budget end,
          least(v_order, 100000))
        on conflict (id) do nothing;
        get diagnostics v_n = row_count;
      end if;
      v_cat := v_cat || pg_catalog.jsonb_build_object(r.kind || '|' || pg_catalog.lower(r.name), v_id);
      if v_n = 1 then v_added := v_added + 1; else v_reused_n := v_reused_n + 1; end if;
    end loop;

    -- Subcategories: listed under their category, or used by entries.
    with subs as (
      select distinct on (x.parent, pg_catalog.lower(x.name)) x.kind, x.parent, x.name, x.ord
      from (
        select case when c ->> 'type' = 'income' then 'income' else 'expense' end as kind,
          (v_cat ->> ((case when c ->> 'type' = 'income' then 'income' else 'expense' end) || '|'
            || pg_catalog.lower(internal.legacy_name(c ->> 'name', 40))))::uuid as parent,
          internal.legacy_name(y.s #>> '{}', 40) as name, y.s_ord::integer as ord
        from pg_catalog.jsonb_array_elements(internal.legacy_array(w.categories)) as c,
          pg_catalog.jsonb_array_elements(internal.legacy_array(c -> 'subcategories'))
            with ordinality as y(s, s_ord)
        where pg_catalog.jsonb_typeof(y.s) = 'string'
        union all
        select case when t ->> 'type' = 'income' then 'income' else 'expense' end,
          (v_cat ->> ((case when t ->> 'type' = 'income' then 'income' else 'expense' end) || '|'
            || pg_catalog.lower(internal.legacy_name(t ->> 'category', 40))))::uuid,
          internal.legacy_name(t ->> 'subcategory', 40), 100000
        from pg_catalog.jsonb_array_elements(internal.legacy_array(w.transactions)) as t
        where t ->> 'type' in ('income', 'expense')
      ) x
      where x.parent is not null and x.name <> ''
      order by x.parent, pg_catalog.lower(x.name), x.ord
    )
    insert into public.categories (id, kind, parent_id, name, icon, tint, sort_order)
    select pg_catalog.md5(v_uid::text || ':category:' || s.parent::text || ':' || pg_catalog.lower(s.name))::uuid,
      s.kind, s.parent, s.name, p.icon, p.tint, s.ord
    from subs s join public.categories p on p.id = s.parent
    where not exists (select 1 from public.categories c
      where c.parent_id = s.parent and pg_catalog.lower(pg_catalog.btrim(c.name)) = pg_catalog.lower(s.name))
    on conflict (id) do nothing;
    get diagnostics v_n = row_count;
    v_counts := v_counts || pg_catalog.jsonb_build_object('categories', pg_catalog.jsonb_build_object(
      'added', v_added, 'reused', v_reused_n, 'subcategories_added', v_n));

    -- Transactions -----------------------------------------------------------------------
    with src as (
      select t ->> 'id' as lid, t ->> 'type' as typ, internal.legacy_day(t ->> 'date') as day,
        internal.legacy_paise(t ->> 'amount') as amount,
        (v_acct ->> (t ->> 'accountId'))::uuid as account_id,
        (v_acct ->> (t ->> 'toAccountId'))::uuid as to_account_id,
        (v_cat ->> ((case when t ->> 'type' = 'income' then 'income' else 'expense' end) || '|'
          || pg_catalog.lower(internal.legacy_name(t ->> 'category', 40))))::uuid as top_id,
        pg_catalog.lower(internal.legacy_name(t ->> 'subcategory', 40)) as sub,
        pg_catalog.left(pg_catalog.concat_ws(' · ', nullif(pg_catalog.btrim(t ->> 'description'), ''),
          nullif(pg_catalog.btrim(t ->> 'note'), '')), 500) as note,
        case when (t ->> 'created') ~ '^\d{10,15}$'
          then pg_catalog.to_timestamp((t ->> 'created')::bigint / 1000.0) end as created_at
      from pg_catalog.jsonb_array_elements(internal.legacy_array(w.transactions)) as t
    ),
    checked as (
      select s.*, case
        when coalesce(s.lid, '') = '' then 'missing id'
        when s.typ is null or s.typ not in ('income', 'expense', 'payment') then 'unknown type'
        when s.day is null then 'invalid date'
        when s.amount is null or s.amount < 1 then 'amount missing or zero'
        when s.amount > 1000000000000 then 'amount too large'
        when s.account_id is null then 'account not found'
        when s.typ = 'payment' and (s.to_account_id is null or s.to_account_id = s.account_id)
          then 'payment without a second account'
      end as reason
      from src s
    ),
    ins as (
      insert into public.transactions (id, kind, occurred_on, amount, account_id, to_account_id,
        category_id, note, created_at)
      select pg_catalog.md5(v_uid::text || ':transaction:' || c.lid)::uuid,
        case when c.typ = 'payment' then 'transfer' else c.typ end, c.day, c.amount, c.account_id,
        case when c.typ = 'payment' then c.to_account_id end,
        case when c.typ <> 'payment' then coalesce((select k.id from public.categories k
          where k.parent_id = c.top_id and c.sub <> ''
            and pg_catalog.lower(pg_catalog.btrim(k.name)) = c.sub), c.top_id) end,
        coalesce(c.note, ''), coalesce(c.created_at, pg_catalog.now())
      from checked c where c.reason is null
      on conflict (id) do nothing
      returning 1
    )
    select (select count(*) from ins),
      coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('area', 'transactions',
        'reason', g.reason, 'count', g.n) order by g.n desc)
        from (select c.reason, count(*) as n from checked c where c.reason is not null group by c.reason) g),
        '[]')
    into v_n, v_skip;
    v_counts := v_counts || pg_catalog.jsonb_build_object('transactions', pg_catalog.jsonb_build_object(
      'legacy', pg_catalog.jsonb_array_length(internal.legacy_array(w.transactions)), 'added', v_n,
      'skipped', (select coalesce(sum((e ->> 'count')::integer), 0) from pg_catalog.jsonb_array_elements(v_skip) e)));
    v_skipped := v_skipped || v_skip;

    -- Mutual funds -----------------------------------------------------------------------
    v_added := 0;
    v_reused_n := 0;
    select coalesce(pg_catalog.max(f.sort_order) + 1, 0) into v_order from public.mf_funds f;
    for r in
      select f ->> 'id' as lid, internal.legacy_name(f ->> 'name', 200) as name,
        internal.legacy_fund_category(f ->> 'category') as category,
        internal.legacy_name(f ->> 'folioNumber', 40) as folio,
        pg_catalog.round(internal.legacy_num(f ->> 'currentNav'), 4) as nav,
        (select pg_catalog.max(internal.legacy_day(p ->> 'date'))
          from pg_catalog.jsonb_array_elements(internal.legacy_array(f -> 'navHistory')) as p) as nav_date,
        pg_catalog.left(pg_catalog.concat_ws(' · ',
          'Expense ratio ' || (internal.legacy_num(f ->> 'expenseRatio')::text) || '%',
          'Exit load ' || nullif(pg_catalog.btrim(f ->> 'exitLoad'), '')), 500) as note,
        x.ord
      from pg_catalog.jsonb_array_elements(internal.legacy_array(w.mutual_funds)) with ordinality as x(f, ord)
    loop
      if coalesce(r.lid, '') = '' or r.name = '' then
        v_skipped := v_skipped || pg_catalog.jsonb_build_object('area', 'funds',
          'reason', 'missing name', 'count', 1);
        continue;
      end if;
      select f.id into v_id from public.mf_funds f
      where pg_catalog.lower(pg_catalog.btrim(f.name)) = pg_catalog.lower(r.name)
      order by f.archived, f.created_at limit 1;
      if found then
        v_n := 0;
      else
        v_id := pg_catalog.md5(v_uid::text || ':fund:' || r.lid)::uuid;
        insert into public.mf_funds (id, name, category, folio, manual_nav, manual_nav_date, note, sort_order)
        values (v_id, r.name, r.category, r.folio,
          case when r.nav > 0 then r.nav end,
          case when r.nav > 0 then greatest(coalesce(r.nav_date, current_date), date '1990-01-01') end,
          coalesce(r.note, ''), least(v_order + r.ord::integer, 100000))
        on conflict (id) do nothing;
        get diagnostics v_n = row_count;
      end if;
      v_fund := v_fund || pg_catalog.jsonb_build_object(r.lid, v_id);
      if v_n = 1 then
        v_added := v_added + 1;
      else
        v_reused_n := v_reused_n + 1;
        v_reused := v_reused || pg_catalog.jsonb_build_object(v_id::text, true);
      end if;
    end loop;
    v_counts := v_counts || pg_catalog.jsonb_build_object('funds', pg_catalog.jsonb_build_object(
      'legacy', pg_catalog.jsonb_array_length(internal.legacy_array(w.mutual_funds)),
      'added', v_added, 'reused', v_reused_n));

    -- Fund purchases ---------------------------------------------------------------------
    with src as (
      select p ->> 'id' as lid, (v_fund ->> (p ->> 'fundId'))::uuid as fund_id,
        -- Units are allotted on the execution (NAV) date; the order date is the fallback.
        coalesce(internal.legacy_day(p ->> 'executionDate'), internal.legacy_day(p ->> 'purchasedDate')) as day,
        internal.legacy_paise(p ->> 'investedAmount') as amount,
        coalesce(internal.legacy_paise(p ->> 'stampDuty'), 0) as duty,
        pg_catalog.round(internal.legacy_num(p ->> 'units'), 4) as units,
        pg_catalog.round(internal.legacy_num(p ->> 'purchasedNav'), 4) as nav
      from pg_catalog.jsonb_array_elements(internal.legacy_array(w.fund_purchases)) as p
    ),
    checked as (
      select s.*, case
        when coalesce(s.lid, '') = '' or s.fund_id is null then 'fund not found'
        when s.day is null or s.day < date '1990-01-01' then 'invalid date'
        when s.amount is null or s.amount < 1 or s.amount > 1000000000000 then 'amount missing'
        when s.units is null or s.units <= 0 or s.nav is null or s.nav <= 0 then 'units or NAV missing'
        when s.duty < 0 or s.duty >= s.amount or s.duty > 100000000 then 'stamp duty out of range'
      end as reason
      from src s
    ),
    ins as (
      insert into public.mf_transactions (id, fund_id, kind, trade_date, amount, stamp_duty, units, nav)
      select pg_catalog.md5(v_uid::text || ':fund-purchase:' || c.lid)::uuid, c.fund_id, 'buy', c.day,
        c.amount, c.duty, c.units, c.nav
      from checked c where c.reason is null
      on conflict (id) do nothing
      returning 1
    )
    select (select count(*) from ins),
      coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('area', 'fund purchases',
        'reason', g.reason, 'count', g.n) order by g.n desc)
        from (select c.reason, count(*) as n from checked c where c.reason is not null group by c.reason) g),
        '[]')
    into v_n, v_skip;
    v_counts := v_counts || pg_catalog.jsonb_build_object('purchases', pg_catalog.jsonb_build_object(
      'legacy', pg_catalog.jsonb_array_length(internal.legacy_array(w.fund_purchases)), 'added', v_n,
      'skipped', (select coalesce(sum((e ->> 'count')::integer), 0) from pg_catalog.jsonb_array_elements(v_skip) e)));
    v_skipped := v_skipped || v_skip;

    -- Every deferred rule (units never negative, split totals) is checked now, in this block.
    set constraints all immediate;

    v_report := internal.legacy_import_report(v_uid, w.transactions, w.accounts, w.mutual_funds,
        w.fund_purchases, v_acct, v_fund, v_reused)
      || pg_catalog.jsonb_build_object('counts', v_counts, 'skipped', v_skipped,
        'imported_at', (select l.imported_at from public.legacy_imports l));

    if p_commit then
      insert into public.legacy_imports (summary)
      values (pg_catalog.jsonb_build_object(
        'accounts', v_counts #> '{accounts,added}', 'categories', v_counts #> '{categories,added}',
        'transactions', v_counts #> '{transactions,added}', 'funds', v_counts #> '{funds,added}',
        'purchases', v_counts #> '{purchases,added}'))
      on conflict (user_id) do update
        set imported_at = pg_catalog.now(), summary = excluded.summary;
      return v_report || pg_catalog.jsonb_build_object('status', 'imported',
        'imported_at', pg_catalog.now());
    end if;
    -- Preview: undo every write made in this block; the report survives in v_report.
    raise exception 'preview' using errcode = 'LGPRV';
  exception
    when sqlstate 'LGPRV' then
      return v_report || pg_catalog.jsonb_build_object('status', 'preview');
    when others then
      return pg_catalog.jsonb_build_object('status', 'error', 'message', pg_catalog.left(sqlerrm, 300));
  end;
end;
$$;
revoke all on function public.import_legacy_workspace(boolean) from public, anon;
grant execute on function public.import_legacy_workspace(boolean) to authenticated;
