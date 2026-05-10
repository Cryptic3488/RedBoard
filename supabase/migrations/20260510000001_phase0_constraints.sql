-- Phase 0-A: Foundation constraint fixes
-- Adds missing UNIQUE constraints that application code already assumes exist.
-- Safe to run on a fresh project. If duplicate rows already exist from development
-- testing, the deduplication CTEs below remove the older duplicates first.

-- ── 1. wellness_responses: prevent duplicate daily submissions ────────────────
-- The app already blocks re-submission in useWellnessCheck, but without this
-- constraint a network retry or concurrent request can write duplicate rows.

-- Remove any duplicate (form_id, player_id, date) rows that exist from dev testing,
-- keeping the most recently submitted one.
delete from public.wellness_responses
where id in (
  select id from (
    select
      id,
      row_number() over (
        partition by form_id, player_id, date
        order by submitted_at desc
      ) as rn
    from public.wellness_responses
  ) ranked
  where rn > 1
);

alter table public.wellness_responses
  add constraint wellness_responses_unique_submission
  unique (form_id, player_id, date);

-- ── 2. stat_goals: one goal per player per stat key ──────────────────────────
-- Admin Stats page uses .upsert(..., { onConflict: 'player_id,stat_key' }).
-- Without a UNIQUE constraint this upsert silently inserts duplicates instead
-- of updating the existing goal.

-- Remove older duplicates, keeping the most recent goal per player+stat.
delete from public.stat_goals
where id in (
  select id from (
    select
      id,
      row_number() over (
        partition by player_id, stat_key
        order by created_at desc
      ) as rn
    from public.stat_goals
  ) ranked
  where rn > 1
);

alter table public.stat_goals
  add constraint stat_goals_unique_player_stat
  unique (player_id, stat_key);
