# RedBoard — Technical Overview

**Denison Women's Basketball · Internal Coaching Platform**

---

## What It Is

RedBoard is a private web application built for the Denison University Women's Basketball coaching staff and roster. It replaces a fragmented set of tools — group chats, shared drives, printed binders — with a single mobile-first platform where coaches publish content and players consume it in one place.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 (TypeScript) |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v6 |
| Backend / Auth / Database | Supabase |
| Database | PostgreSQL (via Supabase) |
| File storage | Supabase Storage |
| Stat file parsing | SheetJS (xlsx) — client-side |
| Deployment | Vite build → static hosting |

The entire backend is Supabase. There is no custom server. All database access, authentication, and file storage go through the Supabase JavaScript client (`@supabase/supabase-js`) using the public anon key. Security is enforced at the database layer via Row Level Security policies — not in application code.

---

## How the Frontend, Backend, and Database Communicate

```
Browser (React App)
        │
        │  supabase-js client (HTTPS, anon key)
        ▼
  Supabase Platform
  ┌─────────────────────────────────────────────┐
  │  Auth (JWT)     ──► sets auth.uid()         │
  │  PostgREST API  ──► reads/writes Postgres   │
  │  Storage API    ──► serves/stores files      │
  │  Realtime       ──► pushes DB change events  │
  └─────────────────────────────────────────────┘
        │
        ▼
  PostgreSQL Database
  (Row Level Security enforces all access rules)
```

**Request flow for a typical data fetch:**

1. The React component calls a hook (e.g. `useFilmPosts()`)
2. The hook calls `supabase.from('film_posts').select(...)` via the JS client
3. The client sends an HTTPS request to the Supabase PostgREST endpoint, attaching the user's JWT automatically
4. Postgres evaluates the RLS policy — `auth.uid()` is derived from the JWT — and returns only rows the user is permitted to see
5. The result is typed and returned to the component

**No data can ever bypass RLS.** Even if a client query omits a filter, the database policy enforces it. Admins and players see different data from the same tables because the RLS policy checks role at query time.

---

## Authentication

**Provider:** Supabase Auth (email + password)

**How it works:**

- On login, Supabase issues a JWT containing the user's `id` and any custom claims
- The `AuthContext` (`src/context/AuthContext.tsx`) wraps the entire app and listens to `supabase.auth.onAuthStateChange`
- On session start, it fetches the user's `profiles` row (role, name, avatar, jersey number, position, class year) and stores it in React context
- Every page and hook can call `useAuth()` to read `{ user, role, profile, session }`

**Route protection** is enforced by two components in `src/components/AuthGuard.tsx`:

- `AuthGuard` — redirects unauthenticated users to `/login`
- `AdminGuard` — redirects non-admin users to `/app/feed`

These wrap the route tree in `App.tsx` so protection is structural, not per-page.

**Role model:** Two roles — `admin` (coaching staff) and `player` (roster). Role is stored in the `profiles` table and checked in both the UI (routing, conditional rendering) and the database (RLS policies).

---

## Database Schema

All tables are in the `public` schema with RLS enabled. The helper function `get_my_role()` (defined as `SECURITY DEFINER`) lets RLS policies check the current user's role without triggering recursive policy evaluation on the `profiles` table.

### `profiles`
Extends Supabase Auth users. One row per user.

| Column | Type | Notes |
|---|---|---|
| id | uuid | FK → auth.users |
| role | text | `'admin'` or `'player'` |
| name | text | Set by admin |
| avatar_url | text | Uploaded to Storage |
| jersey_number | integer | Set by player |
| position | text | Guard / Forward / Center |
| class_year | text | Fr / So / Jr / Sr |

Auto-created by a Postgres trigger when a new auth user is inserted.

### `film_posts`
Coach-created film entries (Hudl links or uploaded video files).

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| title | text | |
| note | text | Coach's written notes |
| link_type | text | `'hudl'` or `'file'` |
| url | text | Hudl URL or Storage path |
| visibility | text | `'team'` or `'individual'` |
| created_by | uuid | FK → profiles |

Individual posts use `film_post_recipients` (junction table with `post_id`, `player_id`) to target specific players. RLS ensures a player only sees posts where they are a recipient or visibility is `'team'`.

`film_post_views` tracks when each player views a post — used to drive the unread badge on the Feed nav icon.

### `stat_uploads`
Each CSV/XLSX upload from the coach.

| Column | Type | Notes |
|---|---|---|
| label | text | e.g. "Week 3 Practice" |
| session_type | text | `'game'` or `'practice'` |
| session_date | date | |
| is_published | boolean | Default `false` — players cannot see until published |

### `stat_entries`
One row per player per upload. Stores all standard stat columns (`points`, `total_reb`, `assists`, `steals`, `blocks`, `turnovers`, `minutes`, FG/3P/FT splits, offensive/defensive rebounds, fouls) plus a `custom` JSONB column for any non-standard columns found in the file.

RLS: players can only read their own entries, and only where the parent `stat_upload.is_published = true`.

### `stat_annotations`
Coach-written notes attached to a specific player's performance in a specific upload. Players read their own; admins read all.

### `stat_goals`
Per-player target values for specific stat keys. Admin-set, player-read.

### `wellness_forms`
Coach-built check-in forms. Each form has a `questions` JSONB array where each question has an `id`, `type` (`rating` / `yesno` / `text`), and `label`. Only one form is `is_active` at a time.

### `wellness_responses`
Player submissions. `answers` is a JSONB object keyed by question `id`. One response per player per form per date enforced at the application layer.

### `wellness_schedule`
Maps dates to form IDs. Allows coaches to pre-schedule which form activates on which day. A background effect in the admin Wellness page auto-activates the scheduled form for today on first load.

### `playbook_folders` / `playbook_files`
Two-table structure for the virtual playbook. Folders have a name and sort order. Files store a `storage_path` pointing to an object in the `playbook-files` Supabase Storage bucket, plus `mime_type` and `sort_order`.

---

## Features

### Feed (Player home screen)
**Route:** `/app/feed`

The player's home screen. Composed of three sections stacked vertically:

1. **Editorial greeting** — time-based ("Good morning / afternoon / evening") with the player's first name
2. **Wellness nudge** — a gold-accented prompt card that appears only when there is an active wellness form the player hasn't submitted today. Disappears once submitted.
3. **Stat snapshot** — personal performance cards (most recent practice week vs. prior week; latest game vs. career average) with four hero stats and trend arrows. Only visible when published stat data exists.
4. **Unified chronological feed** — all coach-published content in a single timeline sorted newest-first. Three content types render inline:
   - **Film cards** — Hudl iframe or video player with title, note, and "just for you" badge for individual posts
   - **Stat cards** — label + Game/Practice badge linking to the Stats page
   - **Playbook cards** — folder name + file count linking to the Playbook page

Data is fetched by `useFeedItems` (parallel queries to `film_posts`, `stat_entries`→`stat_uploads`, and `playbook_files`) and merged client-side by `created_at`.

---

### Film (Hudl Clip Sharing)
**Admin route:** `/admin/film` · **Player route:** `/app/film`

**Coach flow:**
1. Enter a title and notes
2. Paste a Hudl URL or upload a video file (stored in the `film-clips` Supabase Storage bucket as a signed URL)
3. Choose visibility: Team (all players) or Individual (select specific players from roster)
4. Submit → creates a `film_posts` row and, for individual posts, inserts rows into `film_post_recipients`

**Player flow:**
- The Film page lists all posts the player is targeted for, newest first
- Visiting the page calls `markAllRead()` which upserts a `film_post_views` row for each unviewed post, clearing the red dot badge on the nav bar
- The red dot is driven by `useUnreadCount`, which counts `film_posts` the player hasn't viewed yet

**Real-time:** `useFilmPosts` subscribes to a Supabase Realtime channel on the `film_posts` table. New posts appear instantly without a page refresh.

---

### Stats
**Admin route:** `/admin/stats` · **Player route:** `/app/stats`

**Coach flow:**
1. Upload a CSV or XLSX file — parsed entirely client-side by `src/lib/statParser.ts` using SheetJS
2. The parser auto-detects column headers against a known alias list (e.g. "Pts", "Points", "PTS" all map to `points`)
3. Player names in the file are fuzzy-matched against the `profiles` roster — coaches can override any match manually
4. Submit → creates one `stat_uploads` row and one `stat_entries` row per matched player
5. Each upload starts as **Draft** (hidden from players). The coach clicks **Publish** to make it visible
6. Coaches can annotate any player's performance (private coach note) and set per-player stat goals

**Player flow:**
- Practice stats are grouped by week and shown with trend deltas vs. the prior week
- Game stats are shown per game with deltas vs. career average
- Four hero stats (Points, Rebounds, Assists, Steals) are featured prominently; all standard stats are available in an expandable table
- Goals set by coaches appear with a progress bar

---

### Wellness Check-In
**Admin route:** `/admin/wellness` · **Player route:** `/app/wellness`

**Coach flow:**
1. **Form builder** — create a form with any combination of Rating (1–5), Yes/No, and free-text questions
2. **Activate** a form to make it live for players
3. **Schedule** — a calendar UI lets coaches pre-assign forms to future dates; the active form auto-updates at midnight
4. **Today's Dashboard** — shows every player on the roster with a green/gray submitted indicator. Coaches can expand any row to see individual answers
5. **Team Summary card** — appears above the player list when at least one player has submitted. Shows per-question aggregates: average score for rating questions (with a filled progress bar), "X of N said Yes" for yes/no questions, and a response count for free-text questions

**Player flow:**
- One form per day. If a form is active and the player hasn't submitted, the wellness nudge appears on their Feed
- The check-in page shows each question with the appropriate input (star-style numeric buttons for rating, Yes/No toggle, text area)
- After submission, the player sees a read-only review of their answers for the day

---

### Virtual Playbook
**Admin route:** `/admin/playbook` · **Player route:** `/app/playbook`

**Coach flow:**
1. Create named folders (e.g. "Offense", "Defense", "Out of Bounds")
2. Upload files (images or PDFs) into any folder — stored in the `playbook-files` Supabase Storage bucket
3. Drag-to-reorder files within a folder

**Player flow:**
- Browse folders, each expandable to show file thumbnails
- Tap any file to open a full-screen lightbox viewer
- PDFs render in-browser via an `<iframe>`; images are displayed directly

---

### Profile
**Route:** `/app/profile`

Players can:
- Upload a profile photo (stored in the `avatars` Storage bucket; public URL saved to `profiles.avatar_url`)
- Set jersey number, position, and class year
- Toggle dim mode
- Sign out

The avatar appears in the top-right of the player header bar throughout the app.

---

## Data Flow Summary

```
Coach uploads a film clip
        │
        ▼
  admin/Film.tsx calls supabase.from('film_posts').insert(...)
  + supabase.from('film_post_recipients').insert(...) if individual
        │
        ▼
  Postgres row created; RLS grants select only to targeted players
        │
        ▼ (Realtime channel)
  useFilmPosts() on player devices receives the change event
        │
        ▼
  Film page and Feed update instantly without refresh
  Red dot badge appears on Feed nav icon (useUnreadCount)
```

```
Coach uploads a stat CSV
        │
        ▼
  statParser.ts parses file client-side (no server involved)
  Rows matched to roster, admin reviews + confirms
        │
        ▼
  supabase.from('stat_uploads').insert(...)   ← is_published: false
  supabase.from('stat_entries').insert([...]) ← one row per player
        │
        ▼
  Upload sits in Draft state; players cannot see it
        │
  Coach clicks Publish
        │
        ▼
  supabase.from('stat_uploads').update({ is_published: true })
        │
        ▼
  RLS policy now permits players to read their stat_entries for this upload
  Appears in player Feed + Stats page on next fetch
```

---

## Security Model

Every table has RLS enabled with a default-deny posture. Policies are additive — a row is returned only if at least one policy grants access.

| Table | Player can read | Admin can read |
|---|---|---|
| profiles | Own row only | All rows |
| film_posts | Posts targeted to them | All posts |
| stat_uploads | Published uploads only | All uploads |
| stat_entries | Own entries, published uploads only | All entries |
| stat_annotations | Own annotations | All annotations |
| stat_goals | Own goals | All goals |
| wellness_forms | Active form only | All forms |
| wellness_responses | Own responses | All responses |
| playbook_folders / files | All (read-only) | All (CRUD) |

Admins use a `SECURITY DEFINER` function (`get_my_role()`) to check their role inside policies — this avoids infinite recursion that would occur if a policy on `profiles` tried to read from `profiles`.

---

## Application Structure

```
src/
├── App.tsx                    Route tree and provider wrapping
├── context/
│   ├── AuthContext.tsx        Session, role, profile state
│   └── ThemeContext.tsx       Dim mode (dark class on <html>)
├── components/
│   ├── AuthGuard.tsx          AuthGuard + AdminGuard route wrappers
│   ├── AppLayout.tsx          Player shell (header + bottom nav)
│   ├── AdminLayout.tsx        Admin shell (header + sidebar + mobile nav)
│   └── FilmCard.tsx           Shared film post card (Feed + Film page)
├── hooks/
│   ├── useFilmPosts.ts        Film posts with Realtime subscription
│   ├── useFeedItems.ts        Unified feed (film + stats + playbook)
│   ├── usePlayerStats.ts      Practice weeks + games aggregation
│   ├── useStatUploads.ts      Admin upload history
│   ├── useUnreadCount.ts      Film unread badge + markAllRead
│   ├── useWellnessCheck.ts    Active form + today's response
│   └── useWellnessForms.ts    Admin form library
├── lib/
│   ├── supabase.ts            Supabase client (anon key only)
│   ├── statParser.ts          CSV/XLSX parsing + player matching
│   └── greeting.ts            Time-based greeting utility
├── pages/
│   ├── Login.tsx
│   ├── app/                   Player-facing pages
│   │   ├── Feed.tsx
│   │   ├── Film.tsx
│   │   ├── Stats.tsx
│   │   ├── Wellness.tsx
│   │   ├── Playbook.tsx
│   │   └── Profile.tsx
│   └── admin/                 Admin-only pages
│       ├── Dashboard.tsx
│       ├── Film.tsx
│       ├── Stats.tsx
│       ├── Wellness.tsx
│       └── Playbook.tsx
└── types/
    └── database.ts            TypeScript types for all DB tables
```

---

## Design System

- **Brand red:** `#C8102E` (Denison Athletics)
- **Light mode background:** `#F5F0EB` (warm cream)
- **Dark mode background:** `#1C1C1E` (iOS system dark)
- **Card surface (dark):** `#2C2C2E`
- **Input surface (dark):** `#3A3A3C`
- **Typography:** `font-display` (editorial headings) + `font-ui` (interface text)
- **Accent pattern:** left border `border-l-brand` on all interactive cards — consistent visual language across every feature
- All UI supports light and dim (dark) mode, toggled via a single button in the header bar on both player and admin views. State is persisted to `localStorage` and applied as a `dark` class on `<html>`.
