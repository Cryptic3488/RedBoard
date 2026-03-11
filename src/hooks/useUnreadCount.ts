import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface UseUnreadCountResult {
  unreadCount: number
  markAllRead: () => Promise<void>
}

export function useUnreadCount(): UseUnreadCountResult {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchCount = useCallback(async () => {
    if (!user) { setUnreadCount(0); return }

    const [postsResult, viewsResult] = await Promise.all([
      supabase.from('film_posts').select('id'),
      supabase.from('film_post_views').select('post_id').eq('player_id', user.id),
    ])

    const postRows = (postsResult.data ?? []) as { id: string }[]
    const viewRows = (viewsResult.data ?? []) as { post_id: string }[]

    const allIds = new Set(postRows.map(r => r.id))
    const viewedIds = new Set(viewRows.map(r => r.post_id))

    let count = 0
    for (const id of allIds) {
      if (!viewedIds.has(id)) count++
    }
    setUnreadCount(count)
  }, [user])

  const markAllRead = useCallback(async () => {
    if (!user) return

    const { data: posts } = await supabase.from('film_posts').select('id')
    const { data: views } = await supabase
      .from('film_post_views')
      .select('post_id')
      .eq('player_id', user.id)

    const postRows = (posts ?? []) as { id: string }[]
    const viewRows = (views ?? []) as { post_id: string }[]
    const viewedIds = new Set(viewRows.map(r => r.post_id))
    const unread = postRows.filter(p => !viewedIds.has(p.id))

    if (unread.length === 0) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('film_post_views') as any).upsert(
      unread.map(p => ({ post_id: p.id, player_id: user.id })),
      { onConflict: 'post_id,player_id' }
    )

    setUnreadCount(0)
  }, [user])

  useEffect(() => {
    fetchCount()

    const channel = supabase
      .channel('unread_count_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'film_posts' }, fetchCount)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'film_post_views' }, fetchCount)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchCount])

  return { unreadCount, markAllRead }
}
