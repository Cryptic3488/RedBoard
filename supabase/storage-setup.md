# RedBoard — Supabase Storage Bucket Setup

Three storage buckets must exist in the Supabase project before the app functions correctly.
They cannot be created by SQL migrations — they must be created in the Supabase Dashboard
or via the Supabase CLI. This document covers both methods.

> All three buckets are confirmed to exist in the live project as of 2026-05-10.
> This guide is for re-creating them on a new project or local development stack.

---

## Buckets Overview

| Bucket name  | Public? | File size limit | Who uploads          | Access model               |
|-------------|---------|-----------------|----------------------|----------------------------|
| `avatars`   | Yes     | 5 MB            | Players (own avatar) | Public read URL            |
| `film-clips`| No      | 500 MB          | Admins               | Signed URLs (1-hour TTL)   |
| `playbook`  | No      | 50 MB           | Admins               | Signed URLs (1-hour TTL)   |

---

## Method A — Supabase Dashboard (recommended for production)

### 1. `avatars` (public)

1. Go to **Storage** in the left sidebar.
2. Click **New bucket**.
3. Name: `avatars`
4. Toggle **Public bucket** to ON.
5. File size limit: `5242880` (5 MB in bytes).
6. Click **Save**.
7. Go to **Policies** tab for the `avatars` bucket.
8. Add the following policies:

   **SELECT (public read — anyone can view avatars)**
   ```sql
   true
   ```

   **INSERT (players upload their own avatar)**
   ```sql
   auth.uid()::text = (storage.foldername(name))[1]
   ```

   **UPDATE (players overwrite their own avatar)**
   ```sql
   auth.uid()::text = (storage.foldername(name))[1]
   ```

   **DELETE (players delete their own avatar)**
   ```sql
   auth.uid()::text = (storage.foldername(name))[1]
   ```

---

### 2. `film-clips` (private)

1. Click **New bucket**.
2. Name: `film-clips`
3. Leave **Public bucket** OFF.
4. File size limit: `524288000` (500 MB in bytes).
5. Click **Save**.
6. Add the following policies:

   **SELECT (authenticated players/admins can read — signed URLs handle individual access)**
   ```sql
   auth.role() = 'authenticated'
   ```

   **INSERT (admins only)**
   ```sql
   get_my_role() = 'admin'
   ```

   **DELETE (admins only)**
   ```sql
   get_my_role() = 'admin'
   ```

---

### 3. `playbook` (private)

1. Click **New bucket**.
2. Name: `playbook`
3. Leave **Public bucket** OFF.
4. File size limit: `52428800` (50 MB in bytes).
5. Click **Save**.
6. Add the following policies:

   **SELECT (any authenticated user can read playbook files)**
   ```sql
   auth.role() = 'authenticated'
   ```

   **INSERT (admins only)**
   ```sql
   get_my_role() = 'admin'
   ```

   **DELETE (admins only)**
   ```sql
   get_my_role() = 'admin'
   ```

---

## Method B — Supabase CLI (local development)

When running `supabase start` locally, create buckets via SQL in a migration or the local
Studio interface (http://localhost:54323).

The following SQL can be run in the Studio SQL Editor to create all three buckets:

```sql
-- Create buckets (local dev only — do NOT run against production)
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('avatars',    'avatars',    true,  5242880),
  ('film-clips', 'film-clips', false, 524288000),
  ('playbook',   'playbook',   false, 52428800)
on conflict (id) do nothing;

-- avatars: public read
insert into storage.policies (name, bucket_id, operation, definition)
values
  ('avatars_public_read',    'avatars', 'SELECT', 'true'),
  ('avatars_owner_insert',   'avatars', 'INSERT', 'auth.uid()::text = (storage.foldername(name))[1]'),
  ('avatars_owner_update',   'avatars', 'UPDATE', 'auth.uid()::text = (storage.foldername(name))[1]'),
  ('avatars_owner_delete',   'avatars', 'DELETE', 'auth.uid()::text = (storage.foldername(name))[1]'),
  -- film-clips: auth read, admin write/delete
  ('film_auth_read',         'film-clips', 'SELECT', 'auth.role() = ''authenticated'''),
  ('film_admin_insert',      'film-clips', 'INSERT', 'get_my_role() = ''admin'''),
  ('film_admin_delete',      'film-clips', 'DELETE', 'get_my_role() = ''admin'''),
  -- playbook: auth read, admin write/delete
  ('playbook_auth_read',     'playbook', 'SELECT', 'auth.role() = ''authenticated'''),
  ('playbook_admin_insert',  'playbook', 'INSERT', 'get_my_role() = ''admin'''),
  ('playbook_admin_delete',  'playbook', 'DELETE', 'get_my_role() = ''admin''')
on conflict do nothing;
```

---

## Notes

- The `get_my_role()` function used in storage policies is the same SECURITY DEFINER function
  defined in `migrations/20260309000001_create_profiles.sql`. It must exist before these policies
  are applied.
- Storage policies are separate from table RLS policies — they live in `storage.policies`,
  not `public`.
- The `avatars` bucket stores files at path `{user_id}/avatar.{ext}` — the folder name
  equals the user's UUID, which the INSERT policy enforces.
- The `film-clips` bucket stores files at path `clips/{uuid}.{ext}`.
- The `playbook` bucket stores files at path `{folder_id}/{uuid}.{ext}`.
