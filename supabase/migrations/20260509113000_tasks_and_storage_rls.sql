-- RLS policies for tasks + related tables + storage bucket.
-- Fixes: 403 / 42501 "new row violates row-level security policy" for tasks flows.

-- ---------------------------------------------------------------------------
-- profiles: allow authenticated to read active profiles (needed for joins + dropdowns)
-- If you need stricter privacy, replace this with a limited "directory" view + RLS.
-- ---------------------------------------------------------------------------
alter table if exists public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated_active" on public.profiles;
create policy "profiles_select_authenticated_active"
  on public.profiles
  for select
  to authenticated
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- Helper: team-admin check
-- ---------------------------------------------------------------------------
create or replace function public.is_team_admin(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teams t
      where t.id = p_team_id
        and t.is_active = true
        and (t.manager_id = auth.uid() or t.created_by = auth.uid())
    );
$$;

-- ---------------------------------------------------------------------------
-- team_members: allow reading members for active teams (fix member counts),
-- but keep write access restricted to team admins.
-- ---------------------------------------------------------------------------
alter table if exists public.team_members enable row level security;

drop policy if exists "team_members_select_self_or_team_admin" on public.team_members;
drop policy if exists "team_members_select_active_teams" on public.team_members;
create policy "team_members_select_active_teams"
  on public.team_members
  for select
  to authenticated
  using (
    public.is_admin(auth.uid())
    or user_id = auth.uid()
    or exists (
      select 1
      from public.teams t
      where t.id = team_id
        and t.is_active = true
    )
  );

drop policy if exists "team_members_insert_team_admin" on public.team_members;
create policy "team_members_insert_team_admin"
  on public.team_members
  for insert
  to authenticated
  with check (public.is_team_admin(team_id));

drop policy if exists "team_members_update_team_admin" on public.team_members;
create policy "team_members_update_team_admin"
  on public.team_members
  for update
  to authenticated
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

drop policy if exists "team_members_delete_team_admin" on public.team_members;
create policy "team_members_delete_team_admin"
  on public.team_members
  for delete
  to authenticated
  using (public.is_team_admin(team_id));

-- ---------------------------------------------------------------------------
-- Helper: can_access_task(task_id) as boolean
-- ---------------------------------------------------------------------------
create or replace function public.can_access_task(task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = task_id
      and t.is_archived = false
      and (
        public.is_admin(auth.uid())
        or t.created_by = auth.uid()
        or t.reporter_id = auth.uid()
        or t.assignee_id = auth.uid()
        or (
          t.team_id is not null
          and (
            public.is_team_admin(t.team_id)
            or exists (
              select 1 from public.team_members tm
              where tm.team_id = t.team_id and tm.user_id = auth.uid()
            )
          )
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
alter table if exists public.tasks enable row level security;

drop policy if exists "tasks_select_accessible" on public.tasks;
create policy "tasks_select_accessible"
  on public.tasks
  for select
  to authenticated
  using (public.can_access_task(id));

drop policy if exists "tasks_insert_creator" on public.tasks;
create policy "tasks_insert_creator"
  on public.tasks
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and reporter_id = auth.uid()
  );

drop policy if exists "tasks_update_accessible" on public.tasks;
create policy "tasks_update_accessible"
  on public.tasks
  for update
  to authenticated
  using (public.can_access_task(id))
  with check (public.can_access_task(id));

drop policy if exists "tasks_delete_admin_or_creator" on public.tasks;
create policy "tasks_delete_admin_or_creator"
  on public.tasks
  for delete
  to authenticated
  using (
    public.is_admin(auth.uid())
    or created_by = auth.uid()
    or reporter_id = auth.uid()
    or (team_id is not null and public.is_team_admin(team_id))
  );

-- ---------------------------------------------------------------------------
-- task_comments
-- ---------------------------------------------------------------------------
alter table if exists public.task_comments enable row level security;

drop policy if exists "task_comments_select_task_access" on public.task_comments;
create policy "task_comments_select_task_access"
  on public.task_comments
  for select
  to authenticated
  using (public.can_access_task(task_id));

drop policy if exists "task_comments_insert_own" on public.task_comments;
create policy "task_comments_insert_own"
  on public.task_comments
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.can_access_task(task_id)
  );

drop policy if exists "task_comments_update_own_or_team_admin" on public.task_comments;
create policy "task_comments_update_own_or_team_admin"
  on public.task_comments
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.team_id is not null
        and public.is_team_admin(t.team_id)
    )
    or public.is_admin(auth.uid())
  )
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.team_id is not null
        and public.is_team_admin(t.team_id)
    )
    or public.is_admin(auth.uid())
  );

drop policy if exists "task_comments_delete_own_or_team_admin" on public.task_comments;
create policy "task_comments_delete_own_or_team_admin"
  on public.task_comments
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.team_id is not null
        and public.is_team_admin(t.team_id)
    )
    or public.is_admin(auth.uid())
  );

-- ---------------------------------------------------------------------------
-- task_checklists
-- ---------------------------------------------------------------------------
alter table if exists public.task_checklists enable row level security;

drop policy if exists "task_checklists_select_task_access" on public.task_checklists;
create policy "task_checklists_select_task_access"
  on public.task_checklists
  for select
  to authenticated
  using (public.can_access_task(task_id));

drop policy if exists "task_checklists_insert_own" on public.task_checklists;
create policy "task_checklists_insert_own"
  on public.task_checklists
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.can_access_task(task_id)
  );

drop policy if exists "task_checklists_update_task_access" on public.task_checklists;
create policy "task_checklists_update_task_access"
  on public.task_checklists
  for update
  to authenticated
  using (public.can_access_task(task_id))
  with check (public.can_access_task(task_id));

drop policy if exists "task_checklists_delete_team_admin" on public.task_checklists;
create policy "task_checklists_delete_team_admin"
  on public.task_checklists
  for delete
  to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.team_id is not null
        and public.is_team_admin(t.team_id)
    )
  );

-- ---------------------------------------------------------------------------
-- task_watchers
-- ---------------------------------------------------------------------------
alter table if exists public.task_watchers enable row level security;

drop policy if exists "task_watchers_select_task_access" on public.task_watchers;
create policy "task_watchers_select_task_access"
  on public.task_watchers
  for select
  to authenticated
  using (public.can_access_task(task_id));

drop policy if exists "task_watchers_insert_own" on public.task_watchers;
create policy "task_watchers_insert_own"
  on public.task_watchers
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.can_access_task(task_id)
  );

drop policy if exists "task_watchers_delete_own" on public.task_watchers;
create policy "task_watchers_delete_own"
  on public.task_watchers
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- approvals
-- ---------------------------------------------------------------------------
alter table if exists public.approvals enable row level security;

drop policy if exists "approvals_select_task_access" on public.approvals;
create policy "approvals_select_task_access"
  on public.approvals
  for select
  to authenticated
  using (public.can_access_task(task_id));

drop policy if exists "approvals_insert_requester" on public.approvals;
create policy "approvals_insert_requester"
  on public.approvals
  for insert
  to authenticated
  with check (
    requested_by = auth.uid()
    and public.can_access_task(task_id)
  );

drop policy if exists "approvals_update_approver_or_team_admin" on public.approvals;
create policy "approvals_update_approver_or_team_admin"
  on public.approvals
  for update
  to authenticated
  using (
    approver_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.team_id is not null
        and public.is_team_admin(t.team_id)
    )
  )
  with check (
    approver_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.team_id is not null
        and public.is_team_admin(t.team_id)
    )
  );

-- ---------------------------------------------------------------------------
-- task_attachments (metadata table)
-- ---------------------------------------------------------------------------
alter table if exists public.task_attachments enable row level security;

drop policy if exists "task_attachments_select_task_access" on public.task_attachments;
create policy "task_attachments_select_task_access"
  on public.task_attachments
  for select
  to authenticated
  using (public.can_access_task(task_id));

drop policy if exists "task_attachments_insert_own" on public.task_attachments;
create policy "task_attachments_insert_own"
  on public.task_attachments
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.can_access_task(task_id)
  );

drop policy if exists "task_attachments_delete_own_or_team_admin" on public.task_attachments;
create policy "task_attachments_delete_own_or_team_admin"
  on public.task_attachments
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.team_id is not null
        and public.is_team_admin(t.team_id)
    )
  );

-- ---------------------------------------------------------------------------
-- task_labels + mapping
-- ---------------------------------------------------------------------------
alter table if exists public.task_labels enable row level security;
alter table if exists public.task_label_mapping enable row level security;

drop policy if exists "task_labels_select_all" on public.task_labels;
create policy "task_labels_select_all"
  on public.task_labels
  for select
  to authenticated
  using (true);

drop policy if exists "task_label_mapping_select_task_access" on public.task_label_mapping;
create policy "task_label_mapping_select_task_access"
  on public.task_label_mapping
  for select
  to authenticated
  using (public.can_access_task(task_id));

drop policy if exists "task_label_mapping_write_task_access" on public.task_label_mapping;
create policy "task_label_mapping_write_task_access"
  on public.task_label_mapping
  for all
  to authenticated
  using (public.can_access_task(task_id))
  with check (public.can_access_task(task_id));

-- ---------------------------------------------------------------------------
-- task_activity_logs
-- ---------------------------------------------------------------------------
alter table if exists public.task_activity_logs enable row level security;

drop policy if exists "task_activity_logs_select_task_access" on public.task_activity_logs;
create policy "task_activity_logs_select_task_access"
  on public.task_activity_logs
  for select
  to authenticated
  using (public.can_access_task(task_id));

drop policy if exists "task_activity_logs_insert_own" on public.task_activity_logs;
create policy "task_activity_logs_insert_own"
  on public.task_activity_logs
  for insert
  to authenticated
  with check (
    (user_id is null or user_id = auth.uid())
    and public.can_access_task(task_id)
  );

-- ---------------------------------------------------------------------------
-- Storage bucket policies (attachments)
-- This is the storage.objects table (Supabase Storage).
-- ---------------------------------------------------------------------------
alter table if exists storage.objects enable row level security;

drop policy if exists "attachments_read_own" on storage.objects;
create policy "attachments_read_own"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'attachments' and owner = auth.uid());

drop policy if exists "attachments_insert_own" on storage.objects;
create policy "attachments_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'attachments' and owner = auth.uid());

drop policy if exists "attachments_delete_own" on storage.objects;
create policy "attachments_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'attachments' and owner = auth.uid());

