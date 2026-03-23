-- F-09 Playbook
-- Tables: playbook_folders, playbook_files
-- Storage bucket: "playbook" (create manually in Supabase Dashboard — private)
--   Bucket policies needed:
--     1. Admins can upload   (INSERT) — authenticated, get_my_role() = 'admin'
--     2. Admins can delete   (DELETE) — authenticated, get_my_role() = 'admin'
--     3. All players can read (SELECT) — authenticated

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table if not exists public.playbook_folders (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null check (char_length(name) between 1 and 80),
  sort_order  int         not null default 0,
  created_by  uuid        not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.playbook_files (
  id           uuid        primary key default gen_random_uuid(),
  folder_id    uuid        not null references public.playbook_folders(id) on delete cascade,
  name         text        not null check (char_length(name) between 1 and 120),
  storage_path text        not null,
  mime_type    text        not null default 'image/jpeg',
  sort_order   int         not null default 0,
  created_by   uuid        not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.playbook_folders enable row level security;
alter table public.playbook_files   enable row level security;

-- Admins: full access
create policy "admins manage playbook_folders"
  on public.playbook_folders for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

create policy "admins manage playbook_files"
  on public.playbook_files for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- Players: read only
create policy "players read playbook_folders"
  on public.playbook_folders for select
  using (get_my_role() = 'player');

create policy "players read playbook_files"
  on public.playbook_files for select
  using (get_my_role() = 'player');

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists playbook_files_folder_idx
  on public.playbook_files(folder_id, sort_order);

create index if not exists playbook_folders_sort_idx
  on public.playbook_folders(sort_order, created_at);
