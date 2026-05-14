import { useEffect } from 'react'
import { useFilmPosts } from '../../hooks/useFilmPosts'
import { useUnreadCount } from '../../hooks/useUnreadCount'
import { FilmCard } from '../../components/FilmCard'
import { IconFilm } from '../../components/icons'

export default function Film() {
  const { posts, loading, error } = useFilmPosts()
  const { markAllRead } = useUnreadCount()

  useEffect(() => { markAllRead() }, [markAllRead])

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">

      <div className="mb-6">
        <p className="font-ui text-xs tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">Your</p>
        <h1 className="font-display text-4xl font-black text-near-black dark:text-white leading-none">Film.</h1>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <p className="font-ui text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10
                      border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/8 flex items-center justify-center mb-4">
            <IconFilm size={24} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="font-ui font-semibold text-near-black dark:text-gray-100">No clips yet</p>
          <p className="font-ui text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
            Your coaches will share Hudl clips and film here.
          </p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map(post => (
            <FilmCard key={post.id} post={post} isPersonal={post.visibility === 'individual'} />
          ))}
        </div>
      )}
    </div>
  )
}
