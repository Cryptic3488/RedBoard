-- Add is_published flag to stat_uploads (default false = unpublished)
alter table public.stat_uploads
  add column is_published boolean not null default false;

-- ─── Update stat_uploads player policy ────────────────────────────────────────
-- Players may only see published uploads (admins see all, unchanged)

drop policy "players select all stat_uploads" on public.stat_uploads;

create policy "players select published stat_uploads"
  on public.stat_uploads for select
  using (get_my_role() = 'player' and is_published = true);

-- ─── Update stat_entries player policy ────────────────────────────────────────
-- Players may only see entries whose upload is published

drop policy "players select own stat_entries" on public.stat_entries;

create policy "players select own published stat_entries"
  on public.stat_entries for select
  using (
    player_id = auth.uid() and
    exists (
      select 1 from public.stat_uploads
      where id = stat_entries.upload_id
        and is_published = true
    )
  );
