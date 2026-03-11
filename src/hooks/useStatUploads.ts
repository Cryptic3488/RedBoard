import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { StatUpload } from '../types/database'

interface UseStatUploadsResult {
  uploads: StatUpload[]
  loading: boolean
  error: string | null
  refresh: () => void
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

  return { uploads, loading, error, refresh: fetchUploads }
}
