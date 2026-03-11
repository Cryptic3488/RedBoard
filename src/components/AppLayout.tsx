import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUnreadCount } from '../hooks/useUnreadCount'

const NAV = [
  { to: '/app/feed', label: 'Feed', icon: '📋' },
  { to: '/app/stats', label: 'Stats', icon: '📊' },
  { to: '/app/film', label: 'Film', icon: '🎬' },
  { to: '/app/wellness', label: 'Wellness', icon: '💪' },
  { to: '/app/playbook', label: 'Playbook', icon: '📖' },
]

export function AppLayout() {
  const { signOut, role } = useAuth()
  const { unreadCount } = useUnreadCount()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-near-black flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800/60 px-4 py-3
                         flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-1.5">
          <span className="font-ui font-black text-lg text-brand">Red</span>
          <span className="font-ui font-black text-lg text-cream">Board</span>
          <div className="w-px h-3.5 bg-gray-700 mx-1.5" />
          <span className="font-ui text-xs text-gray-600 tracking-widest uppercase">WBB</span>
        </div>
        <div className="flex items-center gap-3">
          {role === 'admin' && (
            <NavLink
              to="/admin"
              className="font-ui text-xs text-gray-500 hover:text-cream px-2.5 py-1 rounded
                         border border-gray-800 hover:border-gray-600 transition-colors"
            >
              Admin
            </NavLink>
          )}
          <button
            onClick={handleSignOut}
            className="font-ui text-xs text-gray-600 hover:text-cream transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-gray-900/90 backdrop-blur border-t border-gray-800/60 flex z-10">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 transition-colors
               ${isActive
                ? 'text-brand'
                : 'text-gray-600 hover:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative inline-flex text-xl leading-none mb-0.5">
                  {icon}
                  {to === '/app/feed' && role === 'player' && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand ring-1 ring-near-black" />
                  )}
                </span>
                <span className={`font-ui text-xs ${isActive ? 'font-semibold' : ''}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-5 h-0.5 bg-brand rounded-t-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
