-- Tests for 202610080004_auth_hardening.sql. Run by supabase/tests/run.sh after the
-- migration, on plain Postgres with tests/support/supabase_stub.sql. Each block
-- raises 'FAIL: ...' on a wrong result; psql stops on the first error.
--
-- Fixtures created before the migration by run.sh:
--   alice 0…0a  existing account with a workspace and the published portfolio
--   bob   0…0b  existing account, nothing else
\set ON_ERROR_STOP 1

-- Existing accounts were carried over -------------------------------------------
do $$
begin
  if (select count(*) from internal.auth_allowlist) <> 2 then
    raise exception 'FAIL: existing emails should be allowlisted';
  end if;
  if not exists (select 1 from internal.auth_allowlist where email = 'alice@example.com') then
    raise exception 'FAIL: allowlist emails should be lower-cased and trimmed';
  end if;
  if (select count(*) from public.profiles) <> 2 or (select count(*) from public.user_preferences) <> 2 then
    raise exception 'FAIL: existing accounts should get profiles and preferences';
  end if;
  if (select array_agg(user_id) from internal.portfolio_owners)
    <> array['00000000-0000-0000-0000-00000000000a'::uuid] then
    raise exception 'FAIL: only the current portfolio publisher should be an owner';
  end if;
end $$;

-- Sign-up hook --------------------------------------------------------------------
begin;
set local role supabase_auth_admin;
do $$
begin
  if internal.before_user_created('{"user":{"email":"  Alice@Example.com "}}') <> '{}'::jsonb then
    raise exception 'FAIL: an allowlisted email should be allowed (case and spaces ignored)';
  end if;
  if internal.before_user_created('{"user":{"email":"mallory@example.com"}}') -> 'error' ->> 'http_code'
    is distinct from '403' then
    raise exception 'FAIL: an email not on the list should be rejected with 403';
  end if;
  if internal.before_user_created('{"user":{"phone":"+911234567890"}}') -> 'error' is null then
    raise exception 'FAIL: a sign-up without an email should be rejected';
  end if;
end $$;
rollback;

begin;
set local role authenticated;
do $$
begin
  perform internal.before_user_created('{"user":{"email":"alice@example.com"}}');
  raise exception 'FAIL: clients must not call the hook';
exception when insufficient_privilege then null;
end $$;
do $$
begin
  perform 1 from internal.auth_allowlist;
  raise exception 'FAIL: clients must not read the allowlist';
exception when insufficient_privilege then null;
end $$;
rollback;

-- New users get a profile and preferences -----------------------------------------
begin;
set local role supabase_auth_admin;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000c', 'carol@example.com');
reset role;
do $$
begin
  if not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000c')
    or not exists (select 1 from public.user_preferences where user_id = '00000000-0000-0000-0000-00000000000c'
      and privacy_ai_opt_in = false and theme = 'system') then
    raise exception 'FAIL: a new user should get a profile and default preferences';
  end if;
end $$;
rollback;

-- Profiles and preferences: own row only, safe columns only ------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$
declare n int;
begin
  if (select count(*) from public.profiles) <> 1 or (select count(*) from public.user_preferences) <> 1 then
    raise exception 'FAIL: a user should see only their own profile and preferences';
  end if;
  update public.profiles set display_name = 'Alice' where id = '00000000-0000-0000-0000-00000000000a';
  update public.profiles set display_name = 'Hacked' where id = '00000000-0000-0000-0000-00000000000b';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: a user must not edit someone else''s profile'; end if;
  update public.user_preferences set theme = 'dark', privacy_ai_opt_in = true;
end $$;
do $$
begin
  update public.profiles set data_model_version = 2;
  raise exception 'FAIL: data_model_version must not be client-writable';
exception when insufficient_privilege then null;
end $$;
do $$
begin
  insert into public.profiles (id) values ('00000000-0000-0000-0000-0000000000ff');
  raise exception 'FAIL: clients must not insert profiles';
exception when insufficient_privilege then null;
end $$;
do $$
begin
  update public.user_preferences set theme = 'neon';
  raise exception 'FAIL: an unknown theme should be rejected';
exception when check_violation then null;
end $$;
rollback;

begin;
set local role anon;
do $$
begin
  perform 1 from public.profiles;
  raise exception 'FAIL: anonymous users must not read profiles';
exception when insufficient_privilege then null;
end $$;
rollback;

-- Workspace RPC: audit without values, size limit, legacy overload gone ------------
do $$
begin
  if has_table_privilege('authenticated', 'public.audit_logs', 'insert,update,delete,truncate')
    or has_table_privilege('anon', 'public.audit_logs', 'select,insert,update,delete') then
    raise exception 'FAIL: clients may only read audit_logs';
  end if;
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'save_user_workspace' and p.pronargs = 4
  ) then
    raise exception 'FAIL: the four-argument save_user_workspace should be dropped';
  end if;
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where p.prosecdef and n.nspname in ('public', 'internal')
      and not coalesce(p.proconfig, '{}') @> array['search_path=""']
  ) then
    raise exception 'FAIL: every security definer function should pin an empty search_path';
  end if;
end $$;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$
declare v bigint;
begin
  v := public.save_user_workspace(1, '[{"id":"t1","amount":123456,"note":"secret"}]', '[]', '[]', '[]', '[]');
  if v <> 2 then raise exception 'FAIL: save should bump the revision (got %)', v; end if;
  if public.save_user_workspace(1, '[]', '[]', '[]', '[]', '[]') is not null then
    raise exception 'FAIL: a stale revision should return NULL';
  end if;
  if (select changed_fields from public.audit_logs where action = 'workspace.save') <> array['transactions'] then
    raise exception 'FAIL: the audit entry should name only the changed collection';
  end if;
  if exists (select 1 from public.audit_logs a where a::text like '%123456%' or a::text like '%secret%') then
    raise exception 'FAIL: audit entries must not contain amounts or notes';
  end if;
end $$;
do $$
begin
  perform public.save_user_workspace(2, pg_catalog.jsonb_build_array(pg_catalog.repeat('x', 8400000)), '[]', '[]', '[]', '[]');
  raise exception 'FAIL: an oversized workspace should be rejected';
exception when invalid_parameter_value then null;
end $$;
do $$
begin
  update public.audit_logs set action = 'workspace.edit';
  raise exception 'FAIL: audit_logs must not be updatable';
exception when insufficient_privilege then null;
end $$;
do $$
begin
  insert into public.audit_logs (actor_id, action, entity) values (auth.uid(), 'fake.entry', 'x');
  raise exception 'FAIL: clients must not write audit entries';
exception when insufficient_privilege then null;
end $$;
do $$
begin
  perform internal.log_audit('fake.entry', 'x', null);
  raise exception 'FAIL: clients must not call log_audit';
exception when insufficient_privilege then null;
end $$;
rollback;

-- Even the table owner cannot rewrite history.
begin;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin perform internal.log_audit('workspace.save', 'user_workspaces', 'x'); end $$;
do $$
begin
  delete from public.audit_logs;
  raise exception 'FAIL: audit_logs must be append-only for every role';
exception when insufficient_privilege then null;
end $$;
rollback;

-- Bob sees neither Alice's workspace nor her audit entries.
begin;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin perform internal.log_audit('workspace.save', 'user_workspaces', 'x'); end $$;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$
begin
  if exists (select 1 from public.audit_logs) or exists (select 1 from public.user_workspaces) then
    raise exception 'FAIL: a user must not see another user''s workspace or audit entries';
  end if;
end $$;
rollback;

-- Public portfolio owner gate ------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$
begin
  perform public.save_public_portfolio(0, 'bob-spam', '{"name":"Bob"}');
  raise exception 'FAIL: a non-owner must not publish a portfolio';
exception when insufficient_privilege then null;
end $$;
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$
begin
  if public.save_public_portfolio(1, 'devabalan', '{"name":"Alice"}') <> 2 then
    raise exception 'FAIL: the owner should be able to save the portfolio';
  end if;
  if not exists (select 1 from public.audit_logs where action = 'portfolio.save') then
    raise exception 'FAIL: a portfolio save should be audited';
  end if;
end $$;
do $$
begin
  perform public.save_public_portfolio(2, 'devabalan',
    pg_catalog.jsonb_build_object('bio', pg_catalog.repeat('x', 300000)));
  raise exception 'FAIL: an oversized portfolio should be rejected';
exception when invalid_parameter_value then null;
end $$;
rollback;

select 'auth hardening tests passed' as result;
