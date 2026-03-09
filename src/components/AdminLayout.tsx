import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-brand font-black text-lg">Red</span>
            <span className="text-white font-black text-lg">Board</span>
          </div>
          <span className="text-xs text-brand bg-brand/10 border border-brand/30 px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Desktop side nav — hidden on mobile, shown md+ */}
      <div className="flex flex-1">
        <aside className="hidden md:flex flex-col w-52 bg-gray-900 border-r border-gray-800 p-4 gap-1">
          {ADMIN_NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors
                 ${isActive ? 'bg-brand/20 text-brand' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-4 px-4 py-6 max-w-4xl">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav on mobile */}
      <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 flex md:hidden z-10">
        {ADMIN_NAV.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center py-3 text-xs transition-colors
               ${isActive ? 'text-brand' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
