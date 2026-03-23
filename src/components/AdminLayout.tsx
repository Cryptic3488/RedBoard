import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <header className="bg-white/90 backdrop-blur border-b border-gray-200/60 px-4 py-3
                         flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-ui font-black text-lg text-brand">Red</span>
            <span className="font-ui font-black text-lg text-near-black">Board</span>
          </div>
          <div className="w-px h-3.5 bg-gray-300" />
          <span className="font-ui text-xs tracking-widest uppercase text-brand font-semibold">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/app/feed"
            className="font-ui text-xs text-gray-500 hover:text-near-black px-2.5 py-1 rounded
                       border border-gray-200 hover:border-gray-400 transition-colors"
          >
            Player view
          </Link>
          <button
            onClick={handleSignOut}
            className="font-ui text-xs text-gray-400 hover:text-near-black transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-52 bg-gray-50 border-r border-gray-200/60 p-4 gap-0.5">
          {ADMIN_NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `font-ui px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                 ${isActive
                  ? 'bg-brand/10 text-brand border-l-2 border-brand pl-[10px]'
                  : 'text-gray-500 hover:text-near-black hover:bg-gray-100/60'
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
      <nav className="fixed bottom-0 inset-x-0 bg-white backdrop-blur border-t border-gray-200/60
                      flex md:hidden z-10">
        {ADMIN_NAV.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center py-3 font-ui text-xs transition-colors
               ${isActive ? 'text-brand font-semibold' : 'text-gray-400 hover:text-gray-600'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
