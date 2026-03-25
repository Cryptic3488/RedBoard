-- F-05b Wellness Scheduler
-- Table: wellness_schedule
-- One row per scheduled date, linking a form template to a calendar date.
-- The admin UI writes to this table; the app auto-activates the correct form
-- when the day arrives (client-side check on page load).

create table if not exists public.wellness_schedule (
  id             uuid        primary key default gen_random_uuid(),
  form_id        uuid        not null references public.wellness_forms(id) on delete cascade,
  scheduled_date date        not null,
  created_by     uuid        not null references public.profiles(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (scheduled_date)
);

alter table public.wellness_schedule enable row level security;

create policy "admins manage wellness_schedule"
  on public.wellness_schedule for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

create index if not exists wellness_schedule_date_idx
  on public.wellness_schedule(scheduled_date);
