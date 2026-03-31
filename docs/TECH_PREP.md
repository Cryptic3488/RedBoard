# RedBoard — Technical Interview Prep

Denison University Women's Basketball · Internal Coaching Platform

---

## How to use this document

Questions are grouped by topic. Each answer is written the way you should speak it — direct, confident, specific. Technical jargon is explained in plain language where an audience might not know it. Page references are included where a screenshot exists.

---

## 1. High-Level Architecture

### "What is RedBoard and what problem does it solve?"

RedBoard is a private web application built for Denison Women's Basketball. Before it existed, coaches distributed film through Hudl links in group texts, emailed Excel stat sheets, printed playbook binders, and had no systematic way to track player wellness. RedBoard consolidates all of that into one mobile-first platform: coaches publish content from a desktop admin panel, players consume it on their phones.

### "What is the tech stack?"

| Layer | Technology |
|---|---|
| Frontend | React 18 with TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v6 |
| Backend / Auth / DB / Storage | Supabase |
| Database | PostgreSQL (hosted by Supabase) |
| File parsing | SheetJS (xlsx) — runs in the browser |
| Charts | Recharts |

There is **no custom server**. The entire backend is Supabase. The app builds to static files and can be hosted on any CDN or static host.

### "Why Supabase instead of writing your own backend?"

Supabase gives us a production-grade PostgreSQL database, authentication, file storage, and real-time subscriptions out of the box. Writing those from scratch would have taken months. Supabase lets us focus on the application logic. The trade-off is we're dependent on their platform, but for an internal team tool that's a fine trade.

### "How does the frontend communicate with the backend?"

All communication goes through the `supabase-js` client library using HTTPS. Every request automatically attaches the signed-in user's JSON Web Token (JWT). On the database side, PostgreSQL evaluates Row Level Security (RLS) policies using `auth.uid()` — which is extracted from that JWT — to decide what rows the user is allowed to read or write.

```
Browser (React) → supabase-js (HTTPS + JWT) → Supabase API → PostgreSQL (RLS check) → rows returned
```

The key point: **security is enforced at the database layer, not in application code.** Even if a bug in the UI sent a query it shouldn't, the database would deny it.

---

## 2. Authentication & Authorization

### "How does login work?"

The login page (`src/pages/Login.tsx`) collects email and password and calls `supabase.auth.signInWithPassword()`. Supabase validates the credentials and returns a JWT plus a refresh token. The `AuthContext` (`src/context/AuthContext.tsx`) listens to `supabase.auth.onAuthStateChange` — a callback that fires whenever the session starts, ends, or refreshes. On session start it immediately fetches the user's row from the `profiles` table to load their role, name, and profile data.

### "How does role-based routing work?"

Two roles exist: `admin` (coaching staff) and `player` (roster). After login, the `AuthContext` stores the role. The `Login.tsx` page redirects to `/admin` if the role is `admin`, or `/app/feed` if the role is `player`.

Beyond login, two guard components enforce access:

- **`AuthGuard`** — any route inside this wrapper redirects to `/login` if there is no active session.
- **`AdminGuard`** — routes inside this wrapper redirect to `/app/feed` if the user is not an admin.

These are structural — they wrap the entire route tree in `App.tsx` — so a player cannot reach `/admin/*` even by typing a URL directly.

### "What prevents a player from accessing another player's data?"

Row Level Security on the database. For example, `stat_entries` has a policy that reads: "a player may only select rows where `player_id = auth.uid()`." The `auth.uid()` value comes from the JWT — it cannot be spoofed by client-side code. Even if a player's browser sent a query for another player's stats, PostgreSQL would return zero rows.

### "How do you avoid infinite recursion in RLS policies?"

The `profiles` table has RLS enabled, which means policies on other tables cannot simply query `profiles` to check a user's role — that would trigger a recursive policy evaluation and crash. Instead, we use a PostgreSQL function called `get_my_role()` marked as `SECURITY DEFINER`. This function bypasses RLS on `profiles` by running under the permissions of the function owner (the database superuser), not the calling user. Every policy that needs to check `role = 'admin'` calls `get_my_role()` instead of querying `profiles` directly.

### "How are sessions persisted across page refreshes?"

Supabase automatically stores the JWT and refresh token in `localStorage`. When the page loads, `supabase.auth.getSession()` restores the session from storage. The `AuthContext` shows a loading state until the session check completes, preventing a flash of the login page for users who are already signed in.

---

## 3. Database Schema & RLS

### "Walk me through the database tables."

**`profiles`** — One row per user, created automatically by a PostgreSQL trigger when Supabase Auth creates a new user. Stores `role`, `name`, `avatar_url`, `jersey_number`, `position`, `class_year`.

**`film_posts`** — Each film clip a coach uploads. Has `title`, `note`, `link_type` (hudl or file), `url`, `visibility` (team or individual), and `created_by`.

**`film_post_recipients`** — Junction table for individual film posts. Maps `post_id → player_id` for each targeted player.

**`film_post_views`** — Tracks when a player viewed a post. Drives the unread badge: a post is "unread" if no row exists here for that player.

**`stat_uploads`** — One row per CSV/XLSX upload. Has `label`, `session_type` (game/practice), `session_date`, and `is_published`. Starts as `false` — players can't see it until the coach publishes it.

**`stat_entries`** — One row per player per upload. All standard stat columns (`points`, `total_reb`, `assists`, etc.) plus a `custom` JSONB column for any non-standard columns found in the file.

**`stat_annotations`** — Coach-written private notes on a player's performance in a specific upload.

**`stat_goals`** — Per-player target values for specific stats (e.g., "score 12 points per game").

**`wellness_forms`** — Coach-built check-in forms. `questions` is a JSONB array; each question has an `id`, `type` (rating/yesno/text), and `label`. Only one is `is_active` at a time.

**`wellness_responses`** — Player submissions. `answers` is a JSONB object keyed by question ID.

**`wellness_schedule`** — Maps calendar dates to form IDs for pre-scheduling.

**`playbook_folders`** / **`playbook_files`** — Two-table hierarchy. Files store a `storage_path` pointing to an object in Supabase Storage.

### "What is the access model? Who can read what?"

| Table | Player | Admin |
|---|---|---|
| profiles | Own row | All rows |
| film_posts | Posts targeted to them | All |
| stat_uploads | Published only | All |
| stat_entries | Own rows, published uploads | All |
| stat_annotations | Own | All |
| stat_goals | Own | All |
| wellness_forms | Active form only | All |
| wellness_responses | Own | All |
| playbook folders/files | Read-only | Full CRUD |

All policies follow a default-deny posture — if no policy grants access, the row is invisible.

---

## 4. Film Feature

### "How does a coach upload a film clip?"

The admin Film page (`src/pages/admin/Film.tsx`) has a form with:
1. Title and optional coaching note
2. Choice: paste a Hudl URL or upload a video file
3. Audience: Team (all players) or Individual (select specific players from a checkbox list)

On submit:
- If it's a file upload, the file goes to the `film-clips` Supabase Storage bucket first and the returned storage path becomes the `url`.
- `supabase.from('film_posts').insert(...)` creates the post row.
- If visibility is `individual`, a second insert into `film_post_recipients` creates one row per selected player.

### "How does a player know a new post arrived without refreshing?"

`useFilmPosts.ts` sets up a Supabase Realtime subscription using `supabase.channel(...).on('postgres_changes', ...)`. When a new row is inserted into `film_posts`, Supabase pushes that change over a WebSocket to all connected clients. The hook updates its local state, which re-renders the Film page and Feed instantly.

### "How does the unread badge work?"

`useUnreadCount.ts` queries `film_posts` for all posts the player can see, then queries `film_post_views` for the ones they've already viewed. The difference is the unread count, shown as a red dot on the Feed tab in the bottom navigation. When the player opens the Film page, `markAllRead()` upserts a `film_post_views` row for every unread post, clearing the badge.

### "How does the Hudl embed work?"

The `FilmCard` component (`src/components/FilmCard.tsx`) checks the `link_type`. For `hudl`, it renders an `<iframe>` pointed at the Hudl URL. For `file`, it calls `supabase.storage.from('film-clips').createSignedUrl(path, 3600)` to generate a temporary signed URL (valid 1 hour) and renders a `<video>` element. Signed URLs are used so the storage bucket can remain private — the file isn't publicly accessible, but a player with a valid session gets a time-limited URL to stream it.

---

## 5. Stats Feature

### "How does the stat upload flow work?"

1. Coach drags or selects a CSV or XLSX file on the admin Stats page.
2. `statParser.ts` parses the file in the browser using SheetJS — **no server is involved**.
3. The parser auto-detects columns using an alias map (e.g., "Pts", "Points", "PTS" all map to `points`). Any column that doesn't match a known stat goes into the `custom` JSONB column.
4. Player names in the file are fuzzy-matched against the `profiles` roster (by full name, then last name). The coach sees the matches and can override any incorrect one from a dropdown.
5. On submit: one `stat_uploads` row is inserted, then one `stat_entries` row per matched player. `is_published` defaults to `false`.
6. The coach clicks **Publish** when ready — this updates `is_published` to `true`. At that point, RLS now permits players to read their entries.

### "What stats are tracked?"

Standard columns: `points`, `total_reb` (with `off_reb`, `def_reb`), `assists`, `steals`, `blocks`, `turnovers`, `minutes`, `fouls`, FG made/attempted, 3-point made/attempted, FT made/attempted.

Percentages (FG%, 3P%, FT%) are computed client-side from the made/attempted pairs — they are not stored.

The `custom` JSONB column stores any additional columns from the upload file (e.g., "charges taken", "deflections") that don't match a known alias.

### "How are practice stats presented differently from game stats?"

`usePlayerStats.ts` fetches all a player's stat entries and splits them by `session_type`. Practice entries are grouped by calendar week and averaged within each week. The player sees a weekly trend: latest week vs the week before. Game entries are shown individually, with each game compared to the player's career average across all games.

### "What are stat goals and annotations?"

**Goals** (`stat_goals` table): An admin can set a target value for any stat key for a specific player (e.g., "Emma, aim for 8 rebounds per game"). On the player Stats page, goals appear with a progress bar showing their current average against the target.

**Annotations** (`stat_annotations` table): An admin can attach a private text note to a specific player's performance in a specific upload (e.g., "Great defensive effort, but 4 turnovers in Q3 — let's work on decision-making under pressure"). The player sees the note on their Stats page; other players cannot.

---

## 6. Wellness Feature

### "How does the form builder work?"

The admin Wellness page (`src/pages/admin/Wellness.tsx`) renders a dynamic form where coaches can add questions one at a time. Each question has a type — **Rating** (1–5 numeric scale), **Yes/No** (toggle), or **Text** (free response) — and a label. Questions can be reordered and deleted. On save, the entire `questions` array is stored as JSONB in the `wellness_forms` table.

### "What does 'active form' mean?"

Only one form is active at a time (`is_active = true` on the `wellness_forms` table). Players always see the active form. Coaches can switch which form is active. The `wellness_schedule` table lets coaches pre-assign forms to future dates; when the admin Wellness page loads, a background effect checks if today has a scheduled form and auto-activates it.

### "How is duplicate submission prevented?"

At the application layer: `useWellnessCheck.ts` queries `wellness_responses` for today's date and the current player. If a row exists, the check-in form is replaced with a read-only review of their answers. The submit button is only shown when no response exists for today. (A database constraint enforcing uniqueness per player + form + date would add a secondary safety net at the DB level.)

### "What does the admin see in today's dashboard?"

The Wellness admin page shows a list of every player on the roster with a green/gray submitted indicator. Coaches can expand any row to read that player's individual answers. Above the list is a **Team Summary card** that aggregates responses: average score for rating questions (shown with a filled bar), "X of N said Yes" for yes/no questions, and a response count for free-text questions.

---

## 7. Playbook Feature

### "How is the playbook structured?"

Two tables: `playbook_folders` (name, sort_order) and `playbook_files` (folder_id FK, name, storage_path, mime_type, sort_order). Files are stored in a Supabase Storage bucket called `playbook-files`. The storage path (e.g., `folders/uuid/filename.pdf`) is saved to the table; the app generates a public URL at render time.

### "How does a coach upload files?"

The admin Playbook page (`src/pages/admin/Playbook.tsx`) accepts drag-and-drop or file picker uploads. Selected files go to `supabase.storage.from('playbook-files').upload(path, file)`. On success, a `playbook_files` row is inserted with the returned storage path and detected `mime_type`. The admin can drag items within a folder to reorder them — sort_order values are updated on drop.

### "How does the player lightbox work?"

The player Playbook page (`src/pages/app/Playbook.tsx`) shows folders that expand to reveal image thumbnails in a grid. Clicking a thumbnail sets local state to the selected file, rendering a full-screen overlay (the lightbox). Inside the lightbox, left/right arrow keys (and on-screen buttons) navigate between files in the folder. Pressing Escape closes it. PDFs open in a new browser tab (`window.open`) because embedding a PDF in an iframe is more reliable across mobile browsers than trying to render it in the lightbox.

---

## 8. Player Feed

### "How does the unified feed work?"

`useFeedItems.ts` runs three parallel Supabase queries:
1. All film posts the player can see (RLS handles filtering)
2. All stat uploads that are published and have an entry for this player
3. All playbook files the player can see

Each result set is tagged with a `type` (`film`, `stat`, `playbook`). All three arrays are concatenated and sorted by `created_at` descending — newest item at the top, regardless of type. React renders different card components based on `item.type`.

### "What is the stat snapshot on the Feed?"

Two cards appear above the main feed:
- **Latest practice week** vs. the previous week — shows four hero stats (Points, Rebounds, Assists, Steals) with up/down trend arrows.
- **Latest game** vs. career average — same four stats, same arrow treatment.

These only appear when published stat data exists for the player. The data comes from `usePlayerStats.ts`, which is also used by the full Stats page.

### "What is the wellness nudge?"

A gold-accented prompt card that appears on the Feed when: (a) there is an active wellness form, and (b) the player has not yet submitted today. It links to `/app/wellness`. Once the player submits, `useWellnessCheck` updates its state and the nudge disappears on the next render.

---

## 9. State Management

### "How is state managed? Did you use Redux?"

No Redux. State is managed at two levels:

**Global state** — React Context for auth (`AuthContext`) and theme (`ThemeContext`). These are the only things that need to be shared across the entire app. `AuthContext` holds the Supabase session, the user's profile, and their role. `ThemeContext` holds the dim mode boolean.

**Feature state** — Custom hooks (`useFilmPosts`, `usePlayerStats`, `useFeedItems`, etc.). Each hook owns its own `useState` and `useEffect` and returns data + loading + error. Components call the hook they need. This keeps data fetching colocated with the feature that owns it.

### "Why custom hooks instead of a state management library?"

The data dependencies are straightforward — most features have one primary query. A global store would add complexity without adding value for a focused internal tool. Custom hooks are easy to test in isolation and easy to understand: you read the hook to know exactly what data a component needs.

---

## 10. Real-Time

### "Which features are real-time?"

Film is the only feature with live push updates. `useFilmPosts.ts` opens a Supabase Realtime channel that listens for `INSERT` events on the `film_posts` table. When a coach posts a new clip, every player's Film page and Feed update within a second without a refresh.

Other features (Stats, Wellness, Playbook) use standard fetch-on-mount patterns — they load fresh data when the player navigates to the page.

### "How does Supabase Realtime work under the hood?"

Supabase wraps PostgreSQL's logical replication stream and delivers change events over WebSockets. The `supabase-js` client subscribes to a channel scoped to a table (and optionally filtered by column values). The subscription is cleaned up in a React `useEffect` return function to prevent memory leaks when the component unmounts.

---

## 11. File Storage

### "How is file storage handled?"

Supabase Storage, backed by S3-compatible object storage. Three buckets:

| Bucket | Contents | Access |
|---|---|---|
| `avatars` | Player profile photos | Public read (URL is saved to `profiles.avatar_url`) |
| `film-clips` | Video uploads from coaches | Private — access via signed URLs |
| `playbook-files` | Playbook images and PDFs | Read-only for authenticated users |

### "Why signed URLs for film clips?"

Film clips may be sent to individual players only. If the storage bucket were public, the URL itself would be the only access control — anyone with the link could watch it. With a private bucket, even the URL is useless without a valid session. `createSignedUrl` generates a temporary URL (1-hour expiry) that only works for authenticated users, so individual clips stay truly private.

---

## 12. Design System

### "What does the UI look like and why?"

The design system uses:
- **Brand red** `#C8102E` / `#E51636` (Denison Athletics)
- **Warm cream** `#F8F4F0` (light mode background)
- **Dark background** `#1C1C1E` (iOS system dark — familiar to mobile users)
- **Typography**: Crimson Pro (editorial headings, Google Font) + Inter (UI text)

Every interactive card has a left `border-l` in brand red — a consistent visual language so players know what's tappable. The bottom navigation mirrors iOS tab bar conventions so players don't have to learn new interaction patterns.

### "Why mobile-first?"

Players are on their phones 90% of the time — before practice, in the locker room, at home watching film. Coaches use desktop for data entry (uploading stats, building forms). The player interface is designed at 390px wide (iPhone 14 Pro viewport); the admin interface is designed at 1280px with a sidebar and also has a mobile fallback with a bottom nav.

### "How does dark mode work?"

A `ThemeContext` stores a `isDim` boolean, persisted to `localStorage`. Toggling it adds or removes the `dark` class on `<html>`. Tailwind's `darkMode: 'class'` config means every `dark:` utility variant activates when that class is present. The toggle button is in the header bar on both player and admin layouts.

---

## 13. Deployment & Environment

### "How is the app deployed?"

`npm run build` runs Vite, which produces a static `dist/` folder — HTML, JavaScript bundles, and CSS. This is served from any static host (Netlify, Vercel, Cloudflare Pages, etc.). There is no server process to manage.

### "What environment variables are required?"

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | The Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | The public anon key (safe to expose — RLS enforces access) |

The anon key is intentionally public — it identifies the project but cannot bypass Row Level Security. The service role key (which bypasses RLS) is never used in client code.

### "What is the `.env` file situation?"

`.env` is gitignored. Environment variables are injected at build time by Vite (they are baked into the JavaScript bundle). In development, a `.env.local` file holds the keys. In production, the hosting provider injects them as build-time environment variables.

---

## 14. Common Follow-Up Questions

### "What would you do differently if you built this again?"

A few things I'd reconsider:
- **Server-side rendering**: The current SPA has no server, so there's a client-side hydration cost. For a larger user base, Next.js with Supabase would give better initial load performance.
- **Optimistic updates**: Currently, mutations (like submitting a wellness check-in) wait for the server round-trip before updating the UI. Adding optimistic updates would make the app feel faster.
- **Push notifications**: Players miss check-in reminders unless they open the app. Web Push notifications would close that gap.

### "How would you scale this to other teams?"

The database schema is already multi-team capable if you add a `team_id` column to each table and include it in every RLS policy. Auth would need a way to assign users to teams. The frontend would need a team switcher. The core architecture wouldn't change.

### "Is the app secure enough for sensitive data?"

For a college athletics internal tool, yes. The threat model is: authenticated users who might try to access more data than they should. RLS handles that completely. The bigger risk would be credential compromise — a player sharing their login — which is a social/policy problem, not a technical one. For a higher-sensitivity deployment (e.g., medical wellness data at a professional team) you'd add MFA and audit logging.

### "How do you handle errors?"

Most hooks return an `error` state alongside `data` and `loading`. Pages display user-friendly error messages when a query fails. File uploads show inline progress indicators and error states. Supabase client errors include a `message` property that can be surfaced to the user. Unhandled promise rejections are caught with try/catch in async operations inside useEffect and event handlers.

### "How are new players added to the system?"

An admin creates a new Supabase Auth user (email + password) through the admin Dashboard. A PostgreSQL trigger (`handle_new_user`) automatically creates a `profiles` row with `role = 'player'` when the auth user is inserted. The admin then updates the profile with the player's name. Players set their own jersey number, position, and class year on the Profile page.

### "What testing exists?"

Currently, manual testing via the app and the Playwright screenshot script (`scripts/screenshot.mjs`). The natural next step would be unit tests for `statParser.ts` (the most complex pure logic in the codebase — column aliasing, fuzzy name matching) and integration tests for the RLS policies using Supabase's local development stack.

---

*RedBoard · Denison University Women's Basketball · Internal Use Only*
