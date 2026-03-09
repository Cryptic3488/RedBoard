import { useAuth } from '../../context/AuthContext'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Placeholder until F-10 is implemented
function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-5">
        <span className="text-4xl">📋</span>
      </div>
      <h3 className="text-white font-semibold text-base mb-2">Nothing here yet</h3>
      <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
        Your coaches will share film clips, stats, wellness check-ins, and playbook updates here.
      </p>
    </div>
  )
}

const SECTION_LINKS = [
  { icon: '📊', label: 'Stats', to: '/app/stats', color: 'text-emerald-400' },
  { icon: '🎬', label: 'Film', to: '/app/film', color: 'text-blue-400' },
  { icon: '💪', label: 'Wellness', to: '/app/wellness', color: 'text-brand' },
  { icon: '📖', label: 'Playbook', to: '/app/playbook', color: 'text-amber-400' },
]

export default function Feed() {
  const { profile } = useAuth()
  const firstName = profile?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-400 text-sm">{greeting()},</p>
        <h1 className="text-white text-2xl font-bold">{firstName}</h1>
      </div>

      {/* Section shortcuts */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {SECTION_LINKS.map(({ icon, label, to, color }) => (
          <a
            key={to}
            href={to}
            className="bg-gray-900 border border-gray-800 rounded-xl py-3 flex flex-col items-center gap-1.5 hover:border-gray-600 transition-colors"
          >
            <span className={`text-xl ${color}`}>{icon}</span>
            <span className="text-gray-400 text-xs">{label}</span>
          </a>
        ))}
      </div>

      {/* Feed content */}
      <div>
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Latest
        </h2>
        <EmptyFeed />
      </div>
    </div>
  )
}
