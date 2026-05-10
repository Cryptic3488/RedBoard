import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Blocks access to any unauthenticated user. */
export function AuthGuard() {
  const { session, loading, profileError } = useAuth()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (profileError) return <ProfileErrorScreen message={profileError} />

  return <Outlet />
}

/** Blocks access to non-admin users. */
export function AdminGuard() {
  const { role, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (role !== 'admin') return <Navigate to="/app/feed" replace />

  return <Outlet />
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProfileErrorScreen({ message }: { message: string }) {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1C1C1E] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold text-near-black dark:text-gray-100 mb-2">
          Account not set up
        </h1>
        <p className="font-ui text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          {message}
        </p>
        <button
          onClick={signOut}
          className="font-ui text-sm font-semibold text-white bg-brand hover:bg-brand/90 transition-colors
                     px-6 py-2.5 rounded-xl"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
