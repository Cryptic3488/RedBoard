-- F-03/F-04 Stats Feature
-- Tables: stat_uploads, stat_entries, stat_annotations, stat_goals

-- ─── Create all tables first ──────────────────────────────────────────────────

create table if not exists public.stat_uploads (
  id           uuid        primary key default gen_random_uuid(),
  created_by   uuid        not null references public.profiles(id) on delete cascade,
  label        text        not null check (char_length(label) between 1 and 120),
  session_type text        not null check (session_type in ('game', 'practice')),
  session_date date        not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.stat_entries (
  id              uuid    primary key default gen_random_uuid(),
  upload_id       uuid    not null references public.stat_uploads(id)  on delete cascade,
  player_id       uuid    not null references public.profiles(id)       on delete cascade,
  -- Standard NCAA D3 stats (all nullable)
  minutes         numeric,
  points          numeric,
  fg_made         numeric,
  fg_attempted    numeric,
  three_made      numeric,
  three_attempted numeric,
  ft_made         numeric,
  ft_attempted    numeric,
  off_reb         numeric,
  def_reb         numeric,
  total_reb       numeric,
  assists         numeric,
  steals          numeric,
  blocks          numeric,
  turnovers       numeric,
  fouls           numeric,
  -- Custom / coach-defined columns
  custom          jsonb   not null default '{}',
  created_at      timestamptz not null default now(),
  unique (upload_id, player_id)
);

create table if not exists public.stat_annotations (
  id          uuid        primary key default gen_random_uuid(),
  upload_id   uuid        not null references public.stat_uploads(id)  on delete cascade,
  player_id   uuid        not null references public.profiles(id)       on delete cascade,
  note        text        not null check (char_length(note) between 1 and 1000),
  created_by  uuid        not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique (upload_id, player_id)
);

create table if not exists public.stat_goals (
  id          uuid        primary key default gen_random_uuid(),
  player_id   uuid        not null references public.profiles(id) on delete cascade,
  stat_key    text        not null check (char_length(stat_key) between 1 and 60),
  target      numeric     not null,
  created_by  uuid        not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique (player_id, stat_key)
);

-- ─── Enable RLS ───────────────────────────────────────────────────────────────

alter table public.stat_uploads    enable row level security;
alter table public.stat_entries    enable row level security;
alter table public.stat_annotations enable row level security;
alter table public.stat_goals      enable row level security;

-- ─── stat_uploads policies ────────────────────────────────────────────────────

create policy "admins select all stat_uploads"
  on public.stat_uploads for select
  using (get_my_role() = 'admin');

create policy "players select all stat_uploads"
  on public.stat_uploads for select
  using (get_my_role() = 'player');

create policy "admins insert stat_uploads"
  on public.stat_uploads for insert
  with check (get_my_role() = 'admin');

create policy "admins delete stat_uploads"
  on public.stat_uploads for delete
  using (get_my_role() = 'admin');

-- ─── stat_entries policies ────────────────────────────────────────────────────

create policy "admins select all stat_entries"
  on public.stat_entries for select
  using (get_my_role() = 'admin');

create policy "players select own stat_entries"
  on public.stat_entries for select
  using (player_id = auth.uid());

create policy "admins insert stat_entries"
  on public.stat_entries for insert
  with check (get_my_role() = 'admin');

create policy "admins delete stat_entries"
  on public.stat_entries for delete
  using (get_my_role() = 'admin');

-- ─── stat_annotations policies ────────────────────────────────────────────────

create policy "admins select all stat_annotations"
  on public.stat_annotations for select
  using (get_my_role() = 'admin');

create policy "players select own stat_annotations"
  on public.stat_annotations for select
  using (player_id = auth.uid());

create policy "admins insert stat_annotations"
  on public.stat_annotations for insert
  with check (get_my_role() = 'admin');

create policy "admins update stat_annotations"
  on public.stat_annotations for update
  using (get_my_role() = 'admin');

create policy "admins delete stat_annotations"
  on public.stat_annotations for delete
  using (get_my_role() = 'admin');

-- ─── stat_goals policies ──────────────────────────────────────────────────────

create policy "admins select all stat_goals"
  on public.stat_goals for select
  using (get_my_role() = 'admin');

create policy "players select own stat_goals"
  on public.stat_goals for select
  using (player_id = auth.uid());

create policy "admins insert stat_goals"
  on public.stat_goals for insert
  with check (get_my_role() = 'admin');

create policy "admins update stat_goals"
  on public.stat_goals for update
  using (get_my_role() = 'admin');

create policy "admins delete stat_goals"
  on public.stat_goals for delete
  using (get_my_role() = 'admin');

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists stat_uploads_session_date_idx
  on public.stat_uploads(session_date desc);

create index if not exists stat_entries_player_idx
  on public.stat_entries(player_id);

create index if not exists stat_entries_upload_idx
  on public.stat_entries(upload_id);

create index if not exists stat_annotations_player_idx
  on public.stat_annotations(player_id);

create index if not exists stat_goals_player_idx
  on public.stat_goals(player_id);
