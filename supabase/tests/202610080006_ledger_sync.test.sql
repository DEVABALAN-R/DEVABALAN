-- Tests for 202610080006_ledger_sync.sql (run by supabase/tests/run.sh).
\set ON_ERROR_STOP 1

-- Alice saves a whole ledger in one batch, then reads it back ------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","aal":"aal1"}';
select public.sync_ledger($j${
  "accounts": [{"id":"10000000-0000-0000-0000-000000000001","name":"Cash","account_group":"cash","opening_balance":50000,"sort_order":0}],
  "people": [{"id":"30000000-0000-0000-0000-000000000001","name":"Arun","sort_order":0}],
  "categories": [
    {"id":"20000000-0000-0000-0000-000000000002","kind":"expense","parent_id":"20000000-0000-0000-0000-000000000001","name":"Tea","icon":"food","tint":1,"budget":null,"sort_order":0},
    {"id":"20000000-0000-0000-0000-000000000001","kind":"expense","parent_id":null,"name":"Food","icon":"food","tint":1,"budget":600000,"sort_order":0}],
  "transactions": [
    {"id":"40000000-0000-0000-0000-000000000001","kind":"expense","occurred_on":"2026-10-01","amount":120000,
     "account_id":"10000000-0000-0000-0000-000000000001","to_account_id":null,"fee":0,
     "category_id":"20000000-0000-0000-0000-000000000002","note":"Dinner","person_id":null,
     "created_at":"2026-10-01T10:00:00Z","splits":[{"person_id":"30000000-0000-0000-0000-000000000001","amount":40000}],"settles":[]},
    {"id":"40000000-0000-0000-0000-000000000002","kind":"income","occurred_on":"2026-10-02","amount":40000,
     "account_id":"10000000-0000-0000-0000-000000000001","to_account_id":null,"fee":0,"category_id":null,"note":"",
     "person_id":"30000000-0000-0000-0000-000000000001","splits":[],"settles":["40000000-0000-0000-0000-000000000001"]}],
  "notes": [{"id":"50000000-0000-0000-0000-000000000001","title":"List","body":"","items":[{"id":"a","text":"Milk","done":false}],
             "color":"mint","pinned":true,"archived":false,"labels":["home"]}]
}$j$::jsonb);
do $$
declare v jsonb := public.load_ledger();
begin
  if jsonb_array_length(v -> 'accounts') <> 1 or jsonb_array_length(v -> 'categories') <> 2
    or jsonb_array_length(v -> 'transactions') <> 2 or jsonb_array_length(v -> 'splits') <> 1
    or jsonb_array_length(v -> 'settles') <> 1 or jsonb_array_length(v -> 'notes') <> 1 then
    raise exception 'FAIL: the ledger should round-trip (got %)', v;
  end if;
  if v::text like '%user_id%' then
    raise exception 'FAIL: load_ledger should not return user ids';
  end if;
end $$;

-- Editing an expense replaces its splits; deletes run after upserts.
select public.sync_ledger($j${
  "transactions": [{"id":"40000000-0000-0000-0000-000000000001","kind":"expense","occurred_on":"2026-10-01","amount":90000,
     "account_id":"10000000-0000-0000-0000-000000000001","category_id":"20000000-0000-0000-0000-000000000001","note":"Dinner",
     "splits":[],"settles":[]}],
  "deleted": {"categories":["20000000-0000-0000-0000-000000000002"], "notes":["50000000-0000-0000-0000-000000000001"]}
}$j$::jsonb);
do $$
declare v jsonb := public.load_ledger();
begin
  if jsonb_array_length(v -> 'splits') <> 0 or jsonb_array_length(v -> 'categories') <> 1
    or jsonb_array_length(v -> 'notes') <> 0
    or (select (t ->> 'amount')::bigint from jsonb_array_elements(v -> 'transactions') t
        where t ->> 'id' = '40000000-0000-0000-0000-000000000001') <> 90000 then
    raise exception 'FAIL: edits and deletes should apply (got %)', v;
  end if;
end $$;

-- A bad batch saves nothing.
do $$
begin
  perform public.sync_ledger($j${
    "accounts": [{"id":"10000000-0000-0000-0000-000000000009","name":"Wallet","account_group":"wallet","opening_balance":0,"sort_order":1}],
    "transactions": [{"id":"40000000-0000-0000-0000-000000000009","kind":"expense","occurred_on":"2026-10-03","amount":100,
       "account_id":"10000000-0000-0000-0000-000000000009",
       "splits":[{"person_id":"30000000-0000-0000-0000-000000000001","amount":500}],"settles":[]}]
  }$j$::jsonb);
  set constraints all immediate;
  raise exception 'FAIL: shares above the amount should reject the batch';
exception when check_violation then null;
end $$;
do $$
begin
  if exists (select 1 from public.accounts where name = 'Wallet') then
    raise exception 'FAIL: a rejected batch must not leave partial changes';
  end if;
end $$;
commit;

-- Bob cannot overwrite or delete Alice's rows through the batch ---------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","aal":"aal1"}';
do $$
begin
  perform public.sync_ledger($j${"accounts":[{"id":"10000000-0000-0000-0000-000000000001","name":"Mine now","account_group":"cash","opening_balance":0,"sort_order":0}]}$j$::jsonb);
  raise exception 'FAIL: a user must not take over another user''s row by id';
exception when insufficient_privilege then null;
end $$;
select public.sync_ledger($j${"deleted":{"transactions":["40000000-0000-0000-0000-000000000001"],"accounts":["10000000-0000-0000-0000-000000000001"]}}$j$::jsonb);
do $$
begin
  if jsonb_array_length(public.load_ledger() -> 'accounts') <> 0 then
    raise exception 'FAIL: load_ledger must return only the caller''s rows';
  end if;
end $$;
rollback;
do $$
begin
  if not exists (select 1 from public.accounts where id = '10000000-0000-0000-0000-000000000001' and name = 'Cash')
    or not exists (select 1 from public.transactions where id = '40000000-0000-0000-0000-000000000001') then
    raise exception 'FAIL: another user''s deletes must not reach Alice''s rows';
  end if;
end $$;

-- Input checks and access ------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","aal":"aal1"}';
do $$
begin
  perform public.sync_ledger('{"accounts": {"not": "a list"}}');
  raise exception 'FAIL: a malformed batch should be rejected';
exception when invalid_parameter_value then null;
end $$;
rollback;

begin;
set local role anon;
do $$
begin
  perform public.load_ledger();
  raise exception 'FAIL: anonymous users must not call load_ledger';
exception when insufficient_privilege then null;
end $$;
rollback;

-- Clean up.
delete from public.repayment_settles;
delete from public.transaction_splits;
delete from public.transactions;
delete from public.people;
delete from public.categories where parent_id is not null;
delete from public.categories;
delete from public.accounts;
delete from public.notes;
select 'ledger sync tests passed' as result;
