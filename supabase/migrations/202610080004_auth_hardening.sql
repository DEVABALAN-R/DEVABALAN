-- Phase 2.2: auth hardening (MODERNIZATION_PLAN.md §24, migration 0004).
-- Apply after 202610040003_mutual_funds_workspace.sql. Rollback:
-- supabase/rollbacks/202610080004_auth_hardening_down.sql.
--
--   * internal schema (not exposed through the Data API) for server-only objects
--   * sign-up allowlist + Before User Created Auth Hook function
--   * profiles and user_preferences, created for every new auth user
--   * append-only audit_logs that never store amounts, notes or other values
--   * definer RPCs re-created with an empty search_path, size limits and audit entries
--   * only allowlisted owners can publish the public portfolio
--   * the legacy four-argument save_user_workspace is dropped (no client calls it)
--
-- After applying: Dashboard → Authentication → Hooks → "Before User Created" →
-- Postgres function internal.before_user_created. See SUPABASE_SETUP.md.

-- ---------------------------------------------------------------------------
-- internal schema
-- ---------------------------------------------------------------------------
create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;
-- The Auth server runs hooks as supabase_auth_admin; it needs only the allowlist.
grant usage on schema internal to supabase_auth_admin;

create or replace function internal.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
revoke all on function internal.touch_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Sign-up allowlist and the Before User Created hook
-- ---------------------------------------------------------------------------
create table if not exists internal.auth_allowlist (
  email text primary key
    check (email = pg_catalog.lower(pg_catalog.btrim(email)) and email like '%_@_%'),
  note text check (note is null or pg_catalog.char_length(note) <= 200),
  created_at timestamptz not null default pg_catalog.now()
);
revoke all on table internal.auth_allowlist from public, anon, authenticated;
grant select on table internal.auth_allowlist to supabase_auth_admin;

-- Everyone who can already sign in stays allowed.
insert into internal.auth_allowlist (email, note)
select distinct pg_catalog.lower(pg_catalog.btrim(u.email)), 'existing account at migration 0004'
from auth.users u
where u.email is not null and pg_catalog.lower(pg_catalog.btrim(u.email)) like '%_@_%'
on conflict (email) do nothing;

-- Returns {} to allow the sign-up, or an error object the Auth server returns as 403.
-- The message is the same for every rejection so it reveals nothing about the list.
create or replace function internal.before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_email text := pg_catalog.lower(pg_catalog.btrim(event -> 'user' ->> 'email'));
begin
  if v_email is not null and v_email <> ''
    and exists (select 1 from internal.auth_allowlist a where a.email = v_email) then
    return '{}'::jsonb;
  end if;
  return pg_catalog.jsonb_build_object(
    'error', pg_catalog.jsonb_build_object(
      'http_code', 403,
      'message', 'Sign-ups are closed for this app.'
    )
  );
end;
$$;
revoke all on function internal.before_user_created(jsonb) from public, anon, authenticated;
grant execute on function internal.before_user_created(jsonb) to supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- profiles and user_preferences
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text
    check (display_name is null or pg_catalog.char_length(display_name) between 1 and 80),
  base_currency char(3) not null default 'INR' check (base_currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Asia/Kolkata'
    check (pg_catalog.char_length(timezone) between 1 and 64),
  -- 1: JSONB workspace (current). Set by the server-side migration, never by the client.
  data_model_version smallint not null default 1 check (data_model_version between 1 and 100),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
-- Rows are created by the auth.users trigger; users may edit only these columns.
grant update (display_name, base_currency, timezone) on table public.profiles to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function internal.touch_updated_at();

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  reduced_motion boolean not null default false,
  dashboard_layout jsonb not null default '{}'::jsonb
    check (
      pg_catalog.jsonb_typeof(dashboard_layout) = 'object'
      and pg_catalog.octet_length(dashboard_layout::text) <= 16384
    ),
  -- Off by default: nothing is sent to external AI services unless the owner opts in.
  privacy_ai_opt_in boolean not null default false,
  updated_at timestamptz not null default pg_catalog.now()
);

alter table public.user_preferences enable row level security;
alter table public.user_preferences force row level security;
revoke all on table public.user_preferences from public, anon, authenticated;
grant select on table public.user_preferences to authenticated;
grant update (theme, reduced_motion, dashboard_layout, privacy_ai_opt_in)
  on table public.user_preferences to authenticated;

drop policy if exists user_preferences_select_own on public.user_preferences;
create policy user_preferences_select_own on public.user_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists user_preferences_update_own on public.user_preferences;
create policy user_preferences_update_own on public.user_preferences for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop trigger if exists user_preferences_touch_updated_at on public.user_preferences;
create trigger user_preferences_touch_updated_at before update on public.user_preferences
  for each row execute function internal.touch_updated_at();

create or replace function internal.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function internal.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function internal.handle_new_user();

-- Existing accounts get their rows now.
insert into public.profiles (id) select u.id from auth.users u on conflict (id) do nothing;
insert into public.user_preferences (user_id) select u.id from auth.users u
  on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- audit_logs: who did what to which record, never the values
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  -- No foreign key: the history outlives the account and must never be rewritten.
  actor_id uuid,
  action text not null check (action ~ '^[a-z_]+\.[a-z_]+$'),
  entity text not null check (pg_catalog.char_length(entity) between 1 and 64),
  entity_id text check (entity_id is null or pg_catalog.char_length(entity_id) <= 128),
  changed_fields text[] not null default '{}'
    check (pg_catalog.cardinality(changed_fields) <= 64),
  created_at timestamptz not null default pg_catalog.now()
);
create index if not exists audit_logs_actor_created_idx
  on public.audit_logs (actor_id, created_at desc);

alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;
revoke all on table public.audit_logs from public, anon, authenticated;
grant select on table public.audit_logs to authenticated;

drop policy if exists audit_logs_select_own on public.audit_logs;
create policy audit_logs_select_own on public.audit_logs for select to authenticated
  using ((select auth.uid()) = actor_id);

create or replace function internal.reject_audit_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_logs is append-only' using errcode = '42501';
end;
$$;
revoke all on function internal.reject_audit_change() from public, anon, authenticated;

drop trigger if exists audit_logs_append_only on public.audit_logs;
create trigger audit_logs_append_only before update or delete on public.audit_logs
  for each row execute function internal.reject_audit_change();
drop trigger if exists audit_logs_no_truncate on public.audit_logs;
create trigger audit_logs_no_truncate before truncate on public.audit_logs
  for each statement execute function internal.reject_audit_change();

-- Called only from other definer functions; clients cannot write audit entries.
create or replace function internal.log_audit(
  p_action text,
  p_entity text,
  p_entity_id text,
  p_changed_fields text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, changed_fields)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_changed_fields, '{}'));
end;
$$;
revoke all on function internal.log_audit(text, text, text, text[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Workspace RPC: empty search_path, size limit, audit entry; legacy overload dropped
-- ---------------------------------------------------------------------------
drop function if exists public.save_user_workspace(bigint, jsonb, jsonb, jsonb);

create or replace function public.save_user_workspace(
  p_expected_revision bigint,
  p_transactions jsonb,
  p_accounts jsonb,
  p_categories jsonb,
  p_mutual_funds jsonb,
  p_fund_purchases jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_old public.user_workspaces%rowtype;
  v_revision bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if pg_catalog.jsonb_typeof(p_transactions) is distinct from 'array'
    or pg_catalog.jsonb_typeof(p_accounts) is distinct from 'array'
    or pg_catalog.jsonb_typeof(p_categories) is distinct from 'array'
    or pg_catalog.jsonb_typeof(p_mutual_funds) is distinct from 'array'
    or pg_catalog.jsonb_typeof(p_fund_purchases) is distinct from 'array' then
    raise exception 'Workspace collections must be JSON arrays' using errcode = '22023';
  end if;
  if pg_catalog.octet_length(p_transactions::text) + pg_catalog.octet_length(p_accounts::text)
    + pg_catalog.octet_length(p_categories::text) + pg_catalog.octet_length(p_mutual_funds::text)
    + pg_catalog.octet_length(p_fund_purchases::text) > 8388608 then
    raise exception 'Workspace is too large to save' using errcode = '22023';
  end if;

  select * into v_old from public.user_workspaces w
    where w.user_id = v_user_id and w.revision = p_expected_revision
    for update;

  if found then
    update public.user_workspaces
      set transactions = p_transactions,
          accounts = p_accounts,
          categories = p_categories,
          mutual_funds = p_mutual_funds,
          fund_purchases = p_fund_purchases,
          revision = revision + 1,
          updated_at = pg_catalog.now()
      where user_id = v_user_id
      returning revision into v_revision;
    perform internal.log_audit(
      'workspace.save', 'user_workspaces', v_user_id::text,
      pg_catalog.array_remove(array[
        case when v_old.transactions is distinct from p_transactions then 'transactions' end,
        case when v_old.accounts is distinct from p_accounts then 'accounts' end,
        case when v_old.categories is distinct from p_categories then 'categories' end,
        case when v_old.mutual_funds is distinct from p_mutual_funds then 'mutual_funds' end,
        case when v_old.fund_purchases is distinct from p_fund_purchases then 'fund_purchases' end
      ], null)
    );
    return v_revision;
  end if;

  if p_expected_revision = 0 then
    insert into public.user_workspaces (
      user_id, transactions, accounts, categories, mutual_funds, fund_purchases, revision, updated_at
    ) values (
      v_user_id, p_transactions, p_accounts, p_categories, p_mutual_funds, p_fund_purchases, 1,
      pg_catalog.now()
    ) on conflict (user_id) do nothing
    returning revision into v_revision;
    if v_revision is not null then
      perform internal.log_audit('workspace.create', 'user_workspaces', v_user_id::text,
        array['transactions', 'accounts', 'categories', 'mutual_funds', 'fund_purchases']);
    end if;
  end if;

  -- NULL means another session changed or created the row after the caller read it.
  return v_revision;
end;
$$;

revoke all on function public.save_user_workspace(bigint, jsonb, jsonb, jsonb, jsonb, jsonb)
  from public, anon;
grant execute on function public.save_user_workspace(bigint, jsonb, jsonb, jsonb, jsonb, jsonb)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Public portfolio: owner gate, size limit, empty search_path, audit entry
-- ---------------------------------------------------------------------------
create table if not exists internal.portfolio_owners (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default pg_catalog.now()
);
revoke all on table internal.portfolio_owners from public, anon, authenticated;

-- Whoever already publishes the portfolio keeps that right.
insert into internal.portfolio_owners (user_id)
select p.user_id from public.public_portfolios p
on conflict (user_id) do nothing;

create or replace function public.save_public_portfolio(
  p_expected_revision bigint,
  p_slug text,
  p_profile jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_revision bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from internal.portfolio_owners o where o.user_id = v_user_id) then
    raise exception 'This account cannot publish the portfolio' using errcode = '42501';
  end if;
  if pg_catalog.jsonb_typeof(p_profile) is distinct from 'object' then
    raise exception 'Portfolio profile must be a JSON object' using errcode = '22023';
  end if;
  if pg_catalog.octet_length(p_profile::text) > 262144 then
    raise exception 'Portfolio profile is too large' using errcode = '22023';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9][a-z0-9-]{1,48}$' then
    raise exception 'Invalid public portfolio slug' using errcode = '22023';
  end if;

  update public.public_portfolios
    set slug = p_slug,
        profile = p_profile,
        is_published = true,
        revision = revision + 1,
        updated_at = pg_catalog.now()
    where user_id = v_user_id and revision = p_expected_revision
    returning revision into v_revision;

  if v_revision is null and p_expected_revision = 0 then
    insert into public.public_portfolios (user_id, slug, profile, is_published, revision, updated_at)
      values (v_user_id, p_slug, p_profile, true, 1, pg_catalog.now())
      on conflict (user_id) do nothing
      returning revision into v_revision;
  end if;

  if v_revision is not null then
    perform internal.log_audit('portfolio.save', 'public_portfolios', v_user_id::text,
      array['slug', 'profile']);
  end if;
  return v_revision;
end;
$$;

revoke all on function public.save_public_portfolio(bigint, text, jsonb) from public, anon;
grant execute on function public.save_public_portfolio(bigint, text, jsonb) to authenticated;
