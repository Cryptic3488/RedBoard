# RedBoard — Project Context

## One-liner

RedBoard is a mobile + desktop web app for the Denison University Women’s Basketball program that centralizes coaching workflow: film review, stats visualization, wellness monitoring, and a digital playbook — in one role-based platform.

## Problem we’re solving

Coaches and players currently juggle Hudl, Google Sheets, printed binders, and texts. This fragmentation causes missed info, friction, and unnecessary overhead. RedBoard unifies the loop: coaches push content; players consume it cleanly.

## Target users

### Admins (Coaches / Staff)

- Upload stats data and choose what players see
- Share Hudl clips + notes (team or individuals)
- Send wellness check forms and review results
- Upload/manage the virtual playbook

### Users (Players)

- View coach-curated stats & charts
- Watch/visit shared Hudl clips + read notes
- Complete wellness check-ins
- Browse playbook PDFs by category tabs
- Consume everything via a single chronological feed

## Core modules

- Auth & Role Management (Admin vs Player)
- Stats Dashboard (coach-side) + Stats Viewer (player-side)
- Film Clip Sharing (Hudl link + notes)
- Daily Wellness Check (forms + reminders)
- Virtual Playbook (PDF uploads organized by tabs)
- Content Feed (players see all content chronologically)
- Mobile-responsive UI across all pages

## Non-goals (important)

- No Hudl API scraping/integration (manual shareable links only)
- No “raw data dump” UX — coaches curate what players see
- Do not rely on frontend-only permission checks (RLS is mandatory)
- Avoid large scope expansions without adding to backlog first

## Definition of success

- Coaches can push critical content in minutes from one place.
- Players can reliably find what they need without hunting across tools.
- Role-based security holds even if someone manipulates the client.
