# Player Profile Page — Design Spec
Date: 2026-03-25

## Overview

A player-facing Profile page at `/app/profile`, accessed via a tappable avatar circle in the AppLayout header (not a 6th bottom nav tab). Covers identity fields, avatar upload, soft dim mode, and sign out.

---

## Navigation Entry Point

- Small avatar circle (32px) added to the top-right of the AppLayout header
- Shows uploaded photo or monogram fallback (first initial, brand red bg)
- Navigates to `/app/profile` on tap
- Route added to App.tsx under the player guard

---

## Profile Page Layout (`/app/profile`)

### Avatar block
- 96px circle, centered, top of page
- Shows uploaded photo or monogram fallback
- Tap → file picker (image/* only, max 5MB)
- "Change photo" label below

### Identity card
- **Name** — read-only, lock icon indicates admin-set
- **Jersey #** — numeric input, 1–99
- **Position** — segmented control: G / F / C (stores 'Guard' / 'Forward' / 'Center')
- **Class year** — segmented control: Fr / So / Jr / Sr

Save button visible only when fields are dirty. Single PATCH call on save.

### Appearance card
- "Dim mode" label + toggle switch
- Instant effect, persisted in localStorage

### Account card
- "Sign out" in brand red

---

## Data & Storage

### Migration
Add to `profiles` table:
```sql
avatar_url    text,
jersey_number smallint check (jersey_number between 1 and 99),
position      text check (position in ('Guard', 'Forward', 'Center')),
class_year    text check (class_year in ('Fr', 'So', 'Jr', 'Sr'))
```

### RLS
New policy: players can UPDATE their own row (avatar_url, jersey_number, position, class_year only). Role and name remain admin-only.

### Storage
- Bucket: `avatars` — public (no signed URL expiry)
- Path: `{user_id}/avatar.{ext}` — overwrites on re-upload, no orphan cleanup needed

### AuthContext
- Expand select to include new profile fields
- Update `Profile` type in `database.ts`

---

## Dim Mode

- Enable `darkMode: 'class'` in `tailwind.config.js`
- `useDimMode` hook: reads/writes localStorage key `redboard-dim`, toggles `dark` class on `document.documentElement`
- Called once in AppLayout so class is set before children render
- Dark variants on three layers only (soft dim, not full dark):
  - Page bg: `bg-cream dark:bg-[#1C1C1E]`
  - Cards: `bg-white/80 dark:bg-white/[0.06]`
  - Header/nav: `dark:bg-[#242424]/90`
  - Primary text: `text-near-black dark:text-gray-100`
- Brand red, gold, and borders unchanged — preserves identity

---

## Files Affected

| File | Change |
|---|---|
| `supabase/migrations/20260325000002_profile_fields.sql` | New columns + RLS update |
| `src/types/database.ts` | Profile type updated |
| `src/context/AuthContext.tsx` | Expand select, expose new fields |
| `src/hooks/useDimMode.ts` | New hook |
| `tailwind.config.js` | Add `darkMode: 'class'` |
| `src/components/AppLayout.tsx` | Header avatar, useDimMode call, dark: variants |
| `src/pages/app/Profile.tsx` | New page |
| `src/App.tsx` | Add `/app/profile` route |
| Player page files (Feed, Stats, Film, Wellness, Playbook) | Add `dark:` variants to cards/backgrounds |

---

## Deferred (Backlog)

Career snapshot card (Option C) — see `docs/08_BACKLOG.md`. Data already available via `usePlayerStats`; no new DB work needed when ready.
