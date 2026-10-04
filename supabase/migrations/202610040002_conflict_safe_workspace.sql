-- Conflict-safe workspace writes and a shared public portfolio source.
-- Apply after 202610040001_private_workspace.sql.

alter table public.user_workspaces
  add column if not exists revision bigint not null default 0;

-- The owner can read their own workspace directly, but all writes must use the
-- compare-and-swap RPC so a stale browser cannot silently replace newer data.
revoke insert, update, delete on table public.user_workspaces from authenticated;
grant select on table public.user_workspaces to authenticated;

create or replace function public.save_user_workspace(
  p_expected_revision bigint,
  p_transactions jsonb,
  p_accounts jsonb,
  p_categories jsonb
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_revision bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if jsonb_typeof(p_transactions) <> 'array'
    or jsonb_typeof(p_accounts) <> 'array'
    or jsonb_typeof(p_categories) <> 'array' then
    raise exception 'Workspace collections must be JSON arrays';
  end if;

  update public.user_workspaces
    set transactions = p_transactions,
        accounts = p_accounts,
        categories = p_categories,
        revision = revision + 1,
        updated_at = now()
    where user_id = v_user_id and revision = p_expected_revision
    returning revision into v_revision;

  if v_revision is not null then
    return v_revision;
  end if;

  if p_expected_revision = 0 then
    insert into public.user_workspaces (user_id, transactions, accounts, categories, revision, updated_at)
      values (v_user_id, p_transactions, p_accounts, p_categories, 1, now())
      on conflict (user_id) do nothing
      returning revision into v_revision;
  end if;

  -- NULL means another session changed or created the row after the caller read it.
  return v_revision;
end;
$$;

revoke all on function public.save_user_workspace(bigint, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_user_workspace(bigint, jsonb, jsonb, jsonb) to authenticated;

create table if not exists public.public_portfolios (
  user_id uuid primary key references auth.users (id) on delete cascade,
  slug text not null unique,
  profile jsonb not null default '{}'::jsonb check (jsonb_typeof(profile) = 'object'),
  is_published boolean not null default true,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.public_portfolios enable row level security;
alter table public.public_portfolios force row level security;

revoke all on table public.public_portfolios from public, anon, authenticated;
grant select on table public.public_portfolios to anon, authenticated;

drop policy if exists "public_portfolios_read_published" on public.public_portfolios;
create policy "public_portfolios_read_published"
  on public.public_portfolios for select to anon, authenticated
  using (is_published or (select auth.uid()) = user_id);

create or replace function public.save_public_portfolio(
  p_expected_revision bigint,
  p_slug text,
  p_profile jsonb
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_revision bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if jsonb_typeof(p_profile) <> 'object' then
    raise exception 'Portfolio profile must be a JSON object';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9][a-z0-9-]{1,48}$' then
    raise exception 'Invalid public portfolio slug';
  end if;

  update public.public_portfolios
    set slug = p_slug,
        profile = p_profile,
        is_published = true,
        revision = revision + 1,
        updated_at = now()
    where user_id = v_user_id and revision = p_expected_revision
    returning revision into v_revision;

  if v_revision is not null then
    return v_revision;
  end if;

  if p_expected_revision = 0 then
    insert into public.public_portfolios (user_id, slug, profile, is_published, revision, updated_at)
      values (v_user_id, p_slug, p_profile, true, 1, now())
      on conflict (user_id) do nothing
      returning revision into v_revision;
  end if;

  return v_revision;
end;
$$;

revoke all on function public.save_public_portfolio(bigint, text, jsonb) from public, anon;
grant execute on function public.save_public_portfolio(bigint, text, jsonb) to authenticated;

-- Preserve the current public CV data as the initial shared profile.
insert into public.public_portfolios (user_id, slug, profile, is_published, revision)
select user_id, 'devabalan', portfolio, true, 1
from public.user_workspaces
where portfolio <> '{}'::jsonb
on conflict (user_id) do nothing;
