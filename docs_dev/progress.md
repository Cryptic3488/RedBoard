# Progress Log — RedBoard Production Readiness

---

## Session: 2026-05-10

### Completed
- [x] Full top-down codebase analysis (all src/ files, all supabase/migrations/ files, Schema.sql, TECH_PREP.md)
- [x] Identified 24 distinct gaps across critical / high / medium priority categories
- [x] Created comprehensive 9-phase production plan in `task_plan.md`
- [x] Documented all findings in `findings.md`
- [x] Confirmed iOS App Store path via Capacitor

### Status
**PLANNING COMPLETE — ready to begin Phase 0 implementation.**

All phases documented. No implementation has started yet.

---

## Phase Execution Log

### Phase 0 — Foundation Fixes
- Status: COMPLETE
- Started: 2026-05-10
- Completed: 2026-05-10
- Deliverables:
  - `supabase/migrations/20260510000001_phase0_constraints.sql` — UNIQUE constraints on wellness_responses and stat_goals
  - `.env.example` — updated with VITE_APP_URL variable
  - `.env.local` — added VITE_APP_URL=http://localhost:5173
  - `supabase/config.toml` — local dev config with project_id and redirect URLs
  - `supabase/storage-setup.md` — full bucket creation instructions (Dashboard + CLI)
  - `README.md` — added migration 11, fixed avatars policy, added VITE_APP_URL note
  - `docs/TECH_PREP.md` — fixed `playbook-files` typo to `playbook` (2 occurrences)
- Notes: wellness_schedule table confirmed exists via migration 20260325000001. AuthGuard profileError handling deferred to Phase 2 as planned.

### Phase 1 — Admin User Management
- Status: CODE COMPLETE (awaiting deployment)
- Started: 2026-05-10
- Completed: 2026-05-10
- Deliverables:
  - `supabase/migrations/20260510000002_admin_profile_update.sql` — admin update policy on profiles (run in SQL Editor)
  - `supabase/functions/create-player/index.ts` — Edge Function (deploy: `supabase functions deploy create-player`)
  - `supabase/functions/delete-player/index.ts` — Edge Function (deploy: `supabase functions deploy delete-player`)
  - `src/components/ConfirmModal.tsx` — shared destructive-action modal (replaces window.confirm)
  - `src/pages/admin/Roster.tsx` — full roster management page (add/edit/delete players)
  - `src/components/AdminLayout.tsx` — Roster added to ADMIN_NAV
  - `src/App.tsx` — /admin/roster route added
  - `src/pages/admin/Dashboard.tsx` — Roster Quick Action + Players count tile (grid updated)

### Phase 2 — Auth UX
- Status: COMPLETE
- Started: 2026-05-10
- Completed: 2026-05-10
- Deliverables:
  - `src/pages/ForgotPassword.tsx` — email form → resetPasswordForEmail, success state
  - `src/pages/ResetPassword.tsx` — PASSWORD_RECOVERY event listener, new password form, success redirect
  - `src/pages/Login.tsx` — "Forgot password?" link added above password field
  - `src/App.tsx` — /forgot-password and /reset-password public routes added
  - `src/components/AuthGuard.tsx` — profileError state handled with ProfileErrorScreen + sign out
  - `src/components/ErrorBoundary.tsx` — class component error boundary wrapping entire app
  - `src/main.tsx` — ErrorBoundary wraps App
- Notes: redirectTo URLs already whitelisted in supabase/config.toml. Also add to Supabase Dashboard → Auth → URL Configuration before deploying.

### Phase 3 — RLS & Security Hardening
- Status: COMPLETE
- Started: 2026-05-10
- Completed: 2026-05-10
- Deliverables:
  - `supabase/migrations/20260510000003_team_stat_aggregates.sql` — SECURITY DEFINER fn `get_team_stat_aggregates()`, returns (upload_id, session_type, session_date, stat_key, avg_val, max_val, sum_val, n); only published uploads; grant to authenticated
  - `src/hooks/usePlayerStats.ts` — replaced `allEntries` broad SELECT with `supabase.rpc('get_team_stat_aggregates')`; converted to Promise.all; team averages now real cross-team aggregates, not player's own data
- Notes: Existing RLS was already correct (players select own published stat_entries). The bug was that the broad allEntries query silently returned only the player's own rows due to RLS, making "team averages" show the player's own stats — now fixed with real aggregation function. Run migration in Supabase SQL Editor before deploying.

### Phase 4 — Wellness Reliability
- Status: COMPLETE (pending deployment steps)
- Started: 2026-05-10
- Completed: 2026-05-10
- Deliverables:
  - `supabase/migrations/20260510000004_wellness_auto_activate.sql` — auto_activate_wellness() SECURITY DEFINER fn + pg_cron job at 00:00 UTC daily
  - `src/pages/admin/Wellness.tsx` — removed autoActivatedRef, removed client-side auto-activate useEffect, removed useRef import, updated calendar hint text
- Deployment steps required:
  1. Enable pg_cron extension: Dashboard → Database → Extensions → pg_cron → Enable
  2. Run the migration in SQL Editor
  3. Verify cron job in Dashboard → Database → Cron jobs
- Notes: Cron runs at midnight UTC. Consider changing to '0 5 * * *' for midnight Eastern (EST). window.confirm on handleDelete left for Phase 5.

### Phase 5 — iOS Compatibility Prep
- Status: COMPLETE
- Started: 2026-05-10
- Completed: 2026-05-10
- Deliverables:
  - `index.html` — viewport-fit=cover; apple-mobile-web-app-capable/status-bar-style/title; theme-color #C8102E; mobile-web-app-capable
  - `src/index.css` — .pb-safe and .pb-nav-safe utility classes for env(safe-area-inset-bottom)
  - `src/components/AppLayout.tsx` — pb-nav-safe on main, pb-safe on bottom nav
  - `src/components/AdminLayout.tsx` — pb-safe on mobile bottom nav
  - `src/pages/admin/Stats.tsx` — ConfirmModal replaces window.confirm for delete upload
  - `src/pages/admin/Playbook.tsx` — ConfirmModal replaces 2x window.confirm; in-app iframe PDF viewer replaces window.open
  - `src/pages/admin/Wellness.tsx` — ConfirmModal replaces window.confirm for delete form
  - `src/pages/app/Playbook.tsx` — in-app iframe PDF viewer replaces window.open; note to swap for @capacitor/browser in Phase 6 if needed
- Notes: All window.confirm and window.open eliminated from app. iframe PDF viewer works in browser and Capacitor WKWebView. Safe-area CSS utilities added — requires viewport-fit=cover in index.html (done). Phase 6 (Capacitor) can now proceed when Mac is available.

### Phase 6 — Capacitor iOS Wrapper
- Status: NOT STARTED
- Started: —
- Completed: —
- Notes: Requires Mac with Xcode; cannot be done on Windows

### Phase 7 — App Store Submission
- Status: NOT STARTED
- Started: —
- Completed: —
- Notes: Apple review typically 24-48 hours; plan for potential rejection round

### Phase 8 — Post-Launch Hardening
- Status: NOT STARTED
- Started: —
- Completed: —
- Notes: Push notifications require APNs certificate setup in Apple Developer Dashboard

---

## Open Questions (for user)

| Question | Status | Answer |
|----------|--------|--------|
| Mac availability for Phase 6 | ANSWERED | No Mac now; possibly in weeks. Phase 6 is deferred. Phases 0-5 proceed on Windows. |
| Apple Developer Program | ANSWERED | Publishing under Mynago's account. Need to confirm: does Mynago already have an Apple Developer org account? If new org enrollment, needs D-U-N-S number (can take 1-2 weeks). |
| Production URL | ANSWERED | redboard.drewn8n.com — user owns drewn8n.com. Subdomain to be set up when MVP ready. |
| Bucket name (playbook vs playbook-files) | OPEN | Code uses `playbook`. Need to confirm what bucket name exists in the live Supabase project after unpause. |
| Phase 3 stat visibility | ANSWERED | Aggregated team numbers only via SECURITY DEFINER function. No individual rows exposed. |
| Supabase project status | ANSWERED | Unpaused as of 2026-05-10. Verify live migration state before writing new migrations. |
| Push notification timing | OPEN | What time should wellness reminders fire? (Phase 8) |
| App name final | OPEN | Working name is "RedBoard". Confirm for App Store listing. |
| Privacy policy host | OPEN | Where to host the required Apple privacy policy URL? (Phase 7) |
