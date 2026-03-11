# Task: F-03/F-04 Stats Feature + App-Wide Light Theme

## Goal
Implement the approved design from `docs/superpowers/specs/2026-03-11-stats-and-theme-design.md`:
1. Retheme the entire app from dark (near-black) to warm cream light palette
2. Build F-03: Admin stats upload (CSV/XLSX → two-tier DB schema)
3. Build F-04: Player stats visualizer (weekly wrapped, trend charts, benchmarks)

---

## Phases

- [ ] **Phase 0: Install packages** — papaparse, @types/papaparse, xlsx, recharts, @types/recharts
- [ ] **Phase 1: Light theme retheme** — tailwind.config.js + class sweep across all existing components
- [ ] **Phase 2: SQL migration** — stat_uploads, stat_entries, stat_annotations, stat_goals + RLS
- [ ] **Phase 3: Type definitions** — extend src/types/database.ts with stat types
- [ ] **Phase 4: stat parser lib** — src/lib/statParser.ts (CSV/XLSX parse, alias mapping, player matching)
- [ ] **Phase 5: Hooks** — useStatUploads.ts + usePlayerStats.ts
- [ ] **Phase 6: Admin stats page** — upload form + preview step + history + annotations + goals
- [ ] **Phase 7: Player stats page** — 4 zones: wrapped card, trend charts, custom tiles, goals bars
- [ ] **Phase 8: Build verification** — npm run build must pass zero errors

---

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Two-tier stat schema | Standard D3 stats get typed columns (reliable trending); custom columns go to jsonb (flexible, this-week only) | 2026-03-11 |
| Week-by-week aggregation | Practice-to-practice comparison too noisy given variable drills | 2026-03-11 |
| Warm cream light theme (Direction A) | Uses existing brand palette inverted; distinctive vs generic white; editorial tone | 2026-03-11 |
| 20% contribution threshold | Contribution badge only shown when genuinely earned; avoids hollow gamification | 2026-03-11 |
| recharts for trend lines | No viable pure-SVG alternative for multi-series line charts with labels | 2026-03-11 |
| papaparse + xlsx for parsing | Mature, zero-dependency, industry standard for each format | 2026-03-11 |
| Weekly aggregation at query time | Team size (~15 players) makes materialized view unnecessary overhead | 2026-03-11 |

---

## Key File Paths

### Existing (to modify)
- `tailwind.config.js` — add light semantic tokens
- `src/types/database.ts` — extend with stat table types
- `src/components/AppLayout.tsx` — theme class swap
- `src/components/AdminLayout.tsx` — theme class swap
- `src/components/FilmCard.tsx` — theme class swap
- `src/pages/Login.tsx` — theme class swap
- `src/pages/app/Feed.tsx` — theme class swap
- `src/pages/app/Film.tsx` — theme class swap
- `src/pages/app/Stats.tsx` — full rewrite
- `src/pages/admin/Dashboard.tsx` — theme class swap
- `src/pages/admin/Film.tsx` — theme class swap
- `src/pages/admin/Stats.tsx` — full rewrite

### New files
- `supabase/migrations/20260310000003_stats_feature.sql`
- `src/lib/statParser.ts`
- `src/hooks/useStatUploads.ts`
- `src/hooks/usePlayerStats.ts`
- `src/components/StatCard.tsx` — reusable stat tile
- `src/components/WrappedCard.tsx` — weekly wrapped card
- `src/components/TrendChart.tsx` — recharts line chart wrapper

---

## Theme Class Mapping

| Dark class | Light replacement |
|------------|------------------|
| `bg-near-black` | `bg-cream` |
| `bg-gray-900/70` | `bg-white/80` |
| `bg-gray-900/80` | `bg-white/90` |
| `bg-gray-900/90` | `bg-white` |
| `bg-gray-800` | `bg-gray-100` |
| `border-gray-800` | `border-gray-200` |
| `border-gray-800/60` | `border-gray-200/60` |
| `border-gray-700` | `border-gray-300` |
| `text-cream` | `text-near-black` |
| `text-gray-400` | `text-gray-600` |
| `text-gray-500` | `text-gray-500` |
| `text-gray-600` | `text-gray-400` |
| `text-gray-700` | `text-gray-300` |
| `ring-near-black` | `ring-cream` |

---

## Standard Stat Aliases

```ts
const STAT_ALIASES: Record<string, string> = {
  // points
  pts: 'points', points: 'points',
  // rebounds
  reb: 'total_reb', trb: 'total_reb', rebounds: 'total_reb',
  // assists
  ast: 'assists', assists: 'assists',
  // steals
  stl: 'steals', steals: 'steals',
  // blocks
  blk: 'blocks', blocks: 'blocks',
  // turnovers
  to: 'turnovers', tov: 'turnovers', turnovers: 'turnovers',
  // minutes
  min: 'minutes', minutes: 'minutes',
  // FG
  fgm: 'fg_made', fg_made: 'fg_made',
  fga: 'fg_attempted', fg_attempted: 'fg_attempted',
  // 3PT
  '3pm': 'three_made', tpm: 'three_made', three_made: 'three_made',
  '3pa': 'three_attempted', tpa: 'three_attempted', three_attempted: 'three_attempted',
  // FT
  ftm: 'ft_made', ft_made: 'ft_made',
  fta: 'ft_attempted', ft_attempted: 'ft_attempted',
  // rebounds split
  oreb: 'off_reb', offreb: 'off_reb', off_reb: 'off_reb',
  dreb: 'def_reb', defreb: 'def_reb', def_reb: 'def_reb',
  // fouls
  pf: 'fouls', fouls: 'fouls',
}
```

---

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| — | — | — |
