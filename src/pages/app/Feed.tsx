import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useFilmPosts } from '../../hooks/useFilmPosts'
import { FilmCard } from '../../components/FilmCard'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-900/80 border border-gray-800 flex items-center justify-center mb-4">
        <span className="text-2xl">📋</span>
      </div>
      <h3 className="font-display text-lg font-semibold text-cream mb-2">Nothing here yet</h3>
      <p className="font-ui text-gray-500 text-sm leading-relaxed max-w-xs">
        Your coaches will share film clips, stats, wellness check-ins, and playbook updates here.
      </p>
    </div>
  )
}

const SECTION_LINKS = [
  {
    icon: '📊',
    label: 'Stats',
    description: 'Your numbers',
    to: '/app/stats',
  },
  {
    icon: '🎬',
    label: 'Film',
    description: 'Review clips',
    to: '/app/film',
  },
  {
    icon: '💪',
    label: 'Wellness',
    description: 'Daily check-in',
    to: '/app/wellness',
  },
  {
    icon: '📖',
    label: 'Playbook',
    description: 'Study the plays',
    to: '/app/playbook',
  },
]

export default function Feed() {
  const { profile } = useAuth()
  const firstName = profile?.name?.split(' ')[0] ?? 'there'
  const { posts, loading } = useFilmPosts()

  const latestPosts = posts.slice(0, 3)
  const hasMore = posts.length > 3

  return (
    <div className="px-4 pt-8 pb-6 max-w-lg mx-auto">

      {/* Editorial greeting */}
      <div className="mb-8">
        <p className="font-ui text-xs tracking-widest uppercase text-gray-500 mb-2">
          {greeting()}
        </p>
        <h1 className="font-display text-5xl font-bold text-cream leading-none">
          {firstName}.
        </h1>
        <p className="font-display text-xl italic text-brand mt-1">
          Ready to work.
        </p>
      </div>

      {/* Section cards — 2-col grid with left red accent border */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {SECTION_LINKS.map(({ icon, label, description, to }) => (
          <Link
            key={to}
            to={to}
            className="group bg-gray-900/70 border border-gray-800 border-l-2 border-l-brand
                       rounded-xl p-4 hover:border-gray-700 hover:border-l-brand-light
                       transition-all"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base leading-none">{icon}</span>
              <span className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400
                               group-hover:text-cream transition-colors">
                {label}
              </span>
            </div>
            <p className="font-ui text-xs text-gray-600">{description}</p>
          </Link>
        ))}
      </div>

      {/* Latest section */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-600">
            Latest
          </span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <span className="w-5 h-5 border-2 border-gray-700 border-t-brand rounded-full animate-spin" />
          </div>
        )}

        {!loading && latestPosts.length === 0 && <EmptyFeed />}

        {!loading && latestPosts.length > 0 && (
          <div className="space-y-4">
            {latestPosts.map(post => (
              <FilmCard
                key={post.id}
                post={post}
                isPersonal={post.visibility === 'individual'}
              />
            ))}
            {hasMore && (
              <Link
                to="/app/film"
                className="block text-center font-ui text-sm text-brand hover:text-brand-light
                           transition-colors py-2"
              >
                View all {posts.length} clips →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
