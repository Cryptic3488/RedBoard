import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { FilmPostWithCreator } from '../types/database'

interface UseFilmPostsResult {
  posts: FilmPostWithCreator[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useFilmPosts(): UseFilmPostsResult {
  const [posts, setPosts] = useState<FilmPostWithCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('film_posts')
      .select('*, creator:profiles!created_by(name)')
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setPosts((data ?? []) as FilmPostWithCreator[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPosts()

    const channel = supabase
      .channel('film_posts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'film_posts' },
        () => fetchPosts()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchPosts])

  return { posts, loading, error, refresh: fetchPosts }
}
