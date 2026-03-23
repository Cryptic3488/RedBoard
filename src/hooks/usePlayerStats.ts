import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { StatAnnotation, StatGoal } from '../types/database'
import {
  groupByWeek,
  aggregateWeek,
  contributionPct,
  type StatEntryWithUpload,
  type WeekBucket,
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

    const { data: myEntries, error: e1 } = await supabase
      .from('stat_entries')
      .select('*, upload:stat_uploads(session_date, session_type, label)')
      .eq('player_id', user.id)
      .order('created_at', { ascending: true })

    const { data: allEntries, error: e2 } = await supabase
      .from('stat_entries')
      .select('*, upload:stat_uploads(session_date, session_type, label)')
      .order('created_at', { ascending: true })

    const { data: annotations, error: e3 } = await supabase
      .from('stat_annotations')
      .select('*')
      .eq('player_id', user.id)

    const { data: goalsData, error: e4 } = await supabase
      .from('stat_goals')
      .select('*')
      .eq('player_id', user.id)

    if (e1 || e2 || e3 || e4) {
      setError(e1?.message ?? e2?.message ?? e3?.message ?? e4?.message ?? 'Failed to load stats')
      setLoading(false)
      return
    }

    const myTyped = (myEntries ?? []) as StatEntryWithUpload[]
    const allTyped = (allEntries ?? []) as StatEntryWithUpload[]

    const annotationMap = new Map<string, StatAnnotation>()
    for (const a of (annotations ?? []) as StatAnnotation[]) {
      annotationMap.set(a.upload_id, a)
    }

    // ── Split by session type ──────────────────────────────────────────────────
    const myPractice  = myTyped.filter(e => e.upload.session_type === 'practice')
    const myGamesList = myTyped.filter(e => e.upload.session_type === 'game')
    const allPractice = allTyped.filter(e => e.upload.session_type === 'practice')
    const allGames    = allTyped.filter(e => e.upload.session_type === 'game')

    // ── Practice track: group by week, aggregate ───────────────────────────────
    const myPracticeBuckets = groupByWeek(myPractice)

    const teamPracticeWeekMap = new Map<string, WeekBucket>()
    for (const e of allPractice) {
      const d = new Date(e.upload.session_date)
      const day = d.getUTCDay()
      d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day))
      const week = d.toISOString().slice(0, 10)
      if (!teamPracticeWeekMap.has(week)) {
        teamPracticeWeekMap.set(week, { weekStart: week, label: e.upload.label, session_type: 'practice', entries: [] })
      }
      teamPracticeWeekMap.get(week)!.entries.push(e)
    }

    const enrichedPracticeWeeks: EnrichedWeek[] = myPracticeBuckets.map(bucket => {
      const myStats = aggregateWeek(bucket)
      const teamBucket = teamPracticeWeekMap.get(bucket.weekStart)
      const teamAvg: Record<StandardStatKey, number | null> = {} as Record<StandardStatKey, number | null>
      const teamBest: Record<StandardStatKey, number | null> = {} as Record<StandardStatKey, number | null>
      const contributions: Partial<Record<StandardStatKey, number>> = {}

      if (teamBucket) {
        for (const key of STANDARD_STAT_KEYS) {
          const vals = teamBucket.entries
            .map(e => e[key] as number | null)
            .filter((v): v is number => v !== null)
          teamAvg[key]  = nullAvg(vals)
          teamBest[key] = vals.length > 0 ? Math.max(...vals) : null
          const total   = vals.reduce((a, b) => a + b, 0)
          const myVal   = myStats[key]
          if (myVal !== null) {
            const pct = contributionPct(myVal, total)
            if (pct !== null) contributions[key] = pct
          }
        }
      } else {
        for (const key of STANDARD_STAT_KEYS) { teamAvg[key] = null; teamBest[key] = null }
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
        weekStart:     bucket.weekStart,
        label:         bucket.label,
        session_type:  'practice',
        stats:         myStats,
        custom:        customMap,
        teamAvg,
        teamBest,
        contributions,
        annotation:    lastUploadId ? annotationMap.get(lastUploadId) ?? null : null,
      }
    })

    // ── Game track: one record per upload, never averaged ─────────────────────
    // Career avg computed across all of the player's game entries
    const careerAvg: Record<StandardStatKey, number | null> = {} as Record<StandardStatKey, number | null>
    for (const key of STANDARD_STAT_KEYS) {
      careerAvg[key] = nullAvg(myGamesList.map(e => e[key] as number | null))
    }

    // Team entries per game upload for that-game team avg
    const teamGameByUpload = new Map<string, StatEntryWithUpload[]>()
    for (const e of allGames) {
      if (!teamGameByUpload.has(e.upload_id)) teamGameByUpload.set(e.upload_id, [])
      teamGameByUpload.get(e.upload_id)!.push(e)
    }

    // One entry per game upload for this player
    const gameByUpload = new Map<string, StatEntryWithUpload>()
    for (const e of myGamesList) {
      if (!gameByUpload.has(e.upload_id)) gameByUpload.set(e.upload_id, e)
    }

    const enrichedGames: EnrichedGame[] = [...gameByUpload.values()].map(e => {
      const uploadTeam = teamGameByUpload.get(e.upload_id) ?? []
      const teamAvg: Record<StandardStatKey, number | null> = {} as Record<StandardStatKey, number | null>
      for (const key of STANDARD_STAT_KEYS) {
        teamAvg[key] = nullAvg(uploadTeam.map(te => te[key] as number | null))
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

    // Most recent game first; tiebreak by upload creation time so two games on
    // the same session date always show the most recently uploaded one first.
    enrichedGames.sort((a, b) => {
      const byDate = b.sessionDate.localeCompare(a.sessionDate)
      return byDate !== 0 ? byDate : b.uploadedAt.localeCompare(a.uploadedAt)
    })

    setPracticeWeeks(enrichedPracticeWeeks.reverse()) // most recent first
    setGames(enrichedGames)
    setGoals((goalsData ?? []) as StatGoal[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { practiceWeeks, games, goals, loading, error }
}
