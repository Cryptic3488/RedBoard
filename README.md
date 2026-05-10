# RedBoard — Setup & Run Guide

**RedBoard** is a role-based coaching workflow web app for the Denison University Women's Basketball program. It centralizes film review, stats visualization, wellness check-ins, and a digital playbook into a single platform.

---

## Prerequisites

Before you begin, install the following on your machine:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 or higher | https://nodejs.org |
| npm | Comes with Node.js | — |
| Git | Any recent version | https://git-scm.com |

Verify your installation:

```bash
node -v     # should print v18.x.x or higher
npm -v      # should print 9.x.x or higher
```

You will also need a free **Supabase** account: https://supabase.com

---

## Step 1 — Get the Code

**Option A: Download ZIP (Canvas submission)**

1. Unzip the downloaded file to a folder of your choice.
2. Open a terminal and `cd` into that folder.

**Option B: Clone from Git**

```bash
git clone <repo-url>
cd RedBoard
```

---

## Step 2 — Install Dependencies

Inside the project folder, run:

```bash
npm install
```

This installs all required libraries (React, Supabase client, Recharts, PapaParse, etc.). It may take a minute.

---

## Step 3 — Create a Supabase Project

1. Go to https://supabase.com and sign in (or create a free account).
2. Click **New Project**.
3. Give it a name (e.g., `redboard`), choose a region, and set a database password. Save the password somewhere safe.
4. Wait for the project to finish provisioning (~1 minute).

---

## Step 4 — Apply the Database Migrations

All database tables, RLS policies, and helper functions are defined in the `supabase/migrations/` folder. Apply them in order using the Supabase SQL Editor:

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar).
2. For each file below (in order), open the file in a text editor, copy its full contents, paste into the SQL Editor, and click **Run**:

| Order | File |
|-------|------|
| 1 | `supabase/migrations/20260309000001_create_profiles.sql` |
| 2 | `supabase/migrations/20260310000001_film_feature.sql` |
| 3 | `supabase/migrations/20260310000002_profiles_read_all.sql` |
| 4 | `supabase/migrations/20260310000003_stats_feature.sql` |
| 5 | `supabase/migrations/20260316000001_wellness_feature.sql` |
| 6 | `supabase/migrations/20260323000001_playbook_feature.sql` |
| 7 | `supabase/migrations/20260325000001_wellness_schedule.sql` |
| 8 | `supabase/migrations/20260325000002_profile_fields.sql` |
| 9 | `supabase/migrations/20260327000001_stat_uploads_published.sql` |
| 10 | `supabase/migrations/20260331000001_stat_uploads_update_policy.sql` |
| 11 | `supabase/migrations/20260510000001_phase0_constraints.sql` |

> **Tip:** You can verify the tables were created by navigating to **Table Editor** in the sidebar. You should see: `profiles`, `film_posts`, `film_post_recipients`, `film_post_views`, `stat_uploads`, `stat_entries`, `stat_annotations`, `stat_goals`, `wellness_forms`, `wellness_responses`, `wellness_schedule`, `playbook_folders`, `playbook_files`.

---

## Step 5 — Create Storage Buckets

RedBoard uses Supabase Storage for file uploads (film clips, playbook PDFs/images, profile avatars). Create three buckets:

1. In your Supabase dashboard, go to **Storage** (left sidebar).
2. Click **New bucket** and create the following:

### Bucket 1: `film-clips` (Private)

- Name: `film-clips`
- Public: **OFF** (private — signed URLs required)
- Click **Create bucket**

After creating, add these policies under **Policies** for the `film-clips` bucket:

- **Allow admins to upload:** Policy: `(select get_my_role() = 'admin')` on INSERT
- **Allow admins to delete:** Policy: `(select get_my_role() = 'admin')` on DELETE
- **Allow authenticated users to read:** Policy: `(auth.role() = 'authenticated')` on SELECT

### Bucket 2: `playbook` (Private)

- Name: `playbook`
- Public: **OFF** (private — signed URLs required)
- Click **Create bucket**

Add the same three policies as `film-clips`.

### Bucket 3: `avatars` (Public)

- Name: `avatars`
- Public: **ON**
- Click **Create bucket**

Add these policies:
- **Allow public read:** Policy: `true` on SELECT
- **Allow players to upload their own avatar:** Policy: `(auth.uid()::text = (storage.foldername(name))[1])` on INSERT and UPDATE

> **Shortcut:** For a quick demo, you can set all three buckets to **public** and skip the policy setup. This is fine for grading/testing purposes — just not recommended for a real deployment.

---

## Step 6 — Configure Environment Variables

1. In the project root, copy the example file:

```bash
cp .env.example .env.local
```

2. Open `.env.local` in a text editor.

3. Fill in your Supabase credentials. Find these in your Supabase dashboard under **Project Settings → API**:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- **Project URL:** Listed as "Project URL" on the API settings page.
- **Anon Key:** Listed as "anon public" under "Project API Keys".

Also set `VITE_APP_URL` to your app's public URL — in development this is `http://localhost:5173`, in production it will be `https://redboard.drewn8n.com`. This is used for password reset email links.

Leave `VITE_POSTHOG_KEY` and `VITE_SENTRY_DSN` blank — they are optional analytics/monitoring integrations.

---

## Step 7 — Create Your First User (Admin)

RedBoard does not have a public sign-up page. Users are created via Supabase Auth:

1. In your Supabase dashboard, go to **Authentication → Users**.
2. Click **Add user → Create new user**.
3. Enter an email and password. Click **Create user**.
4. The `profiles` table is auto-populated via a database trigger, with role defaulting to `player`.

**To promote a user to admin:**

1. Go to **Table Editor → profiles**.
2. Find your user's row and change the `role` column value from `player` to `admin`.
3. Click **Save**.

Now log in to the app with that email/password — you will be routed to the admin dashboard.

To create player accounts, repeat step 1–3 above (leave role as `player`). You can also use the admin panel in the app to set player names after creation.

---

## Step 8 — Run the App Locally

```bash
npm run dev
```

Open your browser to: **http://localhost:5173**

You should see the RedBoard login page. Log in with the admin credentials you created in Step 7.

---

## Step 9 — (Optional) Build for Production

To create a production build:

```bash
npm run build
```

Output is in the `dist/` folder. This can be deployed to any static host (Cloudflare Pages, Vercel, Netlify, etc.).

To preview the production build locally:

```bash
npm run preview
```

---

## Project Structure (Overview)

```
RedBoard/
├── src/
│   ├── pages/
│   │   ├── app/          # Player-facing pages (Feed, Stats, Film, Wellness, Playbook, Profile)
│   │   └── admin/        # Admin pages (Dashboard, Film, Stats, Wellness, Playbook)
│   ├── components/       # Shared UI (AppLayout, AdminLayout, AuthGuard, FilmCard)
│   ├── hooks/            # Data-fetching hooks (useFilmPosts, usePlayerStats, etc.)
│   ├── context/          # AuthContext (session + role state)
│   └── lib/              # supabase.ts client init
├── supabase/
│   └── migrations/       # All SQL migrations (apply in order)
├── sample_data/          # Example CSV files for testing stat uploads
│   ├── practices/
│   └── games/
├── .env.example          # Template for environment variables
└── README.md             # This file
```

---

## Sample Data

The `sample_data/` folder contains example CSV files that can be uploaded via the admin Stats page to test the stats visualization features:

- `sample_data/practices/` — 8 practice session CSVs
- `sample_data/games/` — 6 game CSVs

---

## Common Issues

| Problem | Solution |
|---------|----------|
| Blank screen after login | Check that `.env.local` has the correct Supabase URL and anon key |
| "No data" on Stats page | Upload a CSV via admin Stats page and toggle "Publish" on |
| Film upload fails | Verify the `film-clips` bucket exists in Supabase Storage |
| Playbook files don't load | Verify the `playbook` bucket exists and has read policies |
| Profile avatar not saving | Verify the `avatars` bucket exists and is set to public |

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM 6 |
| Backend / Auth / DB | Supabase (PostgreSQL + RLS) |
| File storage | Supabase Storage |
| Charts | Recharts |
| CSV parsing | PapaParse |
| Excel parsing | SheetJS (xlsx) |

---

*Team: Andrew Byerly & Thomas Tison — Temple University Japan, Web Design, Spring 2026*
