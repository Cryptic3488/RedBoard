import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { StatAnnotation, StatGoal } from '../types/database'
import {
  groupByWeek,
  aggregateWeek,
  contributionPct,
  type StatEntryWithUpload,
  type StandardStatKey,
  STANDARD_STAT_KEYS,
} from '../lib/statParser'

export interface EnrichedWeek {
  weekStart: string
  label: string
  session_type: string
  stats: Record<StandardStatKey, number | null>
  custom: Record<string, number | null>
  teamAvg: Record<StandardStatKey, number | null>
  teamBest: Record<StandardStatKey, number | null>
  contributions: Partial<Record<StandardStatKey, number>>
  annotation: StatAnnotation | null
}

export interface EnrichedGame {
  uploadId: string
  label: string
  sessionDate: string
  /** ISO timestamp of when the upload was created — used as sort tiebreaker */
  uploadedAt: string
  stats: Record<StandardStatKey, number | null>
  custom: Record<string, number | null>
  /** Average across all of this player's game uploads */
  careerAvg: Record<StandardStatKey, number | null>
  /** Team average for this specific game upload */
  teamAvg: Record<StandardStatKey, number | null>
  annotation: StatAnnotation | null
}

interface UsePlayerStatsResult {
  practiceWeeks: EnrichedWeek[]
  games: EnrichedGame[]
  goals: StatGoal[]
  loading: boolean
  error: string | null
}

function nullAvg(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null)
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

/** Returns ISO date string of the Monday that starts the week containing dateStr. */
function toMondayISO(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day))
  return d.toISOString().slice(0, 10)
}

interface TeamAggRow {
  upload_id: string
  session_type: string
  session_date: string
  stat_key: string
  avg_val: number | null
  max_val: number | null
  sum_val: number | null
  n: number
}

interface UploadTeamAgg {
  session_type: string
  session_date: string
  stats: Map<string, { avg: number | null; max: number | null; sum: number | null; n: number }>
}

export function usePlayerStats(): UsePlayerStatsResult {
  const { user } = useAuth()
  const [practiceWeeks, setPracticeWeeks] = useState<EnrichedWeek[]>([])
  const [games, setGames] = useState<EnrichedGame[]>([])
  const [goals, setGoals] = useState<StatGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const [
      { data: myEntries,  error: e1 },
      { data: teamAggRaw, error: e2 },
      { data: annotations, error: e3 },
      { data: goalsData,   error: e4 },
    ] = await Promise.all([
      supabase
        .from('stat_entries')
        .select('*, upload:stat_uploads(session_date, session_type, label)')
        .eq('player_id', user.id)
        .order('created_at', { ascending: true }),
      supabase.rpc('get_team_stat_aggregates'),
      supabase
        .from('stat_annotations')
        .select('*')
        .eq('player_id', user.id),
      supabase
        .from('stat_goals')
        .select('*')
        .eq('player_id', user.id),
    ])

    if (e1 || e2 || e3 || e4) {
      setError(e1?.message ?? e2?.message ?? e3?.message ?? e4?.message ?? 'Failed to load stats')
      setLoading(false)
      return
    }

    const myTyped = (myEntries ?? []) as StatEntryWithUpload[]

    // ── Build team aggregate lookup: upload_id → { stats: Map<stat_key, agg> } ─
    const teamAggByUpload = new Map<string, UploadTeamAgg>()
    for (const row of (teamAggRaw ?? []) as TeamAggRow[]) {
      if (!teamAggByUpload.has(row.upload_id)) {
        teamAggByUpload.set(row.upload_id, {
          session_type: row.session_type,
          session_date: row.session_date,
          stats: new Map(),
        })
      }
      teamAggByUpload.get(row.upload_id)!.stats.set(row.stat_key, {
        avg: row.avg_val,
        max: row.max_val,
        sum: row.sum_val,
        n: row.n,
      })
    }

    // ── Build practice team week map: weekStart → Map<stat_key, combined agg> ─
    const teamPracticeWeekMap = new Map<string, Map<string, { sum: number; n: number; max: number | null }>>()
    for (const [, uploadData] of teamAggByUpload) {
      if (uploadData.session_type !== 'practice') continue
      const week = toMondayISO(uploadData.session_date)
      if (!teamPracticeWeekMap.has(week)) teamPracticeWeekMap.set(week, new Map())
      const weekStats = teamPracticeWeekMap.get(week)!
      for (const [key, agg] of uploadData.stats) {
        const existing = weekStats.get(key)
        if (existing) {
          existing.sum += agg.sum ?? 0
          existing.n   += agg.n
          if (agg.max !== null) {
            existing.max = existing.max !== null ? Math.max(existing.max, agg.max) : agg.max
          }
        } else {
          weekStats.set(key, { sum: agg.sum ?? 0, n: agg.n, max: agg.max })
        }
      }
    }

    const annotationMap = new Map<string, StatAnnotation>()
    for (const a of (annotations ?? []) as StatAnnotation[]) {
      annotationMap.set(a.upload_id, a)
    }

    // ── Split by session type ──────────────────────────────────────────────────
    const myPractice  = myTyped.filter(e => e.upload.session_type === 'practice')
    const myGamesList = myTyped.filter(e => e.upload.session_type === 'game')

    // ── Practice track: group by week, aggregate ───────────────────────────────
    const myPracticeBuckets = groupByWeek(myPractice)

    const enrichedPracticeWeeks: EnrichedWeek[] = myPracticeBuckets.map(bucket => {
      const myStats    = aggregateWeek(bucket)
      const weekStats  = teamPracticeWeekMap.get(bucket.weekStart)
      const teamAvg:   Record<StandardStatKey, number | null> = {} as Record<StandardStatKey, number | null>
      const teamBest:  Record<StandardStatKey, number | null> = {} as Record<StandardStatKey, number | null>
      const contributions: Partial<Record<StandardStatKey, number>> = {}

      for (const key of STANDARD_STAT_KEYS) {
        const agg = weekStats?.get(key)
        teamAvg[key]  = agg && agg.n > 0 ? agg.sum / agg.n : null
        teamBest[key] = agg?.max ?? null
        const myVal   = myStats[key]
        if (myVal !== null && agg && agg.sum > 0) {
          const pct = contributionPct(myVal, agg.sum)
          if (pct !== null) contributions[key] = pct
        }
      }

      // Average custom stats within the week
      const customMap: Record<string, number | null> = {}
      for (const entry of bucket.entries) {
        for (const [k, v] of Object.entries(entry.custom ?? {})) {
          if (typeof v === 'number') customMap[k] = ((customMap[k] ?? 0) as number) + v
        }
      }
      for (const k of Object.keys(customMap)) {
        const val = customMap[k]
        if (val !== null) customMap[k] = val / bucket.entries.length
      }

      const lastUploadId = bucket.entries.at(-1)?.upload_id
      return {
        weekStart:    bucket.weekStart,
        label:        bucket.label,
        session_type: 'practice',
        stats:        myStats,
        custom:       customMap,
        teamAvg,
        teamBest,
        contributions,
        annotation:   lastUploadId ? annotationMap.get(lastUploadId) ?? null : null,
      }
    })

    // ── Game track: one record per upload, never averaged ─────────────────────
    const careerAvg: Record<StandardStatKey, number | null> = {} as Record<StandardStatKey, number | null>
    for (const key of STANDARD_STAT_KEYS) {
      careerAvg[key] = nullAvg(myGamesList.map(e => e[key] as number | null))
    }

    const gameByUpload = new Map<string, StatEntryWithUpload>()
    for (const e of myGamesList) {
      if (!gameByUpload.has(e.upload_id)) gameByUpload.set(e.upload_id, e)
    }

    const enrichedGames: EnrichedGame[] = [...gameByUpload.values()].map(e => {
      const uploadAgg = teamAggByUpload.get(e.upload_id)
      const teamAvg: Record<StandardStatKey, number | null> = {} as Record<StandardStatKey, number | null>
      for (const key of STANDARD_STAT_KEYS) {
        const agg = uploadAgg?.stats.get(key)
        teamAvg[key] = agg?.avg ?? null
      }

      const stats: Record<StandardStatKey, number | null> = {} as Record<StandardStatKey, number | null>
      for (const key of STANDARD_STAT_KEYS) {
        stats[key] = (e[key] as number | null) ?? null
      }

      const customMap: Record<string, number | null> = {}
      for (const [k, v] of Object.entries(e.custom ?? {})) {
        if (typeof v === 'number') customMap[k] = v
      }

      return {
        uploadId:    e.upload_id,
        label:       e.upload.label,
        sessionDate: e.upload.session_date,
        uploadedAt:  e.created_at,
        stats,
        custom:      customMap,
        careerAvg,
        teamAvg,
        annotation:  annotationMap.get(e.upload_id) ?? null,
      }
    })

    enrichedGames.sort((a, b) => {
      const byDate = b.sessionDate.localeCompare(a.sessionDate)
      return byDate !== 0 ? byDate : b.uploadedAt.localeCompare(a.uploadedAt)
    })

    setPracticeWeeks(enrichedPracticeWeeks.reverse())
    setGames(enrichedGames)
    setGoals((goalsData ?? []) as StatGoal[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { practiceWeeks, games, goals, loading, error }
}
