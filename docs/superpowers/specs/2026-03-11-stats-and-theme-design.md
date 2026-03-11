# Stats Feature & Light Theme Design
**Date:** 2026-03-11
**Features:** F-03 Admin Stats Dashboard · F-04 Player Stats Visualizer · App-wide theme retheme
**Status:** Approved

---

## Context

RedBoard is a college women's basketball team app for Denison University (D3). Coaches upload CSV/XLSX stat sheets covering the whole team. Players should not see raw peer stats but the experience should be meaningfully competitive and developmentally beneficial.

---

## App-Wide Theme Change

**Direction: Warm Cream Base (Direction A)**

Flip the existing dark palette to a light editorial palette using colors already in the brand set:

| Role | Dark (current) | Light (new) |
|------|---------------|-------------|
| Page background | `near-black` (#100F0D) | `cream` (#F8F4F0) |
| Card background | `gray-900/70` | `white` |
| Card border | `gray-800` | `gray-200` |
| Primary text | `cream` | `near-black` |
| Secondary text | `gray-400` / `gray-500` | `gray-500` / `gray-600` |
| Accent | brand red (#E51636) | unchanged |
| Left border accent | brand red | unchanged |

No structural changes — same layout, components, and hierarchy. Red accents read more boldly on cream than on near-black. The warm undertone of cream (#F8F4F0) differentiates the app from generic white-background sports apps.

**Implementation scope:** `tailwind.config.js` semantic color reassignment + class sweep across all existing components (AppLayout, AdminLayout, FilmCard, Feed, Film, Login, AdminDashboard, AdminFilm).

---

## F-03 Admin Stats Dashboard

### Approach
Two-tier schema: standard NCAA D3 stats get typed columns (enabling reliable week-over-week trending); unrecognized columns land in a `custom jsonb` field (surfaced as "this week" highlights, not trended). Player identification is flexible — system detects name/number column, with manual override available.

### New npm packages
- **papaparse** — CSV parsing (client-side)
- **xlsx** — Excel/XLSX parsing (client-side)

### Database Schema

```sql
-- Upload metadata
stat_uploads (
  id          uuid primary key,
  created_by  uuid references profiles(id),
  label       text not null,              -- "vs. Oberlin" / "Thursday Practice"
  session_type text check (session_type in ('game', 'practice')),
  session_date date not null,
  created_at  timestamptz default now()
)

-- One row per player per upload
stat_entries (
  id          uuid primary key,
  upload_id   uuid references stat_uploads(id) on delete cascade,
  player_id   uuid references profiles(id) on delete cascade,
  -- Standard NCAA D3 stats (nullable)
  minutes     numeric, points      numeric,
  fg_made     numeric, fg_attempted numeric,
  three_made  numeric, three_attempted numeric,
  ft_made     numeric, ft_attempted numeric,
  off_reb     numeric, def_reb     numeric, total_reb numeric,
  assists     numeric, steals      numeric, blocks    numeric,
  turnovers   numeric, fouls       numeric,
  -- Custom / coach-defined columns
  custom      jsonb default '{}',
  created_at  timestamptz default now()
)

-- Coach notes per player per upload (visible only to that player)
stat_annotations (
  id          uuid primary key,
  upload_id   uuid references stat_uploads(id) on delete cascade,
  player_id   uuid references profiles(id) on delete cascade,
  note        text not null,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
)

-- Coach-set stat targets per player (persistent)
stat_goals (
  id          uuid primary key,
  player_id   uuid references profiles(id) on delete cascade,
  stat_key    text not null,   -- e.g. 'points', 'assists', or any custom key
  target      numeric not null,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now(),
  unique (player_id, stat_key)
)
```

**RLS:** `stat_entries` — players see only their own rows. `stat_annotations` — players see only rows where `player_id = auth.uid()`. `stat_goals` — players see only their own goals. Admins see all rows on all tables.

**Weekly aggregation:** computed at query time via `date_trunc('week', session_date)` grouping — no separate summary table needed at team size (~15 players).

### Standard Stat Aliases
The following column name variants all map to the same typed column:

| Typed column | Recognized aliases |
|---|---|
| `points` | PTS, Points, points, Pts |
| `rebounds` | REB, TRB, Rebounds, reb |
| `assists` | AST, Assists, ast |
| `steals` | STL, Steals, stl |
| `blocks` | BLK, Blocks, blk |
| `turnovers` | TO, TOV, Turnovers, to |
| `minutes` | MIN, Minutes, min |
| `fg_made` | FGM, fg_made |
| `fg_attempted` | FGA, fg_attempted |
| `three_made` | 3PM, TPM, three_made |
| `three_attempted` | 3PA, TPA, three_attempted |
| `ft_made` | FTM, ft_made |
| `ft_attempted` | FTA, ft_attempted |
| `off_reb` | OREB, OffReb, off_reb |
| `def_reb` | DREB, DefReb, def_reb |
| `fouls` | PF, Fouls, fouls |

Matching is case-insensitive. Unrecognized columns go to `custom` jsonb.

### Admin Upload Flow

1. **Form fields:** session label (text), session type toggle (Game / Practice), session date (date input, defaults today), file input (CSV / XLSX)
2. **Client-side parse:** on file selection, parse with PapaParse or xlsx; display preview panel:
   - Detected player identifier column (dropdown to override)
   - Table: recognized standard stats vs. unrecognized → custom
   - Player match list: profile name ↔ CSV row, unmatched rows flagged red
3. **Submit:** validate → insert `stat_uploads` → insert `stat_entries` per matched player → reset form → refresh history
4. **History list:** each upload card shows label, date, type badge, player count, delete button. Delete cascades to all `stat_entries`.

### Coaching Input (Admin Side)

**Annotations:** Each upload card has a per-player "Add note" action → inline player selector + text area → saved to `stat_annotations`. Note is visible only to that player, only for that upload week.

**Goals:** Collapsible "Player Goals" section on admin stats page. Coach selects player + stat key (from union of standard stat names + custom keys seen in recent uploads) + numeric target. Goals persist until deleted. Rendered as progress bars on player's stats page.

---

## F-04 Player Stats Visualizer

### New npm package
- **recharts** — React charting library for trend line charts

### Page Layout (four zones, top to bottom)

#### Zone 1 — Weekly Wrapped Card
Visually distinct card with gold left border (`border-l-gold`). Appears when a new upload exists for the current week.

Contents:
- "Week of [Mon date]" label + session type badge
- 3–4 hero stats for that player this week — prioritised by how far above personal average each stat is
- Each hero stat shows: value (large), "Team Avg: X" (small below), "Team Best: X" (small below) — no player names on benchmarks
- **Contribution badges:** if a player's value exceeds 20% of the team's total for a stat that week, an inline tag appears — e.g. `↑ 24% of team steals` in brand red. Only shown when genuinely earned.
- Coaching annotation (if one exists for this upload) appears at the bottom of this card

#### Zone 2 — Trend Charts
Line charts (recharts) for standard stats over the last 8 weeks. Default to the 4 stats with the most data points for that player. Shown in a 2-column grid (mobile) / 3-column grid (desktop).

Each chart has three series:
- Player's weekly average — solid brand-red line
- Team average — dashed gray line, labeled "Team Avg"
- Team best — dotted cream/dark line, labeled "Team Best"

No player names on any line except the viewer's own.

#### Zone 3 — This Week's Custom Stats
Simple grid of stat tiles showing custom columns from the most recent upload. Label + value only — no trending, no benchmarks. Hidden entirely if no custom stats exist for the most recent upload.

#### Zone 4 — Goals Progress
Rendered only if the coach has set at least one goal for this player. Each goal shows as a horizontal progress bar: stat name, current value / target, percentage fill in brand red. Zone is completely hidden for players with no goals set.

---

## Implementation Order

1. App-wide light theme retheme (tailwind.config.js + component class sweep)
2. SQL migration — four new tables + RLS
3. `src/hooks/useStatUploads.ts` + `src/hooks/usePlayerStats.ts`
4. `src/lib/statParser.ts` — CSV/XLSX parsing + column alias mapping
5. Admin stats page — upload form + preview step + history list + coaching input
6. Player stats page — four zones, recharts integration
7. Feed integration — stats summary card in Latest section (if time permits)
