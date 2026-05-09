-- Fix: Auth signup returns "Database error saving new user"
-- Run this in Supabase Dashboard → SQL Editor (entire file), then try signup again.
--
-- Cause: A trigger on auth.users inserts into public.profiles and that INSERT fails
-- (missing table/columns, NOT NULL without default, bad FK name, etc.).

-- ---------------------------------------------------------------------------
-- 1) profiles — aligned with src/types/database.ts Profile
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  avatar_url text,
  role text not null default 'employee',
  department_id uuid,
  job_title text,
  phone text,
  timezone text not null default 'UTC',
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint profiles_role_check check (
    role = any (
      array[
        'super_admin'::text,
        'admin'::text,
        'team_manager'::text,
        'employee'::text,
        'viewer'::text
      ]
    )
  )
);

-- Help older tables that predate some columns (safe no-ops if already present)
alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists role text,
  add column if not exists department_id uuid,
  add column if not exists job_title text,
  add column if not exists phone text,
  add column if not exists timezone text,
  add column if not exists is_active boolean,
  add column if not exists last_seen_at timestamptz,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

-- Reasonable defaults if columns were added nullable
alter table public.profiles alter column email set default '';
alter table public.profiles alter column full_name set default '';
alter table public.profiles alter column role set default 'employee';
alter table public.profiles alter column timezone set default 'UTC';
alter table public.profiles alter column is_active set default true;
alter table public.profiles alter column created_at set default timezone('utc'::text, now());
alter table public.profiles alter column updated_at set default timezone('utc'::text, now());

-- ---------------------------------------------------------------------------
-- 2) Trigger: one row per auth user (SECURITY DEFINER bypasses RLS on insert)
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'User'
  );

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    timezone,
    is_active,
    updated_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    v_name,
    'employee',
    'UTC',
    true,
    timezone('utc'::text, now())
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3) RLS — users can read/update their own profile (trigger insert still works)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
