# Progress Log: F-03/F-04 Stats + Theme

## Session: 2026-03-11

### Status: PLANNING COMPLETE — ready for implementation

### Completed this session
- [x] Brainstormed and approved two-tier stat schema (standard typed + custom jsonb)
- [x] Approved warm cream light theme (Direction A) — whole-app retheme
- [x] Designed all four player stats page zones
- [x] Designed admin upload flow with client-side preview step
- [x] Designed coaching annotations + goals system
- [x] Wrote design spec → `docs/superpowers/specs/2026-03-11-stats-and-theme-design.md`
- [x] Committed design doc to main

### Not yet started
- [ ] Phase 0: npm install papaparse xlsx recharts + types
- [ ] Phase 1: Light theme class sweep
- [ ] Phase 2: SQL migration
- [ ] Phase 3: Type definitions
- [ ] Phase 4: statParser lib
- [ ] Phase 5: Hooks
- [ ] Phase 6: Admin stats page
- [ ] Phase 7: Player stats page
- [ ] Phase 8: Build verification

### Key decisions made
- Two-tier schema chosen over flexible key-value (Approach B)
- recharts for charts (unavoidable for multi-series line charts)
- papaparse + xlsx for parsing
- Week-by-week aggregation at query time (no materialized view)
- 20% threshold for contribution badges
- Warm cream (#F8F4F0) as page background, near-black (#100F0D) as text

### Next session starting point
Begin Phase 0: `npm install papaparse @types/papaparse xlsx recharts`
Then Phase 1: update tailwind.config.js and sweep all component files.
Reference `task_plan.md` Theme Class Mapping table for the swap guide.
