# Stack & Constraints (Do Not Drift)

## Required stack (current plan)

Frontend:

- Vite
- Tailwind
- Chart.js (or equivalent lightweight charting)

Backend:

- Supabase Auth
- Supabase Postgres
- Supabase Storage (playbook PDFs, optional assets)
- Supabase Edge Functions (for server-side logic / events / notifications)
- supabase-js SDK for database operations

## Hard constraints

Security:

- RLS must enforce Admin vs Player access.
- Never depend on “hidden UI” for security.
- Never put service-role keys in the client.

UX:

- Must be mobile-responsive and readable for players.
- Player-facing views should be “clean, curated, read-focused.”
- Players land on a unified feed first (home = content stream).

Integration boundaries:

- Hudl: manual shareable links (no API).
- Stats uploads: Google Sheets import preferred; CSV fallback allowed.
- Push notifications are a stretch; must have graceful fallback.

Reliability:

- Any feature that can’t ship safely must degrade gracefully:
  - Push notifications -> in-app banners
  - Sheets OAuth -> CSV upload parse
  - PDF performance -> PDF streaming / compression / images
