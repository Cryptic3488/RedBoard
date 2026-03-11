-- F-02 Film Feature
-- Tables: film_posts, film_post_recipients, film_post_views

-- Helper function: get role for the currently authenticated user
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ─── Create all tables first ──────────────────────────────────────────────────

create table if not exists public.film_posts (
  id          uuid        primary key default gen_random_uuid(),
  created_by  uuid        not null references public.profiles(id) on delete cascade,
  title       text        not null check (char_length(title) between 1 and 120),
  note        text        not null default '',
  link_type   text        not null check (link_type in ('hudl', 'file')),
  url         text        not null,
  visibility  text        not null check (visibility in ('team', 'individual')),
  created_at  timestamptz not null default now()
);

create table if not exists public.film_post_recipients (
  post_id    uuid  not null references public.film_posts(id)  on delete cascade,
  player_id  uuid  not null references public.profiles(id)    on delete cascade,
  primary key (post_id, player_id)
);

create table if not exists public.film_post_views (
  post_id    uuid        not null references public.film_posts(id)  on delete cascade,
  player_id  uuid        not null references public.profiles(id)    on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (post_id, player_id)
);

-- ─── Enable RLS ───────────────────────────────────────────────────────────────

alter table public.film_posts           enable row level security;
alter table public.film_post_recipients enable row level security;
alter table public.film_post_views      enable row level security;

-- ─── film_posts policies ──────────────────────────────────────────────────────

create policy "admins select all film_posts"
  on public.film_posts for select
  using (get_my_role() = 'admin');

create policy "players select visible film_posts"
  on public.film_posts for select
  using (
    get_my_role() = 'player'
    and (
      visibility = 'team'
      or (
        visibility = 'individual'
        and exists (
          select 1 from public.film_post_recipients r
          where r.post_id = id and r.player_id = auth.uid()
        )
      )
    )
  );

create policy "admins insert film_posts"
  on public.film_posts for insert
  with check (get_my_role() = 'admin');

create policy "admins delete film_posts"
  on public.film_posts for delete
  using (get_my_role() = 'admin');

-- ─── film_post_recipients policies ───────────────────────────────────────────

create policy "admins select all film_post_recipients"
  on public.film_post_recipients for select
  using (get_my_role() = 'admin');

create policy "players select own film_post_recipients"
  on public.film_post_recipients for select
  using (player_id = auth.uid());

create policy "admins insert film_post_recipients"
  on public.film_post_recipients for insert
  with check (get_my_role() = 'admin');

-- ─── film_post_views policies ─────────────────────────────────────────────────

create policy "players select own film_post_views"
  on public.film_post_views for select
  using (player_id = auth.uid());

create policy "admins select all film_post_views"
  on public.film_post_views for select
  using (get_my_role() = 'admin');

create policy "players insert own film_post_views"
  on public.film_post_views for insert
  with check (player_id = auth.uid());

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists film_posts_created_at_idx
  on public.film_posts(created_at desc);

create index if not exists film_post_recipients_player_idx
  on public.film_post_recipients(player_id);

create index if not exists film_post_views_player_idx
  on public.film_post_views(player_id);
