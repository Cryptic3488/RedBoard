import { useEffect } from 'react'
import { useFilmPosts } from '../../hooks/useFilmPosts'
import { useUnreadCount } from '../../hooks/useUnreadCount'
import { FilmCard } from '../../components/FilmCard'

export default function Film() {
  const { posts, loading, error } = useFilmPosts()
  const { markAllRead } = useUnreadCount()

  // Clear unread badge when player visits this page
  useEffect(() => {
    markAllRead()
  }, [markAllRead])

  return (
    <div className="px-4 pt-8 pb-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-600">
          Film
        </span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <span className="w-5 h-5 border-2 border-gray-700 border-t-brand rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <p className="font-ui text-sm text-red-400 text-center py-8">{error}</p>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-900/80 border border-gray-800 flex items-center justify-center mb-4">
            <span className="text-2xl">🎬</span>
          </div>
          <h3 className="font-display text-lg font-semibold text-cream mb-2">No clips yet</h3>
          <p className="font-ui text-gray-500 text-sm leading-relaxed max-w-xs">
            Your coaches will share Hudl clips and film here.
          </p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map(post => (
            <FilmCard
              key={post.id}
              post={post}
              isPersonal={post.visibility === 'individual'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
