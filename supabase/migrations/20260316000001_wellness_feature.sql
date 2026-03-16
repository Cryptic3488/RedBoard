-- F-05 Wellness Checks
-- Tables: wellness_forms, wellness_responses

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table if not exists public.wellness_forms (
  id         uuid        primary key default gen_random_uuid(),
  title      text        not null check (char_length(title) between 1 and 120),
  questions  jsonb       not null default '[]',
  is_active  boolean     not null default false,
  created_by uuid        not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.wellness_responses (
  id           uuid        primary key default gen_random_uuid(),
  form_id      uuid        not null references public.wellness_forms(id) on delete cascade,
  player_id    uuid        not null references public.profiles(id) on delete cascade,
  date         date        not null default current_date,
  answers      jsonb       not null default '{}',
  submitted_at timestamptz not null default now(),
  unique (form_id, player_id, date)
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.wellness_forms     enable row level security;
alter table public.wellness_responses enable row level security;

-- wellness_forms
create policy "admins manage wellness_forms"
  on public.wellness_forms for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

create policy "players select active wellness_forms"
  on public.wellness_forms for select
  using (get_my_role() = 'player' and is_active = true);

-- wellness_responses
create policy "players insert own wellness_responses"
  on public.wellness_responses for insert
  with check (player_id = auth.uid());

create policy "players select own wellness_responses"
  on public.wellness_responses for select
  using (player_id = auth.uid());

create policy "admins select all wellness_responses"
  on public.wellness_responses for select
  using (get_my_role() = 'admin');

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists wellness_responses_player_idx
  on public.wellness_responses(player_id);

create index if not exists wellness_responses_form_date_idx
  on public.wellness_responses(form_id, date desc);
