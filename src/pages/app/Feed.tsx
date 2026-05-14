import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useWellnessCheck } from '../../hooks/useWellnessCheck'
import { usePlayerStats, type EnrichedWeek, type EnrichedGame } from '../../hooks/usePlayerStats'
import { useFeedItems, type FeedItem } from '../../hooks/useFeedItems'
import { STAT_LABELS, type StandardStatKey } from '../../lib/statParser'
import { greeting } from '../../lib/greeting'
import { FilmCard } from '../../components/FilmCard'
import {
  IconStats, IconPlaybook, IconWellness,
  IconTrendUp, IconTrendDown, IconChevronRight,
} from '../../components/icons'

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/8 flex items-center justify-center mb-4">
        <IconStats size={24} className="text-gray-300 dark:text-gray-600" />
      </div>
      <h3 className="font-ui font-semibold text-near-black dark:text-gray-100 mb-1">Nothing yet</h3>
      <p className="font-ui text-sm text-gray-400 dark:text-gray-500 leading-relaxed max-w-xs">
        Your coaches will share film, stats, wellness check-ins, and playbook updates here.
      </p>
    </div>
  )
}

// ── Stat hero card ────────────────────────────────────────────────────────────

const HERO_STATS: StandardStatKey[] = ['points', 'total_reb', 'assists', 'steals']

function TrendBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null
  if (delta > 0.05) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
      <IconTrendUp size={10} strokeWidth={2.5} />+{delta.toFixed(1)}
    </span>
  )
  if (delta < -0.05) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-gray-400">
      <IconTrendDown size={10} strokeWidth={2.5} />{delta.toFixed(1)}
    </span>
  )
  return null
}

function StatGrid({ stats, deltas }: {
  stats: Record<StandardStatKey, number | null>
  deltas: Partial<Record<StandardStatKey, number | null>>
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {HERO_STATS.map(stat => (
        <div key={stat} className="text-center">
          <p className="font-display text-3xl font-black text-near-black dark:text-white leading-none">
            {stats[stat] !== null ? stats[stat]!.toFixed(1) : '—'}
          </p>
          <p className="font-ui text-[10px] text-gray-400 uppercase tracking-wider mt-1">
            {STAT_LABELS[stat]}
          </p>
          <div className="mt-0.5 h-4 flex items-center justify-center">
            <TrendBadge delta={deltas[stat] ?? null} />
          </div>
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
    <Link to="/app/stats" className="block bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-sm
                                      border border-gray-100 dark:border-gray-800/60 active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-ui text-xs font-semibold text-gray-500 dark:text-gray-400">{latest.label}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                           bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
            Practice
          </span>
        </div>
        <span className="font-ui text-xs font-medium text-brand flex items-center gap-0.5">
          Stats <IconChevronRight size={12} strokeWidth={2.5} />
        </span>
      </div>
      <StatGrid stats={latest.stats} deltas={deltas} />
      {prev && (
        <p className="font-ui text-[10px] text-gray-300 dark:text-gray-700 text-right mt-3">vs last week</p>
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
    <Link to="/app/stats" className="block bg-brand rounded-2xl p-5 shadow-sm
                                      active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-ui text-xs font-semibold text-white/80">{game.label}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                           bg-white/20 text-white">
            Game
          </span>
        </div>
        <span className="font-ui text-xs font-medium text-white/80 flex items-center gap-0.5">
          Stats <IconChevronRight size={12} strokeWidth={2.5} />
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {HERO_STATS.map(stat => (
          <div key={stat} className="text-center">
            <p className="font-display text-3xl font-black text-white leading-none">
              {game.stats[stat] !== null ? game.stats[stat]!.toFixed(1) : '—'}
            </p>
            <p className="font-ui text-[10px] text-white/60 uppercase tracking-wider mt-1">
              {STAT_LABELS[stat]}
            </p>
            <div className="mt-0.5 h-4 flex items-center justify-center">
              <TrendBadge delta={deltas[stat] ?? null} />
            </div>
          </div>
        ))}
      </div>
      <p className="font-ui text-[10px] text-white/40 text-right mt-3">vs career avg</p>
    </Link>
  )
}

function StatsSnapshots() {
  const { practiceWeeks, games } = usePlayerStats()
  if (practiceWeeks.length === 0 && games.length === 0) return null
  return (
    <div className="space-y-3 mb-6">
      {games.length > 0 && <GameCard game={games[0]} />}
      {practiceWeeks.length > 0 && (
        <PracticeCard latest={practiceWeeks[0]} prev={practiceWeeks[1] ?? null} />
      )}
    </div>
  )
}

// ── Feed item cards ───────────────────────────────────────────────────────────

function StatFeedCard({ label, session_type }: { label: string; session_type: string }) {
  const isGame = session_type === 'game'
  return (
    <Link to="/app/stats"
      className="flex items-center gap-4 bg-white dark:bg-[#1C1C1E] rounded-2xl px-4 py-4
                 border border-gray-100 dark:border-gray-800/60 shadow-sm active:scale-[0.98] transition-transform">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      bg-brand/10 dark:bg-brand/20">
        <IconStats size={20} className="text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-ui text-sm font-semibold text-near-black dark:text-gray-100 truncate">{label}</p>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0
            ${isGame ? 'bg-brand/10 text-brand' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
            {isGame ? 'Game' : 'Practice'}
          </span>
        </div>
        <p className="font-ui text-xs text-gray-400 dark:text-gray-500">Stats posted</p>
      </div>
      <IconChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
    </Link>
  )
}

function PlaybookFeedCard({ folderName, fileCount }: { folderName: string; fileCount: number }) {
  return (
    <Link to="/app/playbook"
      className="flex items-center gap-4 bg-white dark:bg-[#1C1C1E] rounded-2xl px-4 py-4
                 border border-gray-100 dark:border-gray-800/60 shadow-sm active:scale-[0.98] transition-transform">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      bg-gray-100 dark:bg-white/10">
        <IconPlaybook size={20} className="text-gray-500 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-ui text-sm font-semibold text-near-black dark:text-gray-100 mb-0.5">Playbook updated</p>
        <p className="font-ui text-xs text-gray-400 dark:text-gray-500 truncate">
          {fileCount} {fileCount === 1 ? 'play' : 'plays'} in {folderName}
        </p>
      </div>
      <IconChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
    </Link>
  )
}

function FeedItemCard({ item }: { item: FeedItem }) {
  if (item.type === 'film') {
    return <FilmCard post={item.payload} isPersonal={item.payload.visibility === 'individual'} />
  }
  if (item.type === 'stats') {
    return <StatFeedCard label={item.payload.label} session_type={item.payload.session_type} />
  }
  return <PlaybookFeedCard folderName={item.payload.folderName} fileCount={item.payload.fileCount} />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Feed() {
  const { profile } = useAuth()
  const firstName = profile?.name?.split(' ')[0] ?? 'there'
  const { items, loading } = useFeedItems()
  const { form: wellnessForm, todayResponse, loading: wellnessLoading } = useWellnessCheck()

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">

      {/* Greeting */}
      <div className="mb-7">
        <p className="font-ui text-xs tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">
          {greeting()}
        </p>
        <h1 className="font-display text-4xl font-black text-near-black dark:text-white leading-none">
          {firstName}.
        </h1>
        <p className="font-display text-lg italic text-brand mt-1">Ready to work.</p>
      </div>

      {/* Wellness nudge */}
      {!wellnessLoading && wellnessForm && !todayResponse && (
        <Link to="/app/wellness"
          className="flex items-center gap-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200
                     dark:border-amber-500/20 rounded-2xl px-4 py-3.5 mb-6
                     active:scale-[0.98] transition-transform">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
            <IconWellness size={18} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-ui text-sm font-semibold text-near-black dark:text-gray-100">Today's check-in</p>
            <p className="font-ui text-xs text-amber-700 dark:text-amber-400/80 truncate">{wellnessForm.title}</p>
          </div>
          <IconChevronRight size={16} className="text-amber-400 shrink-0" />
        </Link>
      )}

      {/* Stat snapshots */}
      <StatsSnapshots />

      {/* Feed */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500">
            Latest
          </span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <span className="w-5 h-5 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
          </div>
        )}

        {!loading && items.length === 0 && <EmptyFeed />}

        {!loading && items.length > 0 && (
          <div className="space-y-3">
            {items.map(item => <FeedItemCard key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  )
}
