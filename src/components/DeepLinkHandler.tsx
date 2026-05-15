import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { supabase } from '../lib/supabase'

export function DeepLinkHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let listenerHandle: Awaited<ReturnType<typeof CapApp.addListener>> | null = null

    CapApp.addListener('appUrlOpen', async ({ url }) => {
      try {
        const hash = new URL(url).hash.slice(1)
        const params = new URLSearchParams(hash)
        if (params.get('type') === 'recovery') {
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token })
            navigate('/reset-password', { replace: true })
          }
        }
      } catch {
        // malformed URL — ignore
      }
    }).then(handle => { listenerHandle = handle })

    return () => { listenerHandle?.remove() }
  }, [navigate])

  return null
}
