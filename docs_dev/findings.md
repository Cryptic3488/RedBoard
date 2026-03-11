# Findings: F-03/F-04 Stats + Theme

## Existing Codebase Patterns (from context exploration)

### Typography
- `font-display` = Crimson Pro serif (hero text, card titles)
- `font-ui` = Inter sans-serif (labels, body, form fields)

### Card pattern
```tsx
<div className="bg-gray-900/70 border border-gray-800 border-l-2 border-l-brand rounded-xl p-4">
```
Light equivalent:
```tsx
<div className="bg-white border border-gray-200 border-l-2 border-l-brand rounded-xl p-4">
```

### Section header pattern
```tsx
<div className="flex items-center gap-3 mb-5">
  <span className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-600">Label</span>
  <div className="flex-1 h-px bg-gray-800" />  {/* → bg-gray-200 in light */}
</div>
```

### Form field pattern (from AdminFilm.tsx)
```tsx
<input className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2
                   font-ui text-sm text-cream placeholder-gray-600
                   focus:outline-none focus:border-brand/60 transition-colors" />
```
Light equivalent:
```tsx
<input className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2
                   font-ui text-sm text-near-black placeholder-gray-400
                   focus:outline-none focus:border-brand/60 transition-colors" />
```

### Spinner pattern
```tsx
<span className="w-5 h-5 border-2 border-gray-700 border-t-brand rounded-full animate-spin" />
```
Light: `border-gray-200 border-t-brand`

### supabase-js v2 insert workaround
For new tables, use `(supabase as any).from('table').insert(...)` to bypass schema inference issue with supabase-js 2.98.0. Cast result explicitly.

### Database type requirements (supabase-js 2.98.0)
All tables need `Relationships: never[]`. Database.public needs `Views: Record<string, never>` and `Functions: Record<string, never>`.

## recharts Notes
- Import: `import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'`
- Wrap in `<ResponsiveContainer width="100%" height={120}>` for responsive sizing
- Three `<Line>` elements: player (solid red), team avg (dashed gray), team best (dotted)
- `dot={false}` on team avg/best lines to reduce clutter
- Custom tooltip to show all three values on hover

## papaparse Notes
- `Papa.parse(file, { header: true, dynamicTyping: true, skipEmptyLines: true, complete: (results) => ... })`
- Returns `results.data` as array of objects keyed by column headers
- `results.meta.fields` gives the column names

## xlsx Notes
- `import * as XLSX from 'xlsx'`
- `const wb = XLSX.read(await file.arrayBuffer())`
- `const ws = wb.Sheets[wb.SheetNames[0]]`
- `const data = XLSX.utils.sheet_to_json(ws)` — returns same shape as papaparse

## Player Matching Strategy
1. Normalize both sides: lowercase, trim whitespace, strip punctuation
2. Try exact match first
3. Try last-name-only match as fallback
4. Flag remaining unmatched rows for manual mapping in preview UI

## Weekly Aggregation Query Pattern
```ts
// Group stat_entries by ISO week, average numeric standard stats
supabase
  .from('stat_entries')
  .select('*, upload:stat_uploads(session_date, session_type, label)')
  .eq('player_id', userId)
  .order('created_at', { ascending: true })
// Then group client-side by date_trunc('week') equivalent:
// new Date(date).setDate(date.getDate() - date.getDay() + 1) → Monday
```

## Contribution % Calculation
```ts
// For each standard stat, for a given week:
// playerValue / sum(all team values for that stat that week) * 100
// Show badge if result >= 20
```
