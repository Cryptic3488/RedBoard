import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface QuickAction {
  icon: string
  label: string
  description: string
  to: string
  accent: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: '🎬',
    label: 'Share Film',
    description: 'Send a Hudl clip with notes to the team or individual players.',
    to: '/admin/film',
    accent: 'border-blue-800 hover:border-blue-600',
  },
  {
    icon: '📊',
    label: 'Manage Stats',
    description: 'Upload a dataset and publish chart views for players.',
    to: '/admin/stats',
    accent: 'border-emerald-800 hover:border-emerald-600',
  },
  {
    icon: '💪',
    label: 'Wellness',
    description: 'Create a daily check-in and review player responses.',
    to: '/admin/wellness',
    accent: 'border-brand/50 hover:border-brand',
  },
  {
    icon: '📖',
    label: 'Playbook',
    description: 'Upload and organize playbook PDFs by category.',
    to: '/admin/playbook',
    accent: 'border-amber-800 hover:border-amber-600',
  },
]

export default function AdminDashboard() {
  const { profile } = useAuth()
  const firstName = profile?.name?.split(' ')[0] ?? 'Coach'

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gray-400 text-sm mb-1">{greeting()},</p>
        <h1 className="text-white text-3xl font-bold">{firstName}</h1>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ icon, label, description, to, accent }) => (
            <Link
              key={to}
              to={to}
              className={`group bg-gray-900 border ${accent} rounded-2xl p-5 flex gap-4 items-start transition-colors`}
            >
              <span className="text-3xl leading-none mt-0.5">{icon}</span>
              <div>
                <p className="text-white font-semibold text-sm mb-1">{label}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Status strip */}
      <section className="mt-8">
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Film posts', value: '—' },
            { label: 'Stats views', value: '—' },
            { label: 'Open wellness', value: '—' },
            { label: 'Playbook items', value: '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white mb-1">{value}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3">
          Live counts will populate as features are activated.
        </p>
      </section>
    </div>
  )
}
