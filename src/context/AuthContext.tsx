import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Role } from '../types/database'

interface Profile {
  role: Role
  name: string
  avatar_url: string | null
  jersey_number: number | null
  position: 'Guard' | 'Forward' | 'Center' | null
  class_year: 'Fr' | 'So' | 'Jr' | 'Sr' | null
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  role: Role | null
  profile: Profile | null
  /** True while the initial session check OR any profile fetch is in flight. */
  loading: boolean
  /** Non-null when the user is authenticated but has no profiles row. */
  profileError: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  async function loadProfile(userId: string) {
    setLoading(true)
    setProfileError(null)

    const { data, error } = await supabase
      .from('profiles')
      .select('role, name, avatar_url, jersey_number, position, class_year')
      .eq('id', userId)
      .single<Profile>()

    if (error || !data) {
      console.error('[AuthContext] loadProfile failed:', error?.message ?? 'no row returned')
      setProfile(null)
      setProfileError('No profile found for this account. Ask your administrator to create one.')
    } else {
      setProfile(data)
      setProfileError(null)
    }

    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setProfileError(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setProfileError(null)
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      role: profile?.role ?? null,
      profile,
      loading,
      profileError,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
