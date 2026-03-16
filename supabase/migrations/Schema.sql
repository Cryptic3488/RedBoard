-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.film_post_recipients (
  post_id uuid NOT NULL,
  player_id uuid NOT NULL,
  CONSTRAINT film_post_recipients_pkey PRIMARY KEY (post_id, player_id),
  CONSTRAINT film_post_recipients_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.film_posts(id),
  CONSTRAINT film_post_recipients_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.film_post_views (
  post_id uuid NOT NULL,
  player_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT film_post_views_pkey PRIMARY KEY (post_id, player_id),
  CONSTRAINT film_post_views_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.film_posts(id),
  CONSTRAINT film_post_views_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.film_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 120),
  note text NOT NULL DEFAULT ''::text,
  link_type text NOT NULL CHECK (link_type = ANY (ARRAY['hudl'::text, 'file'::text])),
  url text NOT NULL,
  visibility text NOT NULL CHECK (visibility = ANY (ARRAY['team'::text, 'individual'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT film_posts_pkey PRIMARY KEY (id),
  CONSTRAINT film_posts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text NOT NULL DEFAULT 'player'::text CHECK (role = ANY (ARRAY['admin'::text, 'player'::text])),
  name text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.stat_annotations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL,
  player_id uuid NOT NULL,
  note text NOT NULL CHECK (char_length(note) >= 1 AND char_length(note) <= 1000),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stat_annotations_pkey PRIMARY KEY (id),
  CONSTRAINT stat_annotations_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES public.stat_uploads(id),
  CONSTRAINT stat_annotations_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.profiles(id),
  CONSTRAINT stat_annotations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.stat_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL,
  player_id uuid NOT NULL,
  minutes numeric,
  points numeric,
  fg_made numeric,
  fg_attempted numeric,
  three_made numeric,
  three_attempted numeric,
  ft_made numeric,
  ft_attempted numeric,
  off_reb numeric,
  def_reb numeric,
  total_reb numeric,
  assists numeric,
  steals numeric,
  blocks numeric,
  turnovers numeric,
  fouls numeric,
  custom jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stat_entries_pkey PRIMARY KEY (id),
  CONSTRAINT stat_entries_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES public.stat_uploads(id),
  CONSTRAINT stat_entries_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.stat_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  stat_key text NOT NULL CHECK (char_length(stat_key) >= 1 AND char_length(stat_key) <= 60),
  target numeric NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stat_goals_pkey PRIMARY KEY (id),
  CONSTRAINT stat_goals_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.profiles(id),
  CONSTRAINT stat_goals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.stat_uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  label text NOT NULL CHECK (char_length(label) >= 1 AND char_length(label) <= 120),
  session_type text NOT NULL CHECK (session_type = ANY (ARRAY['game'::text, 'practice'::text])),
  session_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stat_uploads_pkey PRIMARY KEY (id),
  CONSTRAINT stat_uploads_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);