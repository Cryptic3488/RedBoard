import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { StatEntry } from '../types/database'

// ─── Stat alias registry ──────────────────────────────────────────────────────

const STAT_ALIASES: Record<string, keyof Omit<StatEntry, 'id' | 'upload_id' | 'player_id' | 'custom' | 'created_at'>> = {
  // points
  pts: 'points', points: 'points',
  // total rebounds
  reb: 'total_reb', trb: 'total_reb', rebounds: 'total_reb', 'total reb': 'total_reb', 'total rebounds': 'total_reb',
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
  // field goals
  fgm: 'fg_made', 'fg made': 'fg_made', fg_made: 'fg_made',
  fga: 'fg_attempted', 'fg attempted': 'fg_attempted', fg_attempted: 'fg_attempted',
  // three pointers
  '3pm': 'three_made', tpm: 'three_made', three_made: 'three_made', '3s made': 'three_made',
  '3pa': 'three_attempted', tpa: 'three_attempted', three_attempted: 'three_attempted',
  // free throws
  ftm: 'ft_made', 'ft made': 'ft_made', ft_made: 'ft_made',
  fta: 'ft_attempted', 'ft attempted': 'ft_attempted', ft_attempted: 'ft_attempted',
  // rebounds split
  oreb: 'off_reb', 'off reb': 'off_reb', 'offensive reb': 'off_reb', off_reb: 'off_reb',
  dreb: 'def_reb', 'def reb': 'def_reb', 'defensive reb': 'def_reb', def_reb: 'def_reb',
  // fouls
  pf: 'fouls', fouls: 'fouls', 'personal fouls': 'fouls',
}

export const STANDARD_STAT_KEYS = [
  'points', 'total_reb', 'assists', 'steals', 'blocks',
  'turnovers', 'minutes', 'fg_made', 'fg_attempted',
  'three_made', 'three_attempted', 'ft_made', 'ft_attempted',
  'off_reb', 'def_reb', 'fouls',
] as const

export type StandardStatKey = typeof STANDARD_STAT_KEYS[number]

export const STAT_LABELS: Record<StandardStatKey, string> = {
  points: 'Points', total_reb: 'Rebounds', assists: 'Assists',
  steals: 'Steals', blocks: 'Blocks', turnovers: 'Turnovers',
  minutes: 'Minutes', fg_made: 'FGM', fg_attempted: 'FGA',
  three_made: '3PM', three_attempted: '3PA',
  ft_made: 'FTM', ft_attempted: 'FTA',
  off_reb: 'Off Reb', def_reb: 'Def Reb', fouls: 'Fouls',
}

// ─── Column detection helpers ─────────────────────────────────────────────────

function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/[_\-]+/g, ' ')
}

function resolveColumn(col: string): StandardStatKey | null {
  return STAT_ALIASES[normalizeKey(col)] ?? null
}

/** Detects which column is most likely the player identifier */
function detectPlayerColumn(headers: string[]): string | null {
  const patterns = ['name', 'player', 'athlete', '#', 'number', 'no', 'num']
  for (const h of headers) {
    const n = normalizeKey(h)
    if (patterns.some(p => n === p || n.includes(p))) return h
  }
  return headers[0] ?? null
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedRow {
  rawName: string
  standard: Partial<Record<StandardStatKey, number>>
  custom: Record<string, number | string | null>
}

export interface ParseResult {
  headers: string[]
  detectedPlayerColumn: string
  recognizedColumns: string[]    // mapped to standard stats
  customColumns: string[]        // unrecognized
  rows: ParsedRow[]
}

export interface PlayerMatch {
  profileId: string
  profileName: string
  csvName: string
  matched: boolean
}

// ─── Parse CSV ────────────────────────────────────────────────────────────────

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = (results.meta.fields ?? []) as string[]
        resolve(buildParseResult(headers, results.data as Record<string, unknown>[]))
      },
      error: reject,
    })
  })
}

// ─── Parse XLSX ───────────────────────────────────────────────────────────────

export async function parseXLSX(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[]
  const headers = data.length > 0 ? Object.keys(data[0]) : []
  return buildParseResult(headers, data)
}

// ─── Core builder ─────────────────────────────────────────────────────────────

function buildParseResult(headers: string[], data: Record<string, unknown>[]): ParseResult {
  const playerCol = detectPlayerColumn(headers) ?? headers[0]
  const recognizedColumns: string[] = []
  const customColumns: string[] = []

  for (const h of headers) {
    if (h === playerCol) continue
    if (resolveColumn(h)) recognizedColumns.push(h)
    else customColumns.push(h)
  }

  const rows: ParsedRow[] = data.map(row => {
    const rawName = String(row[playerCol] ?? '').trim()
    const standard: Partial<Record<StandardStatKey, number>> = {}
    const custom: Record<string, number | string | null> = {}

    for (const h of recognizedColumns) {
      const key = resolveColumn(h)!
      const val = row[h]
      if (typeof val === 'number') standard[key] = val
    }

    for (const h of customColumns) {
      const val = row[h]
      custom[h] = typeof val === 'number' || typeof val === 'string' ? val : null
    }

    return { rawName, standard, custom }
  }).filter(r => r.rawName.length > 0)

  return { headers, detectedPlayerColumn: playerCol, recognizedColumns, customColumns, rows }
}

// ─── Player matching ──────────────────────────────────────────────────────────

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z\s]/g, '')
}

export function matchPlayers(
  rows: ParsedRow[],
  profiles: { id: string; name: string }[]
): PlayerMatch[] {
  return rows.map(row => {
    const csvNorm = normalizeName(row.rawName)
    const csvLast = csvNorm.split(' ').at(-1) ?? ''

    // Exact match
    let profile = profiles.find(p => normalizeName(p.name) === csvNorm)
    // Last-name fallback
    if (!profile) profile = profiles.find(p => {
      const pNorm = normalizeName(p.name)
      return pNorm.split(' ').at(-1) === csvLast
    })

    return profile
      ? { profileId: profile.id, profileName: profile.name, csvName: row.rawName, matched: true }
      : { profileId: '', profileName: '', csvName: row.rawName, matched: false }
  })
}

// ─── Build stat_entries insert payloads ───────────────────────────────────────

export function buildStatEntries(
  uploadId: string,
  rows: ParsedRow[],
  matches: PlayerMatch[]
): Omit<StatEntry, 'id' | 'created_at'>[] {
  return rows
    .map((row, i) => ({ row, match: matches[i] }))
    .filter(({ match }) => match.matched)
    .map(({ row, match }) => ({
      upload_id: uploadId,
      player_id: match.profileId,
      minutes:         row.standard.minutes         ?? null,
      points:          row.standard.points          ?? null,
      fg_made:         row.standard.fg_made         ?? null,
      fg_attempted:    row.standard.fg_attempted    ?? null,
      three_made:      row.standard.three_made      ?? null,
      three_attempted: row.standard.three_attempted ?? null,
      ft_made:         row.standard.ft_made         ?? null,
      ft_attempted:    row.standard.ft_attempted    ?? null,
      off_reb:         row.standard.off_reb         ?? null,
      def_reb:         row.standard.def_reb         ?? null,
      total_reb:       row.standard.total_reb       ?? null,
      assists:         row.standard.assists         ?? null,
      steals:          row.standard.steals          ?? null,
      blocks:          row.standard.blocks          ?? null,
      turnovers:       row.standard.turnovers       ?? null,
      fouls:           row.standard.fouls           ?? null,
      custom:          row.custom,
    }))
}

// ─── Weekly aggregation (client-side) ─────────────────────────────────────────

function getMondayISO(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

function avgNullable(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null)
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

export interface StatEntryWithUpload extends StatEntry {
  upload: { session_date: string; session_type: string; label: string }
}

export interface WeekBucket {
  weekStart: string
  label: string
  session_type: string
  entries: StatEntry[]
}

export function groupByWeek(entries: StatEntryWithUpload[]): WeekBucket[] {
  const map = new Map<string, WeekBucket>()
  for (const e of entries) {
    const week = getMondayISO(e.upload.session_date)
    if (!map.has(week)) {
      map.set(week, { weekStart: week, label: e.upload.label, session_type: e.upload.session_type, entries: [] })
    }
    map.get(week)!.entries.push(e)
  }
  return [...map.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}

export function aggregateWeek(bucket: WeekBucket): Record<StandardStatKey, number | null> {
  const pick = (key: StandardStatKey) => avgNullable(bucket.entries.map(e => e[key]))
  return {
    points: pick('points'), total_reb: pick('total_reb'), assists: pick('assists'),
    steals: pick('steals'), blocks: pick('blocks'), turnovers: pick('turnovers'),
    minutes: pick('minutes'), fg_made: pick('fg_made'), fg_attempted: pick('fg_attempted'),
    three_made: pick('three_made'), three_attempted: pick('three_attempted'),
    ft_made: pick('ft_made'), ft_attempted: pick('ft_attempted'),
    off_reb: pick('off_reb'), def_reb: pick('def_reb'), fouls: pick('fouls'),
  }
}

/** Returns contribution % for a player's value vs team total. null if below threshold. */
export function contributionPct(playerVal: number, teamTotal: number, threshold = 20): number | null {
  if (teamTotal <= 0) return null
  const pct = (playerVal / teamTotal) * 100
  return pct >= threshold ? Math.round(pct) : null
}
