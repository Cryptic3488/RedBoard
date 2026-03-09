import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Blocks access to any unauthenticated user. */
export function AuthGuard() {
  const { session, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />

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
