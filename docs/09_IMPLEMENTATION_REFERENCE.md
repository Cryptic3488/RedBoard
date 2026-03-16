# Implementation Reference

How each feature was built — stack decisions, schema, key files, and patterns to follow.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite 5 + React 18 + TypeScript | Strict mode, `noUnusedLocals` |
| Styling | Tailwind CSS 3 | Custom colors: `brand` (#E51636), `cream` (#F8F4F0), `near-black` (#100F0D), `gold` (#FFC72C) |
| Database + Auth | Supabase (PostgreSQL + Auth) | supabase-js v2.98.0 |
| Routing | react-router-dom v6 | Nested routes, loader-free |
| Charts | recharts | Player stats trend lines |
| CSV/XLSX parsing | papaparse + xlsx | Admin stat uploads |

---

## Theme

**Light cream palette** applied app-wide:

| Element | Class |
|---|---|
| Page background | `bg-cream` (from layout) |
| Cards | `bg-white/80 border border-gray-200 rounded-2xl` |
| Headings | `text-near-black` |
| Labels | `text-gray-600` |
| Secondary text | `text-gray-400` |
| Inputs | `bg-gray-50 border border-gray-200` |
| Brand accent | `text-brand`, `bg-brand`, `border-brand` |
| Gold accent | `border-gold`, `text-gold` (weekly wrapped card) |

---

## F-01 — Auth & Role Management

**Goal:** Supabase email/password auth with two roles: `admin` and `player`. Role-based routing enforced client-side and via RLS server-side.

### Schema
```sql
-- profiles table (one row per auth.users row)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'player')),
  name       text not null,
  created_at timestamptz not null default now()
);
```

Auto-created via trigger on `auth.users` insert (`handle_new_user()`). New users default to role `player`; admin role is set manually in Supabase Dashboard.

### RLS
- `get_my_role()` — SECURITY DEFINER function that reads `profiles.role` for the current user without triggering recursion.
- Profiles: authenticated users can read all rows (needed for JOIN queries); only own row can be updated.
- All other tables use `get_my_role() = 'admin'` for write policies.

### Key files
- `supabase/migrations/20260309000001_create_profiles.sql`
- `src/context/AuthContext.tsx` — session state + role
- `src/components/AuthGuard.tsx` — `<AuthGuard>` and `<AdminGuard>` wrappers
- `src/App.tsx` — route tree

### Pattern
```tsx
// Protecting a route
<Route element={<AdminGuard />}>
  <Route path="/admin/*" element={<AdminLayout />} />
</Route>
```

---

## F-02 — Film Clip Sharing

**Goal:** Coaches post Hudl links or upload video files with coaching notes, targeting the whole team or individual players. Players see an unread badge on the Feed nav icon that clears on visiting the Film page.

### Schema
```sql
film_posts            -- title, note, link_type ('hudl'|'file'), url, visibility ('team'|'individual')
film_post_recipients  -- junction: post_id × player_id (individual posts only)
film_post_views       -- post_id × player_id × viewed_at (unread tracking)
```

File uploads go to Supabase Storage bucket `film-clips` (private). The `url` column stores the storage path, not a signed URL — signed URLs are generated at render time with 1-hour expiry.

### RLS
- Players can only read `film_posts` where `visibility = 'team'` OR they appear in `film_post_recipients`.
- Players can insert their own `film_post_views` rows (marks as read).
- Storage bucket policies: admins upload/delete; all authenticated users can generate signed URLs.

### Key files
- `supabase/migrations/20260310000001_film_feature.sql`
- `supabase/migrations/20260310000002_profiles_read_all.sql` — fixes JOIN on creator name
- `src/hooks/useFilmPosts.ts` — real-time subscription via `postgres_changes`
- `src/hooks/useUnreadCount.ts` — diff of visible post IDs vs viewed post IDs
- `src/components/FilmCard.tsx` — Hudl iframe + signed-URL video player
- `src/pages/admin/Film.tsx` — upload form + published list
- `src/pages/app/Film.tsx` — player film page (calls `markAllRead` on mount)
- `src/components/AppLayout.tsx` — red dot badge

### Hudl embed
```ts
// Converts share URL to embed URL
function getHudlEmbedUrl(url: string): string | null {
  // https://www.hudl.com/video/... → https://www.hudl.com/embed/video/...
}
```

### Known caveat
The `film-clips` storage bucket must be created **manually** in the Supabase Dashboard (Storage tab). SQL migrations cannot create storage buckets. Three policies needed: admin INSERT, admin DELETE, authenticated SELECT.

---

## F-03 — Admin Stats Upload

**Goal:** Coach uploads a single CSV or XLSX file covering all players for a practice or game session. The app auto-detects columns, fuzzy-matches player names to profiles, and lets the coach manually override any mismatches before confirming.

### Schema
```sql
stat_uploads   -- label, session_type ('game'|'practice'), session_date, created_by
stat_entries   -- one row per player per upload; 16 standard NCAA D3 typed columns + custom jsonb
stat_annotations -- coach note per (upload_id, player_id) pair; upsertable
stat_goals     -- per-player target per stat key; upsertable
```

### Parsing pipeline (`src/lib/statParser.ts`)
1. `parseCSV` / `parseXLSX` → raw rows
2. `detectPlayerColumn` — heuristic matching header names against `['name', 'player', 'athlete', '#', ...]`
3. `resolveColumn` — alias registry maps 40+ common header variants to standard stat keys (e.g. `pts`, `points` → `points`; `3pm`, `tpm` → `three_made`)
4. `matchPlayers` — exact match then last-name fallback against the profiles table
5. `buildStatEntries` — constructs the Supabase insert payload

### Standard stat keys
`points`, `total_reb`, `assists`, `steals`, `blocks`, `turnovers`, `minutes`, `fg_made`, `fg_attempted`, `three_made`, `three_attempted`, `ft_made`, `ft_attempted`, `off_reb`, `def_reb`, `fouls`

Any unrecognized column is stored verbatim in the `custom` jsonb field.

### Key files
- `supabase/migrations/20260310000003_stats_feature.sql`
- `src/lib/statParser.ts`
- `src/hooks/useStatUploads.ts`
- `src/pages/admin/Stats.tsx`

### supabase-js insert pattern
Due to a known type-inference issue in supabase-js v2.98.0, inserts use an explicit cast:
```ts
const { data, error } = await (supabase as any)
  .from('stat_uploads')
  .insert({ ... })
  .select('id').single() as { data: { id: string } | null; error: { message: string } | null }
```

---

## F-04 — Player Stats Visualizer

**Goal:** Players see their own stats in a "weekly wrapped" format with anonymous team benchmarks for context. Coaches can leave annotations per session and set personal goals per stat.

### Data flow
`usePlayerStats` fetches three things in parallel:
1. Player's own `stat_entries` with upload metadata joined
2. **All** team `stat_entries` (same uploads) — used for benchmark calculation only; player names are never exposed
3. Player's `stat_annotations` and `stat_goals`

Weekly aggregation is computed **client-side** (team is ~15 players, no need for a DB view):
- `groupByWeek` — buckets entries by Monday ISO date
- `aggregateWeek` — averages each stat across sessions within the week
- `contributionPct` — player value ÷ team total × 100; only displayed if ≥ 20%

### UI zones (`src/pages/app/Stats.tsx`)
1. **Weekly Wrapped card** — gold border, 4 hero stats, contribution % badges, team avg row
2. **Trend charts** — 6 recharts `LineChart` sparklines (brand red = player, dashed gray = team avg); only shown when >1 week of data exists
3. **Custom metric tiles** — grid of any coach-defined columns from the `custom` jsonb
4. **Goals progress bars** — horizontal bar showing current week vs target
5. **Coach Notes** — annotations with brand red left-border accent

### Key files
- `src/hooks/usePlayerStats.ts`
- `src/pages/app/Stats.tsx`

### Privacy
Players see their own rows only (RLS: `player_id = auth.uid()`). Team benchmark data is aggregated on the client; no individual peer stats are ever surfaced in the UI.

---

## Common patterns

### RLS helper
```sql
create or replace function get_my_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid()
$$;
```
Used in every table policy to avoid infinite recursion on the `profiles` table.

### Database type compatibility (supabase-js v2.98.0)
All tables in `src/types/database.ts` must include:
```ts
Relationships: never[]
```
And `Database.public` must include:
```ts
Views: Record<string, never>
Functions: Record<string, never>
```
Without these, supabase-js collapses insert types to `never`.

### Real-time subscriptions
```ts
supabase.channel('channel-name')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, callback)
  .subscribe()
// Always return () => supabase.removeChannel(channel) from useEffect
```

### Tailwind config custom colors
```js
// tailwind.config.js
colors: {
  brand: { DEFAULT: '#E51636', dark: '#B50F28', light: '#FF3354' },
  'near-black': '#100F0D',
  cream: '#F8F4F0',
  gold: '#FFC72C',
}
```
