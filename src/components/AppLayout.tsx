import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUnreadCount } from '../hooks/useUnreadCount'
import { useTheme } from '../context/ThemeContext'

const NAV = [
  { to: '/app/feed',     label: 'Feed',     icon: '📋' },
  { to: '/app/stats',    label: 'Stats',    icon: '📊' },
  { to: '/app/film',     label: 'Film',     icon: '🎬' },
  { to: '/app/wellness', label: 'Wellness', icon: '💪' },
  { to: '/app/playbook', label: 'Playbook', icon: '📖' },
]

export function AppLayout() {
  const { role, profile } = useAuth()
  const { unreadCount } = useUnreadCount()
  const { dim, setDim } = useTheme()

  const avatarUrl  = profile?.avatar_url ?? null
  const initial    = (profile?.name ?? '?').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1C1C1E] flex flex-col transition-colors">
      {/* Top bar */}
      <header className="bg-white/90 dark:bg-[#1A1A1A]/95 backdrop-blur
                         border-b border-gray-200/60
                         px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-1.5">
          <span className="font-ui font-black text-lg text-brand">Red</span>
          <span className="font-ui font-black text-lg text-near-black dark:text-gray-100">Board</span>
          <div className="w-px h-3.5 bg-gray-300 dark:bg-gray-600 mx-1.5" />
          <span className="font-ui text-xs text-gray-400 tracking-widest uppercase">WBB</span>
        </div>
        <div className="flex items-center gap-3">
          {role === 'admin' && (
            <NavLink
              to="/admin"
              className="font-ui text-xs text-gray-500 dark:text-gray-400 hover:text-near-black dark:hover:text-gray-100
                         px-2.5 py-1 rounded border border-gray-200
                         hover:border-gray-600 transition-colors"
            >
              Admin
            </NavLink>
          )}
          <button
            type="button"
            onClick={() => setDim(!dim)}
            aria-label="Toggle dim mode"
            className="font-ui text-xs text-gray-400 dark:text-gray-500 hover:text-near-black dark:hover:text-gray-100 transition-colors px-2 py-1"
          >
            {dim ? '☀' : '◗'}
          </button>
          {/* Avatar — links to Profile page */}
          <Link to="/app/profile" aria-label="Profile">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600
                           hover:ring-brand transition-all"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center
                              ring-2 ring-gray-200 dark:ring-gray-600 hover:ring-brand transition-all">
                <span className="font-ui font-bold text-white text-sm leading-none">{initial}</span>
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-[#1A1A1A]
                      border-t border-gray-200/60 flex z-10">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 transition-colors
               ${isActive ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative inline-flex text-xl leading-none mb-0.5">
                  {icon}
                  {to === '/app/feed' && role === 'player' && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand
                                     ring-1 ring-cream dark:ring-[#1A1A1A]" />
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
