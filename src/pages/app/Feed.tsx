import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useFilmPosts } from '../../hooks/useFilmPosts'
import { useWellnessCheck } from '../../hooks/useWellnessCheck'
import { usePlayerStats, type EnrichedWeek, type EnrichedGame } from '../../hooks/usePlayerStats'
import { STAT_LABELS, type StandardStatKey } from '../../lib/statParser'
import { FilmCard } from '../../components/FilmCard'
import { supabase } from '../../lib/supabase'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-white/80 dark:bg-[#2C2C2E] border border-gray-200 flex items-center justify-center mb-4">
        <span className="text-2xl">📋</span>
      </div>
      <h3 className="font-display text-lg font-semibold text-near-black dark:text-gray-100 mb-2">Nothing here yet</h3>
      <p className="font-ui text-gray-500 text-sm leading-relaxed max-w-xs">
        Your coaches will share film clips, stats, wellness check-ins, and playbook updates here.
      </p>
    </div>
  )
}

const HERO_STATS: StandardStatKey[] = ['points', 'total_reb', 'assists', 'steals']

function trendEl(delta: number | null): React.ReactNode {
  if (delta === null)        return <span className="text-gray-300">—</span>
  if (delta > 0.05)          return <span className="text-brand">↑ +{delta.toFixed(1)}</span>
  if (delta < -0.05)         return <span className="text-gray-400">↓ {delta.toFixed(1)}</span>
  return                            <span className="text-gray-300">—</span>
}

function StatRow({ stats, deltas }: {
  stats: Record<StandardStatKey, number | null>
  deltas: Partial<Record<StandardStatKey, number | null>>
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {HERO_STATS.map(stat => (
        <div key={stat} className="text-center">
          <p className="font-display text-2xl font-bold text-near-black dark:text-gray-100 leading-none">
            {stats[stat] !== null ? stats[stat]!.toFixed(1) : '—'}
          </p>
          <p className="font-ui text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">
            {STAT_LABELS[stat]}
          </p>
          <p className="font-ui text-[9px] font-semibold mt-0.5">
            {trendEl(deltas[stat] ?? null)}
          </p>
        </div>
      ))}
    </div>
  )
}

function PracticeCard({ latest, prev }: { latest: EnrichedWeek; prev: EnrichedWeek | null }) {
  const deltas: Partial<Record<StandardStatKey, number | null>> = {}
  for (const stat of HERO_STATS) {
    const val  = latest.stats[stat]
    const pval = prev?.stats[stat] ?? null
    deltas[stat] = val !== null && pval !== null ? val - pval : null
  }
  return (
    <Link
      to="/app/stats"
      className="block bg-white/80 dark:bg-[#2C2C2E] border border-gray-200 border-l-2 border-l-brand
                 rounded-xl p-4 hover:border-gray-300 hover:border-l-brand-light transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-ui text-xs text-gray-500 truncate">{latest.label}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide flex-shrink-0 bg-gray-100 text-gray-500">
            Practice
          </span>
        </div>
        <span className="font-ui text-[11px] text-brand flex-shrink-0 ml-2">See stats →</span>
      </div>
      <StatRow stats={latest.stats} deltas={deltas} />
      {prev && (
        <p className="font-ui text-[9px] text-gray-300 text-right mt-2">vs last week</p>
      )}
    </Link>
  )
}

function GameCard({ game }: { game: EnrichedGame }) {
  const deltas: Partial<Record<StandardStatKey, number | null>> = {}
  for (const stat of HERO_STATS) {
    const val = game.stats[stat]
    const avg = game.careerAvg[stat]
    deltas[stat] = val !== null && avg !== null ? val - avg : null
  }
  return (
    <Link
      to="/app/stats"
      className="block bg-white/80 dark:bg-[#2C2C2E] border border-gray-200 border-l-2 border-l-brand
                 rounded-xl p-4 hover:border-gray-300 hover:border-l-brand-light transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-ui text-xs text-gray-500 truncate">{game.label}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide flex-shrink-0 bg-brand/10 text-brand">
            Game
          </span>
        </div>
        <span className="font-ui text-[11px] text-brand flex-shrink-0 ml-2">See stats →</span>
      </div>
      <StatRow stats={game.stats} deltas={deltas} />
      <p className="font-ui text-[9px] text-gray-300 text-right mt-2">vs career avg</p>
    </Link>
  )
}

function StatsSnapshots() {
  const { practiceWeeks, games } = usePlayerStats()
  if (practiceWeeks.length === 0 && games.length === 0) return null
  return (
    <div className="space-y-3 mb-6">
      {practiceWeeks.length > 0 && (
        <PracticeCard latest={practiceWeeks[0]} prev={practiceWeeks[1] ?? null} />
      )}
      {games.length > 0 && (
        <GameCard game={games[0]} />
      )}
    </div>
  )
}

interface PlaybookUpdate {
  folderName: string
  fileCount: number
}

function useLatestPlaybookUpdate(): PlaybookUpdate | null {
  const [update, setUpdate] = useState<PlaybookUpdate | null>(null)

  useEffect(() => {
    // Find the most recently updated folder (by latest file creation time)
    supabase
      .from('playbook_files')
      .select('folder_id, folder:playbook_folders(name)')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(async ({ data }) => {
        if (!data || data.length === 0) return
        const row = data[0] as { folder_id: string; folder: { name: string } | null }
        if (!row.folder) return
        const folderId = row.folder_id
        const folderName = row.folder.name
        // Count files in that folder
        const { count } = await supabase
          .from('playbook_files')
          .select('id', { count: 'exact', head: true })
          .eq('folder_id', folderId)
        setUpdate({ folderName, fileCount: count ?? 1 })
      })
  }, [])

  return update
}

function PlaybookCard() {
  const update = useLatestPlaybookUpdate()
  if (!update) return null
  return (
    <Link
      to="/app/playbook"
      className="flex items-center gap-3 bg-white/80 dark:bg-[#2C2C2E] border border-gray-200 border-l-2 border-l-brand
                 rounded-xl px-4 py-3.5 mb-6 hover:border-gray-300 hover:border-l-brand-light transition-all"
    >
      <span className="text-xl flex-shrink-0">📖</span>
      <div className="flex-1 min-w-0">
        <p className="font-ui text-sm font-semibold text-near-black">Playbook updated</p>
        <p className="font-ui text-xs text-gray-400 truncate">
          {update.fileCount} {update.fileCount === 1 ? 'play' : 'plays'} in {update.folderName}
        </p>
      </div>
      <span className="font-ui text-[11px] text-brand flex-shrink-0">Browse →</span>
    </Link>
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
  const { form: wellnessForm, todayResponse, loading: wellnessLoading } = useWellnessCheck()

  const latestPosts = posts.slice(0, 3)
  const hasMore = posts.length > 3

  return (
    <div className="px-4 pt-8 pb-6 max-w-lg mx-auto">

      {/* Editorial greeting */}
      <div className="mb-8">
        <p className="font-ui text-xs tracking-widest uppercase text-gray-500 mb-2">
          {greeting()}
        </p>
        <h1 className="font-display text-5xl font-bold text-near-black dark:text-gray-100 leading-none">
          {firstName}.
        </h1>
        <p className="font-display text-xl italic text-brand mt-1">
          Ready to work.
        </p>
      </div>

      {/* Wellness nudge — shown when active form exists and not yet submitted today */}
      {!wellnessLoading && wellnessForm && !todayResponse && (
        <Link
          to="/app/wellness"
          className="flex items-center gap-3 bg-white/80 border border-gold/50 border-l-2 border-l-gold rounded-xl px-4 py-3 mb-6 hover:border-gold transition-colors"
        >
          <span className="text-xl flex-shrink-0">💪</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-near-black dark:text-gray-100">Today's check-in</p>
            <p className="text-xs text-gray-400 truncate">{wellnessForm.title}</p>
          </div>
          <span className="text-gold text-sm flex-shrink-0">→</span>
        </Link>
      )}

      {/* Section cards — 2-col grid with left red accent border */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {SECTION_LINKS.map(({ icon, label, description, to }) => (
          <Link
            key={to}
            to={to}
            className="group bg-white/80 dark:bg-[#2C2C2E] border border-gray-200 border-l-2 border-l-brand
                       rounded-xl p-4 hover:border-gray-300 hover:border-l-brand-light
                       transition-all"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base leading-none">{icon}</span>
              <span className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-600
                               group-hover:text-near-black transition-colors">
                {label}
              </span>
            </div>
            <p className="font-ui text-xs text-gray-400">{description}</p>
          </Link>
        ))}
      </div>

      {/* Stat snapshots — practice (vs last week) + latest game (vs career avg) */}
      <StatsSnapshots />

      {/* Playbook update card */}
      <PlaybookCard />

      {/* Latest section */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400">
            Latest
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <span className="w-5 h-5 border-2 border-gray-300 border-t-brand rounded-full animate-spin" />
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
