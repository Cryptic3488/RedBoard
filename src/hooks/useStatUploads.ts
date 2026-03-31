import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { StatUpload } from '../types/database'

interface UseStatUploadsResult {
  uploads: StatUpload[]
  loading: boolean
  error: string | null
  refresh: () => void
  togglePublish: (id: string, currentValue: boolean) => Promise<void>
}

export function useStatUploads(): UseStatUploadsResult {
  const [uploads, setUploads] = useState<StatUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUploads = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('stat_uploads')
      .select('*')
      .order('session_date', { ascending: false })

    if (err) setError(err.message)
    else setUploads((data ?? []) as StatUpload[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUploads() }, [fetchUploads])

  const togglePublish = useCallback(async (id: string, currentValue: boolean) => {
    const newValue = !currentValue

    // Optimistic update — no closure mutation, values are captured as constants
    setUploads(prev => prev.map(u => u.id === id ? { ...u, is_published: newValue } : u))

    const { error: err } = await (supabase as any)
      .from('stat_uploads')
      .update({ is_published: newValue })
      .eq('id', id) as { error: { message: string } | null }

    if (err) {
      // Revert on DB error
      setUploads(prev => prev.map(u => u.id === id ? { ...u, is_published: currentValue } : u))
    }
  }, [])

  return { uploads, loading, error, refresh: fetchUploads, togglePublish }
}
