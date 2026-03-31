-- Allow admins to update stat_uploads (e.g. toggling is_published)
create policy "admins update stat_uploads"
  on public.stat_uploads for update
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');
