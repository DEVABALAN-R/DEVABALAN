-- Tests for 202610080005_core_finance.sql (run by supabase/tests/run.sh).
-- Users: alice 0…0a, bob 0…0b (from run.sh), carol 0…0c (two-step sign-in on).
\set ON_ERROR_STOP 1

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000c', 'carol@example.com')
  on conflict (id) do nothing;
insert into auth.mfa_factors (user_id, status)
  select '00000000-0000-0000-0000-00000000000c', 'verified'
  where not exists (select 1 from auth.mfa_factors where user_id = '00000000-0000-0000-0000-00000000000c');

-- Alice's ledger, saved through the API role as she would --------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","aal":"aal1"}';
insert into public.accounts (id, name, account_group, opening_balance) values
  ('10000000-0000-0000-0000-000000000001', 'Cash', 'cash', 50000),
  ('10000000-0000-0000-0000-000000000002', 'Bank', 'bank', 1000000);
insert into public.categories (id, kind, parent_id, name, icon, tint, budget) values
  ('20000000-0000-0000-0000-000000000001', 'expense', null, 'Food', 'food', 1, 600000),
  ('20000000-0000-0000-0000-000000000002', 'expense', '20000000-0000-0000-0000-000000000001', 'Tea', 'food', 1, null),
  ('20000000-0000-0000-0000-000000000003', 'income', null, 'Salary', 'salary', 2, null);
insert into public.people (id, name) values ('30000000-0000-0000-0000-000000000001', 'Arun');
insert into public.transactions (id, kind, occurred_on, amount, account_id, category_id, note) values
  ('40000000-0000-0000-0000-000000000001', 'expense', '2026-10-01', 120000,
   '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Team dinner');
insert into public.transaction_splits (transaction_id, person_id, amount) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 40000);
insert into public.transactions (id, kind, occurred_on, amount, account_id, person_id) values
  ('40000000-0000-0000-0000-000000000002', 'income', '2026-10-02', 40000,
   '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001');
insert into public.repayment_settles (repayment_id, expense_id) values
  ('40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001');
insert into public.transactions (kind, occurred_on, amount, account_id, to_account_id, fee) values
  ('transfer', '2026-10-03', 20000, '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1000);
insert into public.notes (title, items, color, labels) values
  ('Groceries', '[{"id":"a","text":"Milk","done":false}]', 'mint', '{home}');
do $$
begin
  if (select count(*) from public.transactions) <> 3 or (select user_id from public.accounts limit 1)
    <> '00000000-0000-0000-0000-00000000000a' then
    raise exception 'FAIL: rows should save with the caller as owner';
  end if;
end $$;
commit;

-- Other users see nothing and cannot borrow Alice's rows --------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","aal":"aal1"}';
do $$
declare n int;
begin
  if exists (select 1 from public.accounts) or exists (select 1 from public.transactions)
    or exists (select 1 from public.transaction_splits) or exists (select 1 from public.notes) then
    raise exception 'FAIL: a user must not see another user''s rows';
  end if;
  update public.accounts set name = 'Hacked';
  get diagnostics n = row_count;
  delete from public.transactions;
  if n <> 0 or (select count(*) from public.transactions) <> 0 then
    raise exception 'FAIL: a user must not change another user''s rows';
  end if;
end $$;
do $$
begin
  insert into public.accounts (user_id, name, account_group) values
    ('00000000-0000-0000-0000-00000000000a', 'Planted', 'cash');
  raise exception 'FAIL: a user must not create rows for someone else';
exception when insufficient_privilege then null;
end $$;
do $$
begin
  -- Bob's own entry pointing at Alice's account: the composite key refuses it.
  insert into public.transactions (kind, occurred_on, amount, account_id) values
    ('expense', '2026-10-01', 100, '10000000-0000-0000-0000-000000000001');
  raise exception 'FAIL: an entry must not reference another user''s account';
exception when foreign_key_violation then null;
end $$;
rollback;

begin;
set local role anon;
do $$
begin
  perform 1 from public.transactions;
  raise exception 'FAIL: anonymous users must not read transactions';
exception when insufficient_privilege then null;
end $$;
rollback;

-- Every rule the app checks is enforced here too ----------------------------------
create or replace function pg_temp.expect_violation(p_sql text, p_what text) returns void
language plpgsql as $$
begin
  execute p_sql;
  set constraints all immediate;
  raise exception 'FAIL: % should be rejected', p_what;
exception when check_violation or not_null_violation or foreign_key_violation
  or unique_violation or invalid_text_representation then null;
end $$;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","aal":"aal1"}';
select pg_temp.expect_violation($q$insert into public.transactions (kind, occurred_on, amount, account_id)
  values ('expense', '2026-10-01', 0, '10000000-0000-0000-0000-000000000001')$q$, 'a zero amount');
select pg_temp.expect_violation($q$insert into public.transactions (kind, occurred_on, amount, account_id, to_account_id)
  values ('transfer', '2026-10-01', 100, '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001')$q$,
  'a transfer to the same account');
select pg_temp.expect_violation($q$insert into public.transactions (kind, occurred_on, amount, account_id, fee)
  values ('expense', '2026-10-01', 100, '10000000-0000-0000-0000-000000000001', 5)$q$, 'a fee on an expense');
select pg_temp.expect_violation($q$insert into public.transactions (kind, occurred_on, amount, account_id, category_id)
  values ('income', '2026-10-01', 100, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001')$q$,
  'an expense category on income');
select pg_temp.expect_violation($q$insert into public.transaction_splits (transaction_id, person_id, amount)
  values ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 100)$q$, 'a split on income');
select pg_temp.expect_violation($q$update public.transaction_splits set amount = 130000$q$,
  'shares above the expense');
select pg_temp.expect_violation($q$update public.transactions set amount = 30000
  where id = '40000000-0000-0000-0000-000000000001'$q$, 'shrinking an expense below its shares');
select pg_temp.expect_violation($q$insert into public.categories (kind, parent_id, name)
  values ('expense', '20000000-0000-0000-0000-000000000002', 'Too deep')$q$, 'a third category level');
select pg_temp.expect_violation($q$insert into public.categories (kind, parent_id, name)
  values ('income', '20000000-0000-0000-0000-000000000001', 'Mixed')$q$, 'a subcategory of another kind');
select pg_temp.expect_violation($q$update public.categories set kind = 'income'
  where id = '20000000-0000-0000-0000-000000000001'$q$, 'changing the type of a category with subcategories');
select pg_temp.expect_violation($q$insert into public.categories (kind, name, budget)
  values ('income', 'Bonus', 100)$q$, 'a budget on an income category');
select pg_temp.expect_violation($q$insert into public.categories (kind, name)
  values ('expense', ' food ')$q$, 'a duplicate category name');
select pg_temp.expect_violation($q$insert into public.accounts (name, account_group)
  values ('cash', 'cash')$q$, 'a duplicate account name');
select pg_temp.expect_violation($q$insert into public.accounts (name, account_group)
  values ('Gold', 'crypto')$q$, 'an unknown account type');
select pg_temp.expect_violation($q$insert into public.notes (color) values ('neon')$q$, 'an unknown note colour');
select pg_temp.expect_violation($q$insert into public.notes (labels) values ('{"     "}')$q$, 'an empty label');
select pg_temp.expect_violation($q$insert into public.notes (items) values ('[{"id":"a","text":"x"}]')$q$,
  'a checklist item without done');
select pg_temp.expect_violation($q$insert into public.notes (items)
  values ((select jsonb_agg(jsonb_build_object('id', g::text, 'text', 'x', 'done', false)) from generate_series(1, 201) g))$q$,
  'more than 200 checklist items');
rollback;

-- Deleting: categories cascade to subcategories, entries become uncategorised;
-- accounts and people in use cannot be deleted --------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","aal":"aal1"}';
delete from public.categories where id = '20000000-0000-0000-0000-000000000001';
do $$
begin
  if exists (select 1 from public.categories where id = '20000000-0000-0000-0000-000000000002')
    or (select category_id from public.transactions where id = '40000000-0000-0000-0000-000000000001') is not null then
    raise exception 'FAIL: deleting a category should remove its subcategories and uncategorise entries';
  end if;
end $$;
select pg_temp.expect_violation($q$delete from public.accounts where id = '10000000-0000-0000-0000-000000000001'$q$,
  'deleting an account in use');
select pg_temp.expect_violation($q$delete from public.people$q$, 'deleting a person with shares');
rollback;

-- Owner cannot be moved, even by the table owner -----------------------------------
begin;
do $$
begin
  update public.accounts set user_id = '00000000-0000-0000-0000-00000000000b'
    where id = '10000000-0000-0000-0000-000000000001';
  raise exception 'FAIL: user_id must not change';
exception when insufficient_privilege then null;
end $$;
rollback;

-- Audit: which columns changed, never the values -----------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","aal":"aal1"}';
update public.transactions set note = 'Secret party', amount = 130000
  where id = '40000000-0000-0000-0000-000000000001';
do $$
begin
  if (select changed_fields from public.audit_logs where action = 'transactions.update'
      order by id desc limit 1) <> array['amount', 'note'] then
    raise exception 'FAIL: the audit entry should name the changed columns';
  end if;
  if not exists (select 1 from public.audit_logs where action = 'transaction_splits.insert') then
    raise exception 'FAIL: split changes should be audited';
  end if;
  if exists (select 1 from public.audit_logs a
    where a::text like '%Secret%' or a::text like '%130000%' or a::text like '%Team dinner%') then
    raise exception 'FAIL: audit entries must not contain notes or amounts';
  end if;
end $$;
rollback;

-- Two-step sign-in is required once it is turned on --------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","aal":"aal1"}';
do $$
begin
  insert into public.accounts (name, account_group) values ('Carol cash', 'cash');
  raise exception 'FAIL: a password-only session must not write when two-step sign-in is on';
exception when insufficient_privilege then null;
end $$;
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","aal":"aal2"}';
insert into public.accounts (name, account_group) values ('Carol cash', 'cash');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","aal":"aal1"}';
do $$
begin
  if exists (select 1 from public.accounts) then
    raise exception 'FAIL: a password-only session must not read when two-step sign-in is on';
  end if;
end $$;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","aal":"aal2"}';
do $$
begin
  if (select count(*) from public.accounts) <> 1 then
    raise exception 'FAIL: after the code, the owner should see their rows';
  end if;
end $$;
rollback;

-- Hardening holds for the new functions --------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'internal' and not coalesce(p.proconfig, '{}') @> array['search_path=""']
  ) then
    raise exception 'FAIL: every internal function should pin an empty search_path';
  end if;
  if has_function_privilege('authenticated', 'internal.audit_row()', 'execute')
    or has_function_privilege('authenticated', 'internal.secure_user_table(text, boolean)', 'execute') then
    raise exception 'FAIL: clients must not call internal helpers';
  end if;
end $$;

-- Clean up Alice's ledger so the file can run again after a rollback test.
delete from public.repayment_settles;
delete from public.transaction_splits;
delete from public.transactions;
delete from public.people;
delete from public.categories where parent_id is not null;
delete from public.categories;
delete from public.accounts;
delete from public.notes;

select 'core finance tests passed' as result;
