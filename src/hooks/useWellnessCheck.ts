import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { WellnessForm, WellnessResponse } from '../types/database'

interface UseWellnessCheckResult {
  form: WellnessForm | null
  todayResponse: WellnessResponse | null
  loading: boolean
  submit: (answers: Record<string, number | string>) => Promise<{ error: string | null }>
  refresh: () => void
}

export function useWellnessCheck(): UseWellnessCheckResult {
  const { user } = useAuth()
  const [form, setForm] = useState<WellnessForm | null>(null)
  const [todayResponse, setTodayResponse] = useState<WellnessResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: formData } = await supabase
      .from('wellness_forms')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    if (formData) {
      const today = new Date().toISOString().slice(0, 10)
      setForm(formData as WellnessForm)
      const { data: resp } = await (supabase as any)
        .from('wellness_responses')
        .select('*')
        .eq('form_id', (formData as WellnessForm).id)
        .eq('player_id', user.id)
        .eq('date', today)
        .maybeSingle()
      setTodayResponse(resp as WellnessResponse | null)
    } else {
      setForm(null)
      setTodayResponse(null)
    }

    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const submit = useCallback(async (
    answers: Record<string, number | string>
  ): Promise<{ error: string | null }> => {
    if (!user || !form) return { error: 'No active form' }
    const today = new Date().toISOString().slice(0, 10)
    const { error } = (await (supabase as any)
      .from('wellness_responses')
      .insert({ form_id: form.id, player_id: user.id, date: today, answers })
    ) as { error: { message: string } | null }
    if (!error) await refresh()
    return { error: error?.message ?? null }
  }, [user, form, refresh])

  return { form, todayResponse, loading, submit, refresh }
}
