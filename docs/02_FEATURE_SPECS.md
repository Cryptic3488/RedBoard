# Feature Specs & Acceptance Criteria

## How to use this doc

Each feature has:

- Goal
- Primary flows (Admin + Player)
- Data needs
- RLS intent
- Done When checklist

---

## F-01 — User Authentication & Role Management (Core)

Goal:

- Supabase-based login with admin and player roles.

Flows:

- Admin logs in -> admin dashboard routes
- Player logs in -> player feed routes

Data needs:

- profiles: { id (uuid), role ('admin'|'player'), name, created_at }

RLS intent:

- Users can read their own profile.
- Only admins can manage content tables.

Done when:

- [ ] Auth works for Admin + Player
- [ ] Role-based routing enforced
- [ ] RLS policies prevent cross-role writes/reads where applicable

---

## F-02 — Stats Dashboard (Coaches) (Core)

Goal:

- Admin uploads practice/game data and chooses charts to share.

Flows:

- Admin uploads dataset (Sheets or CSV)
- Admin selects chart types + filters
- Admin publishes to team or subgroups

Data needs:

- stats_datasets: metadata + storage pointer or json blob
- stats_views: saved chart configs visible to players

RLS intent:

- Admins CRUD datasets + views
- Players read only published views

Done when:

- [ ] Admin can upload and create at least 2 chart configurations
- [ ] Admin can publish/unpublish a chart view

---

## F-03 — Stats Viewer (Players) (Core)

Goal:

- Players view coach-curated charts in mobile-friendly UI.

Flows:

- Player opens Stats section OR sees chart post in Feed
- Player views chart + summary + updated date

Data needs:

- read-only access to published stats_views

RLS intent:

- Players can read only published views

Done when:

- [ ] Player sees only coach-curated charts
- [ ] Mobile UI is readable and fast

---

## F-04 — Hudl Film Clip Sharing (Core)

Goal:

- Admin sends Hudl links with notes to player(s)/group(s).

Flows:

- Admin creates film post: {hudl_url, title, notes, recipients}
- Player opens film post from feed -> opens Hudl link + reads notes

Data needs:

- film_posts: { id, title, url, notes, recipient_scope, created_by, created_at }

RLS intent:

- Admins create posts
- Players read only posts they are targeted for

Done when:

- [ ] Admin can send to team and individual
- [ ] Player sees correct targeted posts only

---

## F-05 — Daily Wellness Check (Core)

Goal:

- Coaches send daily forms; players submit responses; reminders supported.

Flows:

- Admin sends wellness check (daily)
- Player completes form (mood, soreness, sleep, etc.)
- Admin views aggregated results

Data needs:

- wellness_checks: { id, date, questions, created_by }
- wellness_responses: { check_id, user_id, answers, created_at }

RLS intent:

- Players can create their own response and read their own history
- Admins can read all responses

Done when:

- [ ] Player can submit once per check
- [ ] Admin can view all responses with basic aggregation

---

## F-06 — Virtual Playbook (Core)

Goal:

- Replace physical binders with categorized PDF playbook.

Flows:

- Admin uploads PDF and tags category (Quicks, BLOBs, SLOBs, Defense, etc.)
- Player browses tabs -> opens PDF

Data needs:

- playbook_items: { id, title, category, storage_path, created_by, created_at }

RLS intent:

- Admins CRUD playbook_items
- Players read only

Done when:

- [ ] Admin uploads and categorizes PDFs
- [ ] Players can browse categories and view PDFs on mobile

---

## F-07 — Push Notifications (Stretch)

Goal:

- Push alerts for wellness checks, new film clips, playbook updates.

Constraints:

- Must fall back to in-app notifications if unsupported.

Done when:

- [ ] At least one alert type works reliably OR fallback implemented

---

## F-08 — Group vs Individual Messaging (Core)

Goal:

- Target film clips/notes to individuals or the whole team.

Done when:

- [ ] Recipient targeting works and is enforced by RLS

---

## F-09 — Mobile-Responsive Design (Core)

Goal:

- Full mobile + desktop compatibility.

Done when:

- [ ] All key screens pass mobile layout sanity check
- [ ] No horizontal scroll; primary interactions reachable on mobile

---

## F-10 — Content Feed (Players) (Core)

Goal:

- Unified chronological feed for all coach-sent content.

Done when:

- [ ] Feed shows film/stats/wellness/playbook updates in timeline
- [ ] Posts are filtered by recipient targeting
