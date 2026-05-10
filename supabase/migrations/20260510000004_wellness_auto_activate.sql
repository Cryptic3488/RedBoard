-- Phase 4: Server-side wellness auto-activation via pg_cron.
--
-- PREREQUISITE: Enable the pg_cron extension in the Supabase Dashboard before
-- running this migration.
--   Dashboard → Database → Extensions → search "pg_cron" → Enable
--
-- The auto_activate_wellness() function replaces the client-side useEffect in
-- AdminWellness.tsx. It runs at midnight UTC every day, looks up today's
-- scheduled form, and flips is_active accordingly — regardless of whether
-- the admin has the app open.

-- ── Auto-activate function ────────────────────────────────────────────────────

create or replace function public.auto_activate_wellness()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  scheduled_form_id uuid;
begin
  -- Find today's scheduled form (wellness_schedule has UNIQUE(scheduled_date))
  select form_id into scheduled_form_id
  from public.wellness_schedule
  where scheduled_date = current_date;

  if scheduled_form_id is not null then
    -- Deactivate any currently active form
    update public.wellness_forms
    set is_active = false
    where is_active = true;

    -- Activate the form scheduled for today
    update public.wellness_forms
    set is_active = true
    where id = scheduled_form_id;
  end if;
end;
$$;

-- ── pg_cron job ───────────────────────────────────────────────────────────────
-- Unschedule first so the migration is idempotent.

do $$
begin
  perform cron.unschedule('wellness-auto-activate');
exception when others then null;
end;
$$;

-- Run at 00:00 UTC every day.
-- To adjust for US Eastern time (UTC-5/UTC-4), change to '0 5 * * *' (EST)
-- or '0 4 * * *' (EDT). Confirm with the coach which timezone makes sense.
select cron.schedule(
  'wellness-auto-activate',
  '0 0 * * *',
  $$select public.auto_activate_wellness()$$
);
