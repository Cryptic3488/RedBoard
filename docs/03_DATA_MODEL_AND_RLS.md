# Data Model & RLS Guardrails

## Core tables (suggested)

auth.users (Supabase)
profiles

- id (uuid, pk, references auth.users.id)
- role ('admin'|'player')
- name
- created_at

film_posts

- id
- title
- hudl_url
- notes
- recipient_scope ('team'|'individual'|'group')
- recipient_user_ids (uuid[]) OR join table film_post_recipients
- created_by (uuid)
- created_at

wellness_checks

- id
- date (date)
- questions (jsonb)
- created_by
- created_at

wellness_responses

- id
- check_id
- user_id
- answers (jsonb)
- created_at
  (Unique constraint: check_id + user_id)

playbook_items

- id
- title
- category (text)
- storage_path (text)
- created_by
- created_at

stats_datasets

- id
- source_type ('sheets'|'csv')
- storage_path OR data (jsonb)
- created_by
- created_at

stats_views

- id
- dataset_id
- title
- config (jsonb) # chart type, fields, filters
- published (bool)
- recipient_scope + recipients
- created_by
- created_at

feed_items (optional unifier)

- id
- type ('film'|'stats'|'wellness'|'playbook')
- ref_id (uuid)
- recipient_scope + recipients
- created_by
- created_at

## Storage buckets (suggested)

playbook-pdfs

- PDFs stored by category folders if helpful

## RLS principles (non-negotiable)

1. Default deny. Enable RLS on all content tables.
2. Players must only see:
   - items explicitly targeted to them, or
   - items targeted to "team"
3. Players can only create:
   - their own wellness_responses
4. Admins can CRUD:
   - all content tables
5. Never trust client “role” flags; enforce via:
   - profiles.role
   - JWT claims (optional) + RLS rules

## RLS tests (must have)

- Player cannot read Admin-only content
- Player cannot write to content tables
- Player can read team-targeted posts
- Player can read individual posts targeted to them
- Player cannot read individual posts targeted to others
