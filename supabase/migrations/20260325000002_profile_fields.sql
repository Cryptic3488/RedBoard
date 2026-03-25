-- Player profile fields: avatar, jersey number, position, class year

alter table public.profiles
  add column if not exists avatar_url    text,
  add column if not exists jersey_number smallint check (jersey_number between 1 and 99),
  add column if not exists position      text check (position in ('Guard', 'Forward', 'Center')),
  add column if not exists class_year    text check (class_year in ('Fr', 'So', 'Jr', 'Sr'));

-- Allow players to update their own profile fields.
-- WITH CHECK ensures role cannot be escalated via this policy.
create policy "players update own profile"
  on public.profiles for update
  using  (auth.uid() = id and get_my_role() = 'player')
  with check (auth.uid() = id and role = 'player');
