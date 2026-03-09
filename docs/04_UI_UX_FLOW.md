# UI/UX Flow & Navigation

## Primary navigation (recommended)

- Feed (home)
- Stats
- Film
- Wellness
- Playbook
- Profile/Settings

Admin-specific:

- Admin Dashboard
- Create Post (film/stats/playbook)
- Wellness Admin (create check + view responses)
- Manage Playbook
- Manage Stats Views

## Route expectations

- /login
- /app/feed
- /app/stats
- /app/film
- /app/wellness
- /app/playbook
- /admin (gated by role)

## Player experience rules

- Feed is the default landing page.
- Content cards should be:
  - readable on mobile
  - minimal clutter
  - clear CTAs: View Clip / View Chart / Complete Check / Open Playbook

## Playbook UX

- Tabs:
  - Quicks, BLOBs, SLOBs, Defense, etc.
- Each item: title + optional short description + open button
- PDF viewer must work on mobile (fallback if needed)

## Accessibility & polish

- Avoid tiny tap targets.
- Keep contrast readable.
- Ensure content works with slow connections (lazy load, skeletons)
