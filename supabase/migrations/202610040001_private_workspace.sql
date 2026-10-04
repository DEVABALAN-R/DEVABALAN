-- Private per-user workspace storage. Apply this migration in the Supabase SQL Editor.
-- The app stores its current typed workspace payload as JSONB to preserve existing
-- UI behavior while moving all private data behind authenticated RLS.
create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  transactions jsonb not null default '[]'::jsonb check (jsonb_typeof(transactions) = 'array'),
  accounts jsonb not null default '[]'::jsonb check (jsonb_typeof(accounts) = 'array'),
  categories jsonb not null default '[]'::jsonb check (jsonb_typeof(categories) = 'array'),
  portfolio jsonb not null default '{}'::jsonb check (jsonb_typeof(portfolio) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.user_workspaces enable row level security;
alter table public.user_workspaces force row level security;

revoke all on table public.user_workspaces from public, anon, authenticated;
grant select, insert, update, delete on table public.user_workspaces to authenticated;

drop policy if exists "workspace_select_own" on public.user_workspaces;
create policy "workspace_select_own"
  on public.user_workspaces for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "workspace_insert_own" on public.user_workspaces;
create policy "workspace_insert_own"
  on public.user_workspaces for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "workspace_update_own" on public.user_workspaces;
create policy "workspace_update_own"
  on public.user_workspaces for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "workspace_delete_own" on public.user_workspaces;
create policy "workspace_delete_own"
  on public.user_workspaces for delete to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists user_workspaces_updated_at_idx
  on public.user_workspaces (updated_at desc);
