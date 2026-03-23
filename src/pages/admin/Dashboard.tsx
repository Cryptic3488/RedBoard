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
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: '🎬',
    label: 'Share Film',
    description: 'Send a Hudl clip with notes to the team or individual players.',
    to: '/admin/film',
  },
  {
    icon: '📊',
    label: 'Manage Stats',
    description: 'Upload a dataset and publish chart views for players.',
    to: '/admin/stats',
  },
  {
    icon: '💪',
    label: 'Wellness',
    description: 'Create a daily check-in and review player responses.',
    to: '/admin/wellness',
  },
  {
    icon: '📖',
    label: 'Playbook',
    description: 'Upload and organize playbook PDFs by category.',
    to: '/admin/playbook',
  },
]

const STATUS_ITEMS = [
  { label: 'Film posts', value: '—' },
  { label: 'Stats views', value: '—' },
  { label: 'Open wellness', value: '—' },
  { label: 'Playbook items', value: '—' },
]

export default function AdminDashboard() {
  const { profile } = useAuth()
  const firstName = profile?.name?.split(' ')[0] ?? 'Coach'

  return (
    <div className="max-w-3xl">

      {/* Editorial greeting */}
      <div className="mb-10">
        <p className="font-ui text-xs tracking-widest uppercase text-gray-500 mb-2">
          {greeting()}
        </p>
        <h1 className="font-display text-5xl font-bold text-near-black leading-none">
          {firstName}.
        </h1>
        <p className="font-display text-xl italic text-brand mt-1">
          Let's build something great.
        </p>
      </div>

      {/* Quick actions */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <span className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400">
            Quick Actions
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ icon, label, description, to }) => (
            <Link
              key={to}
              to={to}
              className="group bg-white/80 border border-gray-200 border-l-2 border-l-brand
                         rounded-xl p-5 flex gap-4 items-start
                         hover:border-gray-300 hover:border-l-brand-light transition-all"
            >
              <span className="text-2xl leading-none mt-0.5 shrink-0">{icon}</span>
              <div>
                <p className="font-ui font-semibold text-sm text-near-black mb-1
                               group-hover:text-brand transition-colors">
                  {label}
                </p>
                <p className="font-ui text-xs text-gray-500 leading-relaxed">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Status strip */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400">
            Status
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATUS_ITEMS.map(({ label, value }) => (
            <div key={label} className="bg-white/80 border border-gray-200 rounded-xl p-4">
              <p className="font-display text-3xl font-bold text-near-black mb-1">{value}</p>
              <p className="font-ui text-xs text-gray-400 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
        <p className="font-ui text-gray-300 text-xs mt-3">
          Live counts will populate as features are activated.
        </p>
      </section>
    </div>
  )
}
