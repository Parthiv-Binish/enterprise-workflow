-- Core RLS policies to prevent 403s in the frontend.
-- If you already have these tables, this migration is safe to run (IF EXISTS / IF NOT EXISTS).

-- ---------------------------------------------------------------------------
-- Helper: is_admin(uid) based on profiles.role
-- ---------------------------------------------------------------------------
create or replace function public.is_admin(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_uid
      and p.role in ('admin', 'super_admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles: allow admins to read all profiles (Users page).
-- NOTE: update remains self-only (per previous migration).
-- ---------------------------------------------------------------------------
alter table if exists public.profiles enable row level security;

drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- teams: allow authenticated users to read active teams and create teams.
-- Updates/deletes restricted to creator, team manager, or admin.
-- ---------------------------------------------------------------------------
alter table if exists public.teams enable row level security;

drop policy if exists "teams_select_active" on public.teams;
create policy "teams_select_active"
  on public.teams
  for select
  to authenticated
  using (is_active = true);

drop policy if exists "teams_insert_authenticated" on public.teams;
create policy "teams_insert_authenticated"
  on public.teams
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    or created_by is null
  );

drop policy if exists "teams_update_owner_manager_admin" on public.teams;
create policy "teams_update_owner_manager_admin"
  on public.teams
  for update
  to authenticated
  using (
    public.is_admin(auth.uid())
    or created_by = auth.uid()
    or manager_id = auth.uid()
  )
  with check (
    public.is_admin(auth.uid())
    or created_by = auth.uid()
    or manager_id = auth.uid()
  );

-- soft-delete via is_active (teams.service.ts uses update is_active=false)
drop policy if exists "teams_delete_owner_manager_admin" on public.teams;
create policy "teams_delete_owner_manager_admin"
  on public.teams
  for delete
  to authenticated
  using (
    public.is_admin(auth.uid())
    or created_by = auth.uid()
    or manager_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- team_members: team managers/admins can manage members; users can read their
-- own membership rows.
-- ---------------------------------------------------------------------------
alter table if exists public.team_members enable row level security;

drop policy if exists "team_members_select_self_or_team_admin" on public.team_members;
create policy "team_members_select_self_or_team_admin"
  on public.team_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teams t
      where t.id = team_id
        and (t.manager_id = auth.uid() or t.created_by = auth.uid())
    )
  );

drop policy if exists "team_members_insert_team_admin" on public.team_members;
create policy "team_members_insert_team_admin"
  on public.team_members
  for insert
  to authenticated
  with check (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teams t
      where t.id = team_id
        and (t.manager_id = auth.uid() or t.created_by = auth.uid())
    )
  );

drop policy if exists "team_members_update_team_admin" on public.team_members;
create policy "team_members_update_team_admin"
  on public.team_members
  for update
  to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teams t
      where t.id = team_id
        and (t.manager_id = auth.uid() or t.created_by = auth.uid())
    )
  )
  with check (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teams t
      where t.id = team_id
        and (t.manager_id = auth.uid() or t.created_by = auth.uid())
    )
  );

drop policy if exists "team_members_delete_team_admin" on public.team_members;
create policy "team_members_delete_team_admin"
  on public.team_members
  for delete
  to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teams t
      where t.id = team_id
        and (t.manager_id = auth.uid() or t.created_by = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- departments: read for all authenticated; write for admins.
-- ---------------------------------------------------------------------------
alter table if exists public.departments enable row level security;

drop policy if exists "departments_select_all" on public.departments;
create policy "departments_select_all"
  on public.departments
  for select
  to authenticated
  using (true);

drop policy if exists "departments_write_admin" on public.departments;
create policy "departments_write_admin"
  on public.departments
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- notifications: user can read/update their own notifications.
-- ---------------------------------------------------------------------------
alter table if exists public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- audit_logs: admin read-only (writes should be done server-side).
-- ---------------------------------------------------------------------------
alter table if exists public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

