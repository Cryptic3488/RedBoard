import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { WellnessForm } from '../types/database'

interface UseWellnessFormsResult {
  forms: WellnessForm[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useWellnessForms(): UseWellnessFormsResult {
  const [forms, setForms] = useState<WellnessForm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('wellness_forms')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setForms((data ?? []) as WellnessForm[])
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { forms, loading, error, refresh }
}
