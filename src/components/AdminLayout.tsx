import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/film', label: 'Film' },
  { to: '/admin/stats', label: 'Stats' },
  { to: '/admin/wellness', label: 'Wellness' },
  { to: '/admin/playbook', label: 'Playbook' },
]

export function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { dim, setDim } = useTheme()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1C1C1E] flex flex-col transition-colors">
      {/* Top bar */}
      <header className="bg-white/90 dark:bg-[#1A1A1A]/95 backdrop-blur border-b border-gray-200/60 px-4 py-3
                         flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-ui font-black text-lg text-brand">Red</span>
            <span className="font-ui font-black text-lg text-near-black dark:text-gray-100">Board</span>
          </div>
          <div className="w-px h-3.5 bg-gray-300" />
          <span className="font-ui text-xs tracking-widest uppercase text-brand font-semibold">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/app/feed"
            className="font-ui text-xs text-gray-500 dark:text-gray-400 hover:text-near-black dark:hover:text-gray-100 px-2.5 py-1 rounded
                       border border-gray-200 hover:border-gray-400 transition-colors"
          >
            Player view
          </Link>
          <button
            type="button"
            onClick={() => setDim(!dim)}
            aria-label="Toggle dim mode"
            className="font-ui text-xs text-gray-400 dark:text-gray-500 hover:text-near-black dark:hover:text-gray-100 transition-colors px-2 py-1"
          >
            {dim ? '☀' : '◗'}
          </button>
          <button
            onClick={handleSignOut}
            className="font-ui text-xs text-gray-400 dark:text-gray-500 hover:text-near-black dark:hover:text-gray-100 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-52 bg-gray-50 dark:bg-[#1A1A1A] border-r border-gray-200/60 dark:border-gray-700/50 p-4 gap-0.5">
          {ADMIN_NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `font-ui px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                 ${isActive
                  ? 'bg-brand/10 text-brand border-l-2 border-brand pl-[10px]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-near-black dark:hover:text-gray-100 hover:bg-gray-100/60 dark:hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 px-4 py-8 max-w-4xl">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-[#1A1A1A] backdrop-blur border-t border-gray-200/60 dark:border-gray-700/50
                      flex md:hidden z-10">
        {ADMIN_NAV.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center py-3 font-ui text-xs transition-colors
               ${isActive ? 'text-brand font-semibold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
