# Findings — RedBoard Production Readiness Analysis

## Top-Down Code Analysis (2026-05-10)

### Architecture confirmed
- Vite 5 + React 18 + TypeScript, react-router-dom v6
- Tailwind CSS 3 dark mode via `class` strategy
- @supabase/supabase-js 2.98.0 (note: not latest 2.x — check for breaking changes before upgrading)
- No server — pure static SPA + Supabase
- papaparse + xlsx (SheetJS) for CSV/XLSX parsing client-side
- recharts for stat charts

### File map
```
src/
  App.tsx                    — BrowserRouter + all routes
  main.tsx                   — React root mount
  index.css                  — Tailwind directives + custom CSS
  context/
    AuthContext.tsx           — session + profile + role state
    ThemeContext.tsx          — dim mode toggle (localStorage)
  components/
    AuthGuard.tsx             — route protection wrappers
    AppLayout.tsx             — player layout (top bar + bottom nav)
    AdminLayout.tsx           — admin layout (sidebar + mobile bottom nav)
    FilmCard.tsx              — Hudl iframe + signed URL video card
  pages/
    Login.tsx
    app/
      Feed.tsx               — unified feed + stat snapshots + wellness nudge
      Film.tsx               — player film list
      Stats.tsx              — practice weeks + game cards + trend charts
      Wellness.tsx           — check-in form / submitted review
      Playbook.tsx           — folder browser + lightbox
      Profile.tsx            — avatar upload + identity fields + sign out
    admin/
      Dashboard.tsx          — quick actions + status counts
      Film.tsx               — post creator + published list
      Stats.tsx              — CSV/XLSX upload + player matching + goals + annotations
      Wellness.tsx           — form builder + schedule calendar + today dashboard
      Playbook.tsx           — folder/file manager
  hooks/
    useFilmPosts.ts          — fetch + realtime subscription
    useUnreadCount.ts        — unread film badge
    useFeedItems.ts          — unified feed query
    usePlayerStats.ts        — stat entries + weekly aggregation + game enrichment
    useWellnessCheck.ts      — active form + today response + submit
    useWellnessForms.ts      — admin: all forms list
    useStatUploads.ts        — admin: upload history + publish toggle
    useDimMode.ts            — localStorage dim mode
  lib/
    supabase.ts              — Supabase client
    statParser.ts            — CSV/XLSX parsing, column aliasing, player matching
    greeting.ts              — time-based greeting string
  types/
    database.ts              — TypeScript interfaces + Database type
supabase/
  migrations/               — SQL migration files (12 files)
  migrations/Schema.sql     — current full schema snapshot (reference only)
```

### Database tables confirmed
- `profiles` — role, name, avatar_url, jersey_number, position, class_year
- `film_posts` — title, note, link_type (hudl|file), url, visibility (team|individual)
- `film_post_recipients` — junction: post_id + player_id
- `film_post_views` — unread tracking: post_id + player_id + viewed_at
- `stat_uploads` — label, session_type, session_date, is_published
- `stat_entries` — per-player per-upload stats + custom JSONB
- `stat_annotations` — coach notes on player upload performance
- `stat_goals` — per-player target values, unique constraint MISSING
- `wellness_forms` — title, questions JSONB, is_active
- `wellness_responses` — form_id, player_id, date, answers JSONB (unique constraint MISSING)
- `wellness_schedule` — maps dates to form_ids (referenced in code, absent from Schema.sql snapshot — need to verify migration exists)
- `playbook_folders` — name, sort_order
- `playbook_files` — folder_id, name, storage_path, mime_type, sort_order

### Storage buckets (all must be manually created — no automation exists)
- `avatars` — public read; players upload their own avatar
- `film-clips` — private; signed URLs (1 hour TTL)
- `playbook` — authenticated read; signed URLs (1 hour TTL) — CONFIRMED live bucket name is `playbook`; TECH_PREP doc typo (`playbook-files`) is wrong

### RLS architecture
- Uses `get_my_role()` SECURITY DEFINER function to avoid recursion
- Admin check: `get_my_role() = 'admin'`
- Player own-row: `auth.uid() = player_id`
- `stat_entries`: players can read ALL entries (for team average calculation) — this is intentional but undocumented; represents a data exposure tradeoff

### Real-time
- Only `film_posts` has a Realtime subscription (in `useFilmPosts.ts`)
- All other features use fetch-on-mount

### Known issues confirmed by code review

#### CRITICAL
1. No admin user management UI anywhere — Dashboard.tsx has no player CRUD
2. No forgot-password link in Login.tsx
3. No Capacitor, manifest.json, or iOS-specific anything
4. `wellness_responses` — no DB unique constraint on (form_id, player_id, date)
5. `stat_goals` — upsert uses `onConflict: 'player_id,stat_key'` but no UNIQUE constraint in schema
6. Wellness auto-activate is a React useEffect in AdminWellness.tsx — fires only when admin opens page
7. Storage buckets are manual-only setup with no documentation
8. No .env.example file

#### HIGH
9. No player name edit in admin UI — Profile.tsx locks name with a padlock icon, admin has no setter
10. `usePlayerStats` fetches ALL stat_entries: `supabase.from('stat_entries').select('*')` — no player filter
11. No push notifications
12. Playbook signed URLs expire after 1 hour with no refresh
13. No iOS safe area CSS (notch/dynamic island)
14. No last-login tracking

#### MEDIUM / iOS BLOCKERS
15. `window.confirm()` used in: AdminStats.tsx (delete upload), AdminPlaybook.tsx (delete folder/file), AdminWellness.tsx (delete form) — BLOCKED IN WKWebView
16. `window.open(url, '_blank')` used in Playbook.tsx for PDFs — needs @capacitor/browser
17. No iOS meta tags in index.html
18. No error boundary
19. AuthGuard behavior when profileError is set — may loop
20. README.md is stub/empty
21. No supabase/config.toml

### Dependencies with version notes
```json
"@supabase/supabase-js": "^2.45.4"  // Installed: 2.98.0
"react": "^18.3.1"
"react-dom": "^18.3.1"
"react-router-dom": "^6.28.0"
"recharts": "^3.8.0"
"papaparse": "^5.5.3"
"xlsx": "^0.18.5"                   // SheetJS — note: 0.18.x is last MIT-licensed version
```

### Capacitor requirements checklist
- [ ] Apple Developer Program account ($99/year enrollment)
- [ ] Mac with Xcode 15+ (required for iOS builds — cannot build iOS on Windows)
- [ ] @capacitor/core, @capacitor/cli, @capacitor/ios
- [ ] Bundle ID registered: com.denisonwbb.redboard (or similar)
- [ ] All window.confirm() replaced before building
- [ ] All window.open() replaced or handled
- [ ] index.html iOS meta tags added
- [ ] Safe area insets in CSS
- [ ] App icons at all required sizes

### Edge Functions needed
1. `create-player` — uses service role to create auth user + set profile name
2. `delete-player` — uses service role to delete auth user
3. `wellness-auto-activate` — activates today's scheduled wellness form (called by cron)

### pg_cron SQL for wellness auto-activation
```sql
-- Run at 5:00 AM UTC = midnight EDT (UTC-5)
SELECT cron.schedule(
  'wellness-auto-activate',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.edge_function_url') || '/wellness-auto-activate',
    headers := '{"Authorization": "Bearer " || current_setting(''app.service_role_key'')}'::jsonb
  );
  $$
);
```
(Alternative: GitHub Actions scheduled workflow calling the Edge Function)
