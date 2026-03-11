-- F-02 bugfix: allow any authenticated user to read all profiles
-- This is needed so player queries that join profiles (e.g. film post creator names)
-- can resolve the coach's profile row, which was previously blocked by RLS.

create policy "profiles: authenticated users select all"
  on public.profiles
  for select
  using (auth.role() = 'authenticated');
