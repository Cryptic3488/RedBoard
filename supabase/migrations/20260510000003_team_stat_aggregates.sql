-- Phase 3: SECURITY DEFINER function for team stat aggregates.
--
-- Replaces the broad stat_entries SELECT in usePlayerStats.ts.
-- Players never receive individual rows from other players — only aggregated
-- averages, maximums, and sums per upload per stat column.
-- Only entries from published uploads are included.

create or replace function public.get_team_stat_aggregates()
returns table (
  upload_id    uuid,
  session_type text,
  session_date date,
  stat_key     text,
  avg_val      numeric,
  max_val      numeric,
  sum_val      numeric,
  n            integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    se.upload_id,
    su.session_type,
    su.session_date,
    v.key        as stat_key,
    avg(v.val)   as avg_val,
    max(v.val)   as max_val,
    sum(v.val)   as sum_val,
    count(v.val)::int as n
  from public.stat_entries se
  join public.stat_uploads su
    on su.id = se.upload_id
   and su.is_published = true
  cross join lateral (values
    ('points',           se.points),
    ('total_reb',        se.total_reb),
    ('assists',          se.assists),
    ('steals',           se.steals),
    ('blocks',           se.blocks),
    ('turnovers',        se.turnovers),
    ('minutes',          se.minutes),
    ('fg_made',          se.fg_made),
    ('fg_attempted',     se.fg_attempted),
    ('three_made',       se.three_made),
    ('three_attempted',  se.three_attempted),
    ('ft_made',          se.ft_made),
    ('ft_attempted',     se.ft_attempted),
    ('off_reb',          se.off_reb),
    ('def_reb',          se.def_reb),
    ('fouls',            se.fouls)
  ) as v(key, val)
  where v.val is not null
  group by se.upload_id, su.session_type, su.session_date, v.key
$$;

grant execute on function public.get_team_stat_aggregates() to authenticated;
