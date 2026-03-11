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
  // contribution badges: stat key → pct (only when ≥20%)
  contributions: Partial<Record<StandardStatKey, number>>
  annotation: StatAnnotation | null
}

interface UsePlayerStatsResult {
  weeks: EnrichedWeek[]
  goals: StatGoal[]
  loading: boolean
  error: string | null
}

export function usePlayerStats(): UsePlayerStatsResult {
  const { user } = useAuth()
  const [weeks, setWeeks] = useState<EnrichedWeek[]>([])
  const [goals, setGoals] = useState<StatGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    // Fetch player's own entries with upload metadata
    const { data: myEntries, error: e1 } = await supabase
      .from('stat_entries')
      .select('*, upload:stat_uploads(session_date, session_type, label)')
      .eq('player_id', user.id)
      .order('created_at', { ascending: true })

    // Fetch all team entries (same uploads) for benchmarks
    const { data: allEntries, error: e2 } = await supabase
      .from('stat_entries')
      .select('*, upload:stat_uploads(session_date, session_type, label)')
      .order('created_at', { ascending: true })

    // Fetch annotations for this player
    const { data: annotations, error: e3 } = await supabase
      .from('stat_annotations')
      .select('*')
      .eq('player_id', user.id)

    // Fetch goals
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

    // Group player's weeks
    const myBuckets = groupByWeek(myTyped)

    // Group all team entries by week for benchmark calculation
    const teamBucketMap = new Map<string, WeekBucket>()
    for (const e of allTyped) {
      const d = new Date(e.upload.session_date)
      const day = d.getUTCDay()
      const diff = day === 0 ? -6 : 1 - day
      d.setUTCDate(d.getUTCDate() + diff)
      const week = d.toISOString().slice(0, 10)
      if (!teamBucketMap.has(week)) {
        teamBucketMap.set(week, { weekStart: week, label: e.upload.label, session_type: e.upload.session_type, entries: [] })
      }
      teamBucketMap.get(week)!.entries.push(e)
    }

    // Build annotation lookup by upload_id
    const annotationMap = new Map<string, StatAnnotation>()
    for (const a of (annotations ?? []) as StatAnnotation[]) {
      annotationMap.set(a.upload_id, a)
    }

    // Build enriched weeks
    const enriched: EnrichedWeek[] = myBuckets.map(bucket => {
      const myStats = aggregateWeek(bucket)
      const teamBucket = teamBucketMap.get(bucket.weekStart)
      const teamAvg: Record<StandardStatKey, number | null> = {} as Record<StandardStatKey, number | null>
      const teamBest: Record<StandardStatKey, number | null> = {} as Record<StandardStatKey, number | null>
      const contributions: Partial<Record<StandardStatKey, number>> = {}

      if (teamBucket) {
        // Per-stat: compute team avg and team best across all players
        for (const key of STANDARD_STAT_KEYS) {
          const vals = teamBucket.entries
            .map(e => e[key] as number | null)
            .filter((v): v is number => v !== null)
          teamAvg[key] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
          teamBest[key] = vals.length > 0 ? Math.max(...vals) : null

          // Contribution badge
          const total = vals.reduce((a, b) => a + b, 0)
          const myVal = myStats[key]
          if (myVal !== null) {
            const pct = contributionPct(myVal, total)
            if (pct !== null) contributions[key] = pct
          }
        }
      } else {
        for (const key of STANDARD_STAT_KEYS) {
          teamAvg[key] = null
          teamBest[key] = null
        }
      }

      // Aggregate custom stats for the week (average numeric values)
      const customMap: Record<string, number | null> = {}
      for (const entry of bucket.entries) {
        for (const [k, v] of Object.entries(entry.custom ?? {})) {
          if (typeof v === 'number') {
            customMap[k] = ((customMap[k] ?? 0) as number) + v
          }
        }
      }
      // Average them
      for (const k of Object.keys(customMap)) {
        const val = customMap[k]
        if (val !== null) customMap[k] = val / bucket.entries.length
      }

      // Find annotation for the most recent upload in this week
      const lastUploadId = bucket.entries.at(-1)?.upload_id
      const annotation = lastUploadId ? annotationMap.get(lastUploadId) ?? null : null

      return {
        weekStart: bucket.weekStart,
        label: bucket.label,
        session_type: bucket.session_type,
        stats: myStats,
        custom: customMap,
        teamAvg,
        teamBest,
        contributions,
        annotation,
      }
    })

    setWeeks(enriched.reverse()) // most recent first
    setGoals((goalsData ?? []) as StatGoal[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { weeks, goals, loading, error }
}
