-- Phase 1: Admin can update any player's profile fields
-- Without this policy, admins can only read profiles — they cannot set
-- player names, positions, jersey numbers, or class years from the client.

create policy "profiles: admins update any"
  on public.profiles
  for update
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');
