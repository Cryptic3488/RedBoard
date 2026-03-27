import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { FilmPostWithCreator } from '../types/database'

export interface StatFeedPayload {
  uploadId: string
  label: string
  session_type: 'game' | 'practice'
  session_date: string
}

export interface PlaybookFeedPayload {
  folderId: string
  folderName: string
  fileCount: number
}

export type FeedItem =
  | { id: string; type: 'film';     created_at: string; payload: FilmPostWithCreator }
  | { id: string; type: 'stats';    created_at: string; payload: StatFeedPayload }
  | { id: string; type: 'playbook'; created_at: string; payload: PlaybookFeedPayload }

export function useFeedItems(): { items: FeedItem[]; loading: boolean } {
  const { user } = useAuth()
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function fetchAll() {
      setLoading(true)

      const [filmRes, entryRes, playbookRes] = await Promise.all([
        // Film posts — RLS already filters to visible posts for this player
        supabase
          .from('film_posts')
          .select('*, creator:profiles!created_by(name)')
          .order('created_at', { ascending: false }),

        // Stat uploads — accessed via stat_entries (player can only see own rows)
        supabase
          .from('stat_entries')
          .select('upload_id, upload:stat_uploads(id, label, session_type, session_date, created_at)')
          .eq('player_id', user!.id)
          .order('created_at', { ascending: false }),

        // Playbook files — joined to folders for name
        supabase
          .from('playbook_files')
          .select('id, folder_id, created_at, folder:playbook_folders(name)')
          .order('created_at', { ascending: false })
          .limit(100),
      ])

      if (cancelled) return

      // ── Film ──────────────────────────────────────────────────────────────────
      const filmItems: FeedItem[] = (filmRes.data ?? []).map((p: any) => ({
        id: `film-${p.id}`,
        type: 'film',
        created_at: p.created_at,
        payload: p as FilmPostWithCreator,
      }))

      // ── Stats ─────────────────────────────────────────────────────────────────
      // Deduplicate by upload_id — one feed card per upload regardless of entries count
      const seenUploads = new Set<string>()
      const statItems: FeedItem[] = []
      for (const row of (entryRes.data ?? []) as any[]) {
        const up = row.upload
        if (!up || seenUploads.has(up.id)) continue
        seenUploads.add(up.id)
        statItems.push({
          id: `stats-${up.id}`,
          type: 'stats',
          created_at: up.created_at,
          payload: {
            uploadId: up.id,
            label: up.label,
            session_type: up.session_type,
            session_date: up.session_date,
          },
        })
      }

      // ── Playbook ──────────────────────────────────────────────────────────────
      // One card per folder — timestamp = most recent file in that folder
      const folderMap = new Map<string, { folderName: string; fileCount: number; latestAt: string }>()
      for (const file of (playbookRes.data ?? []) as any[]) {
        if (!file.folder) continue
        const existing = folderMap.get(file.folder_id)
        if (!existing) {
          folderMap.set(file.folder_id, {
            folderName: file.folder.name,
            fileCount: 1,
            latestAt: file.created_at,
          })
        } else {
          existing.fileCount++
          // Results are ordered desc so first entry per folder is already the latest
        }
      }
      const playbookItems: FeedItem[] = [...folderMap.entries()].map(([folderId, f]) => ({
        id: `playbook-${folderId}`,
        type: 'playbook',
        created_at: f.latestAt,
        payload: { folderId, folderName: f.folderName, fileCount: f.fileCount },
      }))

      // ── Merge + sort descending ───────────────────────────────────────────────
      const merged = [...filmItems, ...statItems, ...playbookItems].sort(
        (a, b) => b.created_at.localeCompare(a.created_at),
      )

      setItems(merged)
      setLoading(false)
    }

    fetchAll()
    return () => { cancelled = true }
  }, [user])

  return { items, loading }
}
