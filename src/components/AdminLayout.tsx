import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  IconDashboard, IconRoster, IconFilm, IconStats,
  IconWellnessAdmin, IconPlaybook, IconLogOut, IconSun, IconMoon,
} from './icons'

const ADMIN_NAV = [
  { to: '/admin',          label: 'Dashboard', Icon: IconDashboard, end: true },
  { to: '/admin/roster',   label: 'Roster',    Icon: IconRoster,    end: false },
  { to: '/admin/film',     label: 'Film',      Icon: IconFilm,      end: false },
  { to: '/admin/stats',    label: 'Stats',     Icon: IconStats,     end: false },
  { to: '/admin/wellness', label: 'Wellness',  Icon: IconWellnessAdmin, end: false },
  { to: '/admin/playbook', label: 'Playbook',  Icon: IconPlaybook,  end: false },
]

// Mobile nav excludes Dashboard (accessible via logo)
const MOBILE_NAV = ADMIN_NAV.filter(n => n.label !== 'Dashboard')

export function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { dim, setDim } = useTheme()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111113] transition-colors">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-gray-800/60
                         px-4 pt-safe-top sticky top-0 z-20">
        <div className="flex items-center justify-between h-14">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="font-ui font-black text-xl tracking-tight text-brand">Red</span>
              <span className="font-ui font-black text-xl tracking-tight text-near-black dark:text-white">Board</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px]
                             font-semibold tracking-widest uppercase
                             bg-brand/10 text-brand border border-brand/20">
              Coach
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to="/app/feed"
              className="hidden sm:flex font-ui text-xs font-medium text-gray-500 dark:text-gray-400
                         px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/10
                         hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
            >
              Player view
            </Link>
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
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="p-2 rounded-full text-gray-400 dark:text-gray-500
                         hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <IconLogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="md:flex">

        {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-[#1C1C1E]
                          border-r border-gray-200 dark:border-gray-800/60 py-4 gap-0.5 shrink-0">
          {ADMIN_NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `mx-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                 ${isActive
                   ? 'bg-brand/8 text-brand dark:bg-brand/15'
                   : 'text-gray-500 dark:text-gray-400 hover:text-near-black dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/5'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          <div className="mt-auto mx-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Link
              to="/app/feed"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                         text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <IconStats size={18} />
              <span>Player view</span>
            </Link>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────────────────── */}
        <main className="md:flex-1 pb-nav-safe md:pb-8 px-4 py-6 max-w-5xl">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav (5 items, icons + active label) ───────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-20 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md
                      border-t border-gray-200 dark:border-gray-800/60 flex md:hidden pb-safe">
        {MOBILE_NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors
               ${isActive
                 ? 'text-brand'
                 : 'text-gray-400 dark:text-gray-600'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
                <span className={`font-ui text-[10px] tracking-wide
                  ${isActive ? 'font-semibold' : 'font-normal'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
