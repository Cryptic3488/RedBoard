import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUnreadCount } from '../hooks/useUnreadCount'
import { useTheme } from '../context/ThemeContext'
import {
  IconFeed, IconStats, IconFilm, IconWellness, IconPlaybook,
  IconSun, IconMoon,
} from './icons'

const NAV = [
  { to: '/app/feed',     label: 'Feed',     Icon: IconFeed },
  { to: '/app/stats',    label: 'Stats',    Icon: IconStats },
  { to: '/app/film',     label: 'Film',     Icon: IconFilm },
  { to: '/app/wellness', label: 'Wellness', Icon: IconWellness },
  { to: '/app/playbook', label: 'Playbook', Icon: IconPlaybook },
]

export function AppLayout() {
  const { role, profile } = useAuth()
  const { unreadCount } = useUnreadCount()
  const { dim, setDim } = useTheme()

  const avatarUrl = profile?.avatar_url ?? null
  const initial  = (profile?.name ?? '?').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111113] flex flex-col transition-colors">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-gray-800/60
                         px-4 pt-safe-top sticky top-0 z-20">
        <div className="flex items-center justify-between h-14">
          <Link to="/app/feed" className="flex items-center gap-1">
            <span className="font-ui font-black text-xl tracking-tight text-brand">Red</span>
            <span className="font-ui font-black text-xl tracking-tight text-near-black dark:text-white">Board</span>
          </Link>

          <div className="flex items-center gap-1">
            {role === 'admin' && (
              <NavLink
                to="/admin"
                className="font-ui text-xs font-medium text-gray-500 dark:text-gray-400
                           px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/10
                           hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
              >
                Admin
              </NavLink>
            )}
            <button
              type="button"
              onClick={() => setDim(!dim)}
              aria-label="Toggle theme"
              className="p-2 rounded-full text-gray-400 dark:text-gray-500
                         hover:text-gray-600 dark:hover:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              {dim ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
            <Link to="/app/profile" aria-label="Profile" className="ml-1">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-brand/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
                  <span className="font-ui font-bold text-white text-sm leading-none">{initial}</span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overscroll-none pb-nav-safe bg-gray-50 dark:bg-[#111113]">
        <Outlet />
      </main>

      {/* ── Bottom nav ──────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-20 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md
                      border-t border-gray-100 dark:border-gray-800/60 pb-safe">
        <div className="flex">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative
                 ${isActive
                   ? 'text-brand'
                   : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                    {to === '/app/feed' && role === 'player' && unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-brand
                                       ring-2 ring-white dark:ring-[#1C1C1E]" />
                    )}
                  </span>
                  <span className={`font-ui text-[10px] tracking-wide transition-all
                    ${isActive ? 'font-semibold' : 'font-normal'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
