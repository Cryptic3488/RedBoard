import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { usePlayerStats, type EnrichedWeek } from '../../hooks/usePlayerStats'
import { STAT_LABELS, type StandardStatKey } from '../../lib/statParser'

const HERO_STATS: StandardStatKey[] = ['points', 'total_reb', 'assists', 'steals']
const TREND_STATS: StandardStatKey[] = ['points', 'total_reb', 'assists', 'steals', 'blocks', 'turnovers']

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{title}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

function WeeklyWrapped({ week }: { week: EnrichedWeek }) {
  return (
    <div className="bg-white border-2 border-gold rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gold">This Week</span>
        <span className="text-xs text-gray-400 truncate flex-1">{week.label}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide flex-shrink-0 ${
          week.session_type === 'game' ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-600'
        }`}>
          {week.session_type}
        </span>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-4 gap-2">
        {HERO_STATS.map(stat => (
          <div key={stat} className="text-center">
            <p className="text-2xl font-bold text-near-black font-display">
              {week.stats[stat] !== null ? week.stats[stat]!.toFixed(1) : '—'}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">
              {STAT_LABELS[stat]}
            </p>
            {week.contributions[stat] !== undefined && (
              <p className="text-[9px] text-brand font-semibold mt-0.5">
                {week.contributions[stat]}% of team
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Team avg row */}
      {HERO_STATS.some(s => week.teamAvg[s] !== null) && (
        <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-4 gap-2">
          {HERO_STATS.map(stat => (
            <div key={stat} className="text-center">
              <p className="text-[10px] text-gray-400">
                {week.teamAvg[stat] !== null
                  ? `avg ${week.teamAvg[stat]!.toFixed(1)}`
                  : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface TrendPoint {
  label: string
  [key: string]: string | number | null
}

function StatTrendCard({
  stat, data, goalTarget,
}: {
  stat: StandardStatKey
  data: TrendPoint[]
  goalTarget: number | null
}) {
  const latest = data.at(-1)?.[stat]
  const avgKey = `${stat}_avg`

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3">
      <div className="flex justify-between items-baseline mb-1">
        <p className="text-[11px] font-medium text-gray-600">{STAT_LABELS[stat]}</p>
        <p className="text-lg font-bold text-near-black font-display">
          {latest !== null && latest !== undefined ? Number(latest).toFixed(1) : '—'}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={56}>
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey={stat}
            stroke="#E51636"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey={avgKey}
            stroke="#D1D5DB"
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
            connectNulls
          />
          <XAxis dataKey="label" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: '#6B7280', fontSize: 10 }}
          />
        </LineChart>
      </ResponsiveContainer>
      {goalTarget !== null && (
        <p className="text-[10px] text-gray-400 mt-1">
          Goal: <span className="text-brand font-semibold">{goalTarget}</span>
        </p>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Stats() {
  const { weeks, goals, loading, error } = usePlayerStats()

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      </div>
    )
  }

  if (weeks.length === 0) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-near-black font-semibold">No stats yet</p>
        <p className="text-sm text-gray-400 mt-1">Your coach will upload session stats here.</p>
      </div>
    )
  }

  const latest = weeks[0]
  const goalMap = new Map(goals.map(g => [g.stat_key, g.target]))

  // Build chronological trend data (oldest first for charts)
  const trendData: TrendPoint[] = [...weeks].reverse().map(w => {
    const point: TrendPoint = {
      label: w.label.length > 14 ? w.label.slice(0, 14) + '…' : w.label,
    }
    for (const stat of TREND_STATS) {
      point[stat] = w.stats[stat]
      point[`${stat}_avg`] = w.teamAvg[stat]
    }
    return point
  })

  const customKeys = Object.keys(latest.custom)
  const annotatedWeeks = weeks.filter(w => w.annotation)

  return (
    <div className="px-4 py-6 space-y-8 pb-24">

      {/* Zone 1 — Weekly Wrapped */}
      <WeeklyWrapped week={latest} />

      {/* Zone 2 — Trend Charts */}
      {trendData.length > 1 && (
        <section>
          <SectionHeader title="Trends" />
          <div className="grid grid-cols-2 gap-3">
            {TREND_STATS.map(stat => (
              <StatTrendCard
                key={stat}
                stat={stat}
                data={trendData}
                goalTarget={goalMap.get(stat) ?? null}
              />
            ))}
          </div>
        </section>
      )}

      {/* Zone 3 — Custom Metrics */}
      {customKeys.length > 0 && (
        <section>
          <SectionHeader title="Custom Metrics" />
          <div className="grid grid-cols-3 gap-3">
            {customKeys.map(k => {
              const v = latest.custom[k]
              return (
                <div key={k} className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
                  <p className="text-2xl font-bold text-near-black font-display">
                    {v !== null && typeof v === 'number' ? v.toFixed(1) : '—'}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1 truncate">{k}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Zone 4a — Goals */}
      {goals.length > 0 && (
        <section>
          <SectionHeader title="Goals" />
          <div className="space-y-3">
            {goals.map(g => {
              const current = latest.stats[g.stat_key as StandardStatKey] ?? null
              const pct = current !== null ? Math.min((current / g.target) * 100, 100) : 0
              return (
                <div key={g.id} className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-near-black">
                      {STAT_LABELS[g.stat_key as keyof typeof STAT_LABELS] ?? g.stat_key}
                    </span>
                    <span className="text-gray-400 tabular-nums">
                      {current !== null ? current.toFixed(1) : '—'} / {g.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-brand h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Zone 4b — Coach Notes */}
      {annotatedWeeks.length > 0 && (
        <section>
          <SectionHeader title="Coach Notes" />
          <div className="space-y-3">
            {annotatedWeeks.map(w => (
              <div key={w.weekStart} className="bg-white border border-gray-200 border-l-4 border-l-brand rounded-2xl px-4 py-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{w.label}</p>
                <p className="text-sm text-near-black">{w.annotation!.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
