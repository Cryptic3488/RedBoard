import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useWellnessCheck } from '../../hooks/useWellnessCheck'
import { usePlayerStats, type EnrichedWeek, type EnrichedGame } from '../../hooks/usePlayerStats'
import { useFeedItems, type FeedItem } from '../../hooks/useFeedItems'
import { STAT_LABELS, type StandardStatKey } from '../../lib/statParser'
import { greeting } from '../../lib/greeting'
import { FilmCard } from '../../components/FilmCard'

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-white/80 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4">
        <span className="text-2xl">📋</span>
      </div>
      <h3 className="font-display text-lg font-semibold text-near-black dark:text-gray-100 mb-2">Nothing here yet</h3>
      <p className="font-ui text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
        Your coaches will share film clips, stats, wellness check-ins, and playbook updates here.
      </p>
    </div>
  )
}

// ── Stat snapshot widget ───────────────────────────────────────────────────────

const HERO_STATS: StandardStatKey[] = ['points', 'total_reb', 'assists', 'steals']

function trendEl(delta: number | null): React.ReactNode {
  if (delta === null) return <span className="text-gray-300 dark:text-gray-600">—</span>
  if (delta > 0.05)   return <span className="text-brand">↑ +{delta.toFixed(1)}</span>
  if (delta < -0.05)  return <span className="text-gray-400 dark:text-gray-500">↓ {delta.toFixed(1)}</span>
  return                     <span className="text-gray-300 dark:text-gray-600">—</span>
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
          <p className="font-ui text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-0.5">
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
          <span className="font-ui text-xs text-gray-500 dark:text-gray-400 truncate">{latest.label}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide flex-shrink-0
                           bg-gray-100 dark:bg-[#3A3A3C] text-gray-500 dark:text-gray-400">
            Practice
          </span>
        </div>
        <span className="font-ui text-[11px] text-brand flex-shrink-0 ml-2">See stats →</span>
      </div>
      <StatRow stats={latest.stats} deltas={deltas} />
      {prev && (
        <p className="font-ui text-[9px] text-gray-300 dark:text-gray-600 text-right mt-2">vs last week</p>
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
          <span className="font-ui text-xs text-gray-500 dark:text-gray-400 truncate">{game.label}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide flex-shrink-0
                           bg-brand/10 text-brand">
            Game
          </span>
        </div>
        <span className="font-ui text-[11px] text-brand flex-shrink-0 ml-2">See stats →</span>
      </div>
      <StatRow stats={game.stats} deltas={deltas} />
      <p className="font-ui text-[9px] text-gray-300 dark:text-gray-600 text-right mt-2">vs career avg</p>
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

// ── Unified feed cards ─────────────────────────────────────────────────────────

function StatFeedCard({ label, session_type }: { label: string; session_type: string }) {
  return (
    <Link
      to="/app/stats"
      className="flex items-center gap-3 bg-white/80 dark:bg-[#2C2C2E] border border-gray-200 border-l-2 border-l-brand
                 rounded-xl px-4 py-3.5 hover:border-gray-300 hover:border-l-brand-light transition-all"
    >
      <span className="text-xl flex-shrink-0">📊</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-ui text-sm font-semibold text-near-black dark:text-gray-100 truncate">{label}</p>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide flex-shrink-0
            ${session_type === 'game'
              ? 'bg-brand/10 text-brand'
              : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-500 dark:text-gray-400'}`}>
            {session_type === 'game' ? 'Game' : 'Practice'}
          </span>
        </div>
        <p className="font-ui text-xs text-gray-400 dark:text-gray-500 mt-0.5">Stats posted</p>
      </div>
      <span className="font-ui text-[11px] text-brand flex-shrink-0">See stats →</span>
    </Link>
  )
}

function PlaybookFeedCard({ folderName, fileCount }: { folderName: string; fileCount: number }) {
  return (
    <Link
      to="/app/playbook"
      className="flex items-center gap-3 bg-white/80 dark:bg-[#2C2C2E] border border-gray-200 border-l-2 border-l-brand
                 rounded-xl px-4 py-3.5 hover:border-gray-300 hover:border-l-brand-light transition-all"
    >
      <span className="text-xl flex-shrink-0">📖</span>
      <div className="flex-1 min-w-0">
        <p className="font-ui text-sm font-semibold text-near-black dark:text-gray-100">Playbook updated</p>
        <p className="font-ui text-xs text-gray-400 dark:text-gray-500 truncate">
          {fileCount} {fileCount === 1 ? 'play' : 'plays'} in {folderName}
        </p>
      </div>
      <span className="font-ui text-[11px] text-brand flex-shrink-0">Browse →</span>
    </Link>
  )
}

function FeedItemCard({ item }: { item: FeedItem }) {
  if (item.type === 'film') {
    return (
      <FilmCard
        post={item.payload}
        isPersonal={item.payload.visibility === 'individual'}
      />
    )
  }
  if (item.type === 'stats') {
    return (
      <StatFeedCard
        label={item.payload.label}
        session_type={item.payload.session_type}
      />
    )
  }
  return (
    <PlaybookFeedCard
      folderName={item.payload.folderName}
      fileCount={item.payload.fileCount}
    />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Feed() {
  const { profile } = useAuth()
  const firstName = profile?.name?.split(' ')[0] ?? 'there'
  const { items, loading } = useFeedItems()
  const { form: wellnessForm, todayResponse, loading: wellnessLoading } = useWellnessCheck()

  return (
    <div className="px-4 pt-8 pb-6 max-w-lg mx-auto">

      {/* Editorial greeting */}
      <div className="mb-8">
        <p className="font-ui text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-2">
          {greeting()}
        </p>
        <h1 className="font-display text-5xl font-bold text-near-black dark:text-gray-100 leading-none">
          {firstName}.
        </h1>
        <p className="font-display text-xl italic text-brand mt-1">
          Ready to work.
        </p>
      </div>

      {/* Wellness nudge — only when there's an active form not yet submitted today */}
      {!wellnessLoading && wellnessForm && !todayResponse && (
        <Link
          to="/app/wellness"
          className="flex items-center gap-3 bg-white/80 dark:bg-[#2C2C2E] border border-gold/50 border-l-2 border-l-gold
                     rounded-xl px-4 py-3 mb-6 hover:border-gold transition-colors"
        >
          <span className="text-xl flex-shrink-0">💪</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-near-black dark:text-gray-100">Today's check-in</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{wellnessForm.title}</p>
          </div>
          <span className="text-gold text-sm flex-shrink-0">→</span>
        </Link>
      )}

      {/* Stat snapshot — most recent practice week + latest game */}
      <StatsSnapshots />

      {/* Unified chronological feed */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500">
            Latest
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <span className="w-5 h-5 border-2 border-gray-300 border-t-brand rounded-full animate-spin" />
          </div>
        )}

        {!loading && items.length === 0 && <EmptyFeed />}

        {!loading && items.length > 0 && (
          <div className="space-y-4">
            {items.map(item => (
              <FeedItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
