import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/app/feed', label: 'Feed', icon: '📋' },
  { to: '/app/stats', label: 'Stats', icon: '📊' },
  { to: '/app/film', label: 'Film', icon: '🎬' },
  { to: '/app/wellness', label: 'Wellness', icon: '💪' },
  { to: '/app/playbook', label: 'Playbook', icon: '📖' },
]

export function AppLayout() {
  const { signOut, role } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <span className="text-brand font-black text-lg">Red</span>
          <span className="text-white font-black text-lg">Board</span>
        </div>
        <div className="flex items-center gap-3">
          {role === 'admin' && (
            <NavLink
              to="/admin"
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors"
            >
              Admin
            </NavLink>
          )}
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav (mobile-first) */}
      <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 flex z-10">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors
               ${isActive ? 'text-brand' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <span className="text-xl leading-none mb-0.5">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
