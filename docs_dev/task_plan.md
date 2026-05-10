# Task: RedBoard — Production Readiness & iOS App Store Release

## Goal
Take the RedBoard Vite + React + Supabase SPA from its current state to a fully production-ready
application available on the iOS App Store for Denison Women's Basketball (20-30 users).
The coaching staff is not technical — every admin-facing flow must be self-contained within the app.

---

## Phases

- [x] **Phase 0** — Foundation Fixes (DB constraints, env docs, storage automation)
- [ ] **Phase 1** — Admin User Management (create/edit/delete players from within the app)
- [ ] **Phase 2** — Auth UX (password reset flow, AuthGuard profileError handling, error boundary)
- [ ] **Phase 3** — RLS & Security Hardening (stat_entries team query, unique constraints in DB)
- [ ] **Phase 4** — Wellness Reliability (Edge Function cron for schedule auto-activate)
- [ ] **Phase 5** — iOS Compatibility Prep (remove confirm() dialogs, safe area, PWA meta tags)
- [ ] **Phase 6** — Capacitor iOS Wrapper (install, configure, build, TestFlight)
- [ ] **Phase 7** — App Store Submission (metadata, screenshots, privacy policy, review)
- [ ] **Phase 8** — Post-Launch Hardening (push notifications, login tracking, signed URL refresh)

---

## Phase 0: Foundation Fixes

### 0-A  DB Constraints (migration)
- [ ] Add `UNIQUE (form_id, player_id, date)` to `wellness_responses`
- [ ] Add `UNIQUE (player_id, stat_key)` to `stat_goals`
- [ ] Verify `wellness_schedule` table exists in Schema.sql (referenced in code but absent from Schema.sql snapshot)
- [ ] Reconcile storage bucket name: code uses `playbook`, TECH_PREP says `playbook-files` — pick one and fix

### 0-B  Storage Bucket Setup Documentation / Script
- [ ] Create `supabase/storage-setup.md` — step-by-step for creating `avatars`, `film-clips`, `playbook` buckets with correct policies
- [ ] OR write a Supabase Edge Function / SQL script to create buckets programmatically if API supports it

### 0-C  Environment Variables
- [ ] Create `.env.example` at repo root with all required and optional variables
- [ ] Update `README.md` with full local dev setup instructions (install, env, supabase CLI, migrations)

### 0-D  supabase/config.toml
- [ ] Add `supabase/config.toml` so `supabase start` works for local development

---

## Phase 1: Admin User Management

### 1-A  Player Roster Page (new `/admin/roster`)
- [ ] Add "Roster" to `ADMIN_NAV` in `AdminLayout.tsx`
- [ ] Create `src/pages/admin/Roster.tsx`
- [ ] Add route `/admin/roster` in `App.tsx`

### 1-B  Invite / Create Player
- [ ] Use Supabase Admin API (`supabase.auth.admin.createUser`) from an Edge Function (never expose service role key to client)
- [ ] Create Edge Function `create-player` — accepts `{ email, name, password }`, creates auth user + sets profile name
- [ ] Roster page: "Add Player" form (name, email, temporary password)
- [ ] On success: show confirmation with player's login credentials

### 1-C  Edit Player Profile (name, role, position, jersey, class year)
- [ ] Roster page: edit row inline or via modal
- [ ] Admin-only update policy on `profiles` already exists — use it to update `name`, `jersey_number`, `position`, `class_year`

### 1-D  Delete / Deactivate Player
- [ ] Edge Function `delete-player` — calls `supabase.auth.admin.deleteUser(id)`
- [ ] Confirm with custom modal (not `window.confirm`) before calling
- [ ] Cascade delete: all stat_entries, wellness_responses, film_post_views already cascade via FK on profiles

### 1-E  Admin Dashboard: Roster Count
- [ ] Add "Players" count tile to `AdminDashboard.tsx` status strip

---

## Phase 2: Auth UX

### 2-A  Forgot Password Flow
- [ ] Add "Forgot password?" link to `Login.tsx`
- [ ] Create `src/pages/ForgotPassword.tsx` — calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
- [ ] Create `src/pages/ResetPassword.tsx` — handles the magic link callback, calls `supabase.auth.updateUser({ password })`
- [ ] Add routes `/forgot-password` and `/reset-password` as public routes in `App.tsx`
- [ ] Configure Supabase email templates (reset password link)
- [ ] Set `redirectTo` to the deployed app URL + `/reset-password`

### 2-B  AuthGuard profileError Handling
- [ ] Read `AuthGuard.tsx` — confirm it does not loop when `profileError` is set
- [ ] If authenticated but `profileError !== null`: show an error screen ("Account setup incomplete. Contact your coach.") instead of redirecting to login in a loop

### 2-C  React Error Boundary
- [ ] Create `src/components/ErrorBoundary.tsx` (class component)
- [ ] Wrap `<App />` in `main.tsx` with `<ErrorBoundary>`
- [ ] Fallback UI: branded error page with "Reload app" button

---

## Phase 3: RLS & Security Hardening

### 3-A  stat_entries Team Query
- [ ] Audit: check current RLS policy on `stat_entries` — does it allow players to read ALL entries or just their own?
- [ ] Decision: for team averages to work, players MUST be able to read all published entries OR we add a Postgres function
- [ ] Option A (current): keep broad read on stat_entries for published uploads — acceptable at 20-30 users
- [ ] Option B (preferred): add a Postgres function `get_team_stat_averages(upload_id)` with SECURITY DEFINER that returns aggregated data only — zero individual exposure
- [ ] Implement whichever is chosen and add migration

### 3-B  Confirm unique constraints are applied
- [ ] After Phase 0 migration: verify in Supabase Dashboard that constraints are active
- [ ] Test duplicate wellness response submission — must 409 conflict

### 3-C  profiles read policy
- [ ] Verify migration `20260310000002_profiles_read_all.sql` — confirm players can read all profiles (needed for admin film recipient picker and stat matching)
- [ ] If players can read all profiles, that is intentional — document it

---

## Phase 4: Wellness Reliability

### 4-A  Edge Function: `wellness-auto-activate`
- [ ] Create `supabase/functions/wellness-auto-activate/index.ts`
- [ ] Logic: query `wellness_schedule` for today's date → deactivate current active form → activate scheduled form
- [ ] Use service role key (server-side only, never exposed to client)
- [ ] Deploy function to Supabase

### 4-B  Cron Job
- [ ] Set up Supabase cron (pg_cron extension) or external cron (GitHub Actions scheduled workflow) to call the Edge Function at midnight UTC daily
- [ ] Preferred: `pg_cron` via a migration — `SELECT cron.schedule('wellness-activate', '0 5 * * *', ...)` (5am UTC = midnight EDT)

### 4-C  Remove client-side auto-activate logic
- [ ] Once Edge Function + cron is live, remove the `autoActivatedRef` useEffect from `AdminWellness.tsx`
- [ ] Keep manual "Set active" button in the UI for coach overrides

### 4-D  DB unique constraint
- [ ] Included in Phase 0-A — verify it is in place before this phase

---

## Phase 5: iOS Compatibility Prep

### 5-A  Replace all `window.confirm()` calls
Files to update:
- [ ] `src/pages/admin/Stats.tsx` — `confirm('Delete this upload...')` and delete goal (no confirm currently)
- [ ] `src/pages/admin/Film.tsx` — no confirm currently (delete just fires)
- [ ] `src/pages/admin/Playbook.tsx` — `confirm('Delete folder...')` and `confirm('Remove file...')`
- [ ] `src/pages/admin/Wellness.tsx` — `confirm('Delete this form...')`
- [ ] Create shared `src/components/ConfirmModal.tsx` — reusable modal with title, message, confirm/cancel buttons in brand style
- [ ] All delete actions must use `ConfirmModal` state pattern: `confirmState: { open, title, message, onConfirm } | null`

### 5-B  Replace `window.open()` for PDF files
- [ ] `src/pages/app/Playbook.tsx` — `window.open(url, '_blank')` for PDFs — works in Safari but needs review in Capacitor WKWebView
- [ ] Install `@capacitor/browser` plugin OR use `Browser.open({ url })` from Capacitor
- [ ] Detect Capacitor environment at runtime: `import { Capacitor } from '@capacitor/core'` then branch

### 5-C  iOS Meta Tags & PWA Setup in `index.html`
- [ ] Add `<meta name="apple-mobile-web-app-capable" content="yes">`
- [ ] Add `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- [ ] Add `<meta name="apple-mobile-web-app-title" content="RedBoard">`
- [ ] Add `<link rel="apple-touch-icon" href="/icons/icon-180.png">` (create icon assets)
- [ ] Add `<meta name="theme-color" content="#C8102E">`
- [ ] Create `public/manifest.json` for PWA baseline

### 5-D  Safe Area Insets
- [ ] Add `env(safe-area-inset-bottom)` padding to bottom nav in `AppLayout.tsx` and `AdminLayout.tsx`
- [ ] Add `env(safe-area-inset-top)` padding to top header
- [ ] Use `viewport-fit=cover` in viewport meta tag
- [ ] Test on iPhone with notch/dynamic island

### 5-E  iOS-specific CSS tweaks
- [ ] Remove `-webkit-tap-highlight-color` flash on buttons (add to `index.css`)
- [ ] Add `-webkit-overflow-scrolling: touch` for scroll containers
- [ ] Disable overscroll bounce on main content areas where it looks broken
- [ ] Ensure `position: fixed` elements work correctly (bottom nav, modals)

### 5-F  App Icons
- [ ] Design/export icons at: 1024x1024 (App Store), 180x180 (iPhone), 167x167 (iPad Pro), 152x152 (iPad), 120x120 (iPhone 2x), 87x87 (iPhone 3x)
- [ ] Place in `public/icons/` and reference in `index.html` + Capacitor config

---

## Phase 6: Capacitor iOS Wrapper

### 6-A  Install Capacitor
- [ ] `npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/browser`
- [ ] `npx cap init RedBoard com.denisonwbb.redboard --web-dir dist`
- [ ] Update `capacitor.config.ts` with correct `appId`, `appName`, `webDir: 'dist'`, `server.url` for dev

### 6-B  Configure Capacitor
- [ ] Set iOS deployment target to iOS 16+ in `capacitor.config.ts`
- [ ] Configure `server.allowNavigation` for Supabase URL and Hudl embeds
- [ ] Add Content Security Policy headers to allow Supabase WSS connections

### 6-C  Add iOS Platform
- [ ] `npx cap add ios`
- [ ] `npm run build && npx cap sync`
- [ ] Open `npx cap open ios` — verify Xcode project loads

### 6-D  Xcode Configuration
- [ ] Set Bundle Identifier to `com.denisonwbb.redboard`
- [ ] Set version to `1.0.0`, build number to `1`
- [ ] Sign with Apple Developer team certificate
- [ ] Set deployment target to iOS 16.0
- [ ] Add required capabilities: Push Notifications (for Phase 8)

### 6-E  TestFlight Build
- [ ] Run `npm run build && npx cap sync`
- [ ] Archive in Xcode: Product > Archive
- [ ] Upload to App Store Connect via Xcode Organizer
- [ ] Add internal testers (coach + players) to TestFlight
- [ ] Collect feedback over 1-2 week beta period

### 6-F  Capacitor Plugins Needed
- [ ] `@capacitor/push-notifications` — Phase 8
- [ ] `@capacitor/browser` — for PDF/Hudl external links
- [ ] `@capacitor/status-bar` — control status bar appearance
- [ ] `@capacitor/splash-screen` — custom branded splash screen

---

## Phase 7: App Store Submission

### 7-A  App Store Connect Setup
- [ ] Create app record in App Store Connect
- [ ] Bundle ID: `com.denisonwbb.redboard`
- [ ] Category: Sports
- [ ] Age rating: 4+ (no objectionable content)

### 7-B  App Metadata
- [ ] App name: "RedBoard — Denison WBB"
- [ ] Subtitle: "Film, Stats & Wellness"
- [ ] Description: (write ~500 word coach-facing description)
- [ ] Keywords: basketball, team, film, stats, wellness, coaching, denison
- [ ] Support URL: (GitHub repo or email)
- [ ] Privacy Policy URL: (required — must host publicly)

### 7-C  Screenshots
- [ ] Required sizes: 6.9" (iPhone 16 Pro Max), 6.7" (iPhone 15 Plus), 6.5" (iPhone 11 Pro Max)
- [ ] Capture: Login, Feed, Film, Stats, Wellness, Playbook, Profile, Admin Dashboard
- [ ] Optional: iPad screenshots if submitting for iPad

### 7-D  Privacy Policy
- [ ] Create a simple privacy policy document covering:
  - Data collected: email, name, performance statistics, wellness responses
  - Data storage: Supabase (AWS infrastructure)
  - Data sharing: not shared with third parties
  - Contact info for deletion requests
- [ ] Host at a public URL (GitHub Pages or Netlify simple page)

### 7-E  App Review Submission
- [ ] Fill out export compliance (no encryption beyond HTTPS — answer "Yes" to standard HTTPS exemption)
- [ ] Submit for App Review
- [ ] Typical review time: 24-48 hours
- [ ] Respond promptly to any reviewer questions

---

## Phase 8: Post-Launch Hardening

### 8-A  Push Notifications
- [ ] Install `@capacitor/push-notifications`
- [ ] Create Supabase Edge Function `send-push-notification` — called by cron or DB trigger
- [ ] Configure APNs in Apple Developer Dashboard + App Store Connect
- [ ] Use Firebase Cloud Messaging (FCM) as the delivery layer OR direct APNs
- [ ] Player token storage: add `push_token` column to `profiles` table
- [ ] Register token on app open: `PushNotifications.register()` + upsert to `profiles`
- [ ] Notification triggers:
  - Daily wellness reminder (6am) if player hasn't submitted
  - New film post published
  - New stat upload published (for that player)

### 8-B  Player Login Tracking
- [ ] Add `last_seen_at timestamptz` column to `profiles` via migration
- [ ] Update `last_seen_at` on every app open / auth session restore in `AuthContext.tsx`
- [ ] Admin Roster page: show last seen date per player
- [ ] Admin Wellness dashboard: show "last seen" next to "Pending" players

### 8-C  Signed URL Refresh
- [ ] Playbook page: add a `useEffect` that refreshes signed URLs every 50 minutes (before 1-hour expiry)
- [ ] Film clips: same pattern in `FilmCard.tsx` for `link_type === 'file'`
- [ ] Alternative: increase signed URL TTL to 24 hours for playbook (less sensitive content)

### 8-D  Offline State Handling
- [ ] Add `navigator.onLine` listener in a `useOnlineStatus` hook
- [ ] Show a non-blocking toast/banner "No internet connection" when offline
- [ ] Disable submit buttons when offline to prevent silent failures

### 8-E  Multi-file Upload Progress (Playbook)
- [ ] Refactor `AdminPlaybook.tsx` upload loop to track per-file progress state
- [ ] Show file name + status (pending / uploading / done / error) for each file in the batch

---

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Use Capacitor (not React Native) | Avoids full rewrite; wraps existing Vite SPA; maintained by Ionic; best path for a single developer | 2026-05-10 |
| Edge Function for user creation | Service role key must never be in client JS; Edge Functions run server-side | 2026-05-10 |
| pg_cron for wellness schedule | Supabase supports pg_cron natively; no external cron service needed | 2026-05-10 |
| SECURITY DEFINER aggregation for stats | User confirmed: only aggregated team numbers visible; no individual stat rows exposed to other players; prevents toxic competitive environment | 2026-05-10 |
| Storage bucket name: `playbook` | Code uses `playbook`; TECH_PREP doc is wrong — fix the doc, keep the code | 2026-05-10 |
| Mac / Phase 6 is not an immediate blocker | User does not have a Mac now but may in weeks; Phases 0-5 are all Windows-compatible; Phase 6 waits for Mac availability | 2026-05-10 |
| Apple Developer account via Mynago | User is a test developer for Mynago; iOS app will be published under Mynago's Apple Developer account; need Mynago org D-U-N-S number confirmed | 2026-05-10 |
| Production URL: redboard.drewn8n.com | User owns drewn8n.com; subdomain redboard.drewn8n.com will be the deployment target; needed for Supabase Auth redirect URLs and Capacitor config | 2026-05-10 |
| Supabase project: live as of 2026-05-10 | Project was paused and just unpaused; migrations need to be verified against live DB state | 2026-05-10 |

---

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | — | — |

---

## Sequence Summary (dependency order)

```
Phase 0 → Phase 1 → Phase 2 → Phase 3
                              ↓
                         Phase 4
                              ↓
                         Phase 5 ← MUST complete before Phase 6
                              ↓
                         Phase 6 (TestFlight)
                              ↓
                         Phase 7 (App Store)
                              ↓
                         Phase 8 (Post-launch)
```

Phase 3 and Phase 4 can be worked in parallel.
Phase 5 must fully complete before Phase 6 begins (Capacitor will expose all confirm/open issues).
