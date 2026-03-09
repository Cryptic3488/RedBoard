-- Migration: F-01 – profiles table + RLS
-- Run this in Supabase SQL Editor or via `supabase db push`

-- ─────────────────────────────────────────────
-- 1. profiles table
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  role        text        not null check (role in ('admin', 'player')) default 'player',
  name        text        not null default '',
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. Enable RLS (default-deny)
-- ─────────────────────────────────────────────
alter table public.profiles enable row level security;

-- ─────────────────────────────────────────────
-- 3. RLS Policies
-- ─────────────────────────────────────────────

-- Any authenticated user can read their own profile.
create policy "profiles: select own"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Admins can read ALL profiles (needed to look up player lists).
create policy "profiles: admins select all"
  on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Users can insert their own profile row (called from trigger below).
-- Insertion is locked to the user's own id.
create policy "profiles: insert own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Users can update only their own non-role fields.
-- Role changes must go through service-role (admin panel / migration).
create policy "profiles: update own name"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- No direct delete through client.

-- ─────────────────────────────────────────────
-- 4. Auto-create profile on signup (trigger)
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'player'),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
