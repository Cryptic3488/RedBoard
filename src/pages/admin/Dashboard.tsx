import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { greeting } from '../../lib/greeting'
import {
  IconRoster, IconFilm, IconStats, IconWellnessAdmin,
  IconPlaybook, IconChevronRight,
} from '../../components/icons'

interface QuickAction {
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  label: string
  description: string
  to: string
  accent: string
  iconBg: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    Icon: IconRoster,
    label: 'Roster',
    description: 'Add players, set positions and class years.',
    to: '/admin/roster',
    accent: 'border-l-violet-500',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    Icon: IconFilm,
    label: 'Share Film',
    description: 'Send a Hudl clip with notes to team or individuals.',
    to: '/admin/film',
    accent: 'border-l-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    Icon: IconStats,
    label: 'Manage Stats',
    description: 'Upload a dataset and publish for players.',
    to: '/admin/stats',
    accent: 'border-l-brand',
    iconBg: 'bg-brand/8 dark:bg-brand/15 text-brand',
  },
  {
    Icon: IconWellnessAdmin,
    label: 'Wellness',
    description: 'Create a daily check-in and review responses.',
    to: '/admin/wellness',
    accent: 'border-l-emerald-500',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    Icon: IconPlaybook,
    label: 'Playbook',
    description: 'Upload and organize playbook PDFs by folder.',
    to: '/admin/playbook',
    accent: 'border-l-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
]

interface StatusCounts {
  players: number | null
  filmPosts: number | null
  statUploads: number | null
  openWellness: number | null
  playbookItems: number | null
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const firstName = profile?.name?.split(' ')[0] ?? 'Coach'

  const [counts, setCounts] = useState<StatusCounts>({
    players: null, filmPosts: null, statUploads: null,
    openWellness: null, playbookItems: null,
  })

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'player'),
      supabase.from('film_posts').select('id', { count: 'exact', head: true }),
      supabase.from('stat_uploads').select('id', { count: 'exact', head: true }),
      supabase.from('wellness_forms').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('playbook_files').select('id', { count: 'exact', head: true }),
    ]).then(([roster, film, stats, wellness, playbook]) => {
      setCounts({
        players:      roster.count ?? 0,
        filmPosts:    film.count ?? 0,
        statUploads:  stats.count ?? 0,
        openWellness: wellness.count ?? 0,
        playbookItems: playbook.count ?? 0,
      })
    })
  }, [])

  const kpis = [
    { label: 'Players',    value: counts.players,       to: '/admin/roster' },
    { label: 'Film Posts', value: counts.filmPosts,      to: '/admin/film' },
    { label: 'Stat Sets',  value: counts.statUploads,    to: '/admin/stats' },
    { label: 'Wellness',   value: counts.openWellness,   to: '/admin/wellness' },
    { label: 'Plays',      value: counts.playbookItems,  to: '/admin/playbook' },
  ]

  return (
    <div className="max-w-3xl">

      {/* Header */}
      <div className="mb-4">
        <p className="font-ui text-xs tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-0.5">
          {greeting()}
        </p>
        <h1 className="font-display text-4xl font-black text-near-black dark:text-white leading-none">
          {firstName}.
        </h1>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-5 gap-2 mb-4 p-3 bg-white dark:bg-[#1C1C1E]
                      rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm">
        {kpis.map(({ label, value, to }) => (
          <Link key={label} to={to} className="text-center group">
            <p className="font-display text-2xl font-black text-near-black dark:text-white
                          group-hover:text-brand transition-colors leading-none">
              {value === null
                ? <span className="text-gray-200 dark:text-gray-700 text-xl">—</span>
                : value}
            </p>
            <p className="font-ui text-[10px] text-gray-400 uppercase tracking-wider mt-0.5 leading-tight">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-2">
          Quick Actions
        </p>
        <div className="space-y-1.5">
          {QUICK_ACTIONS.map(({ Icon, label, description, to, accent, iconBg }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 bg-white dark:bg-[#1C1C1E] rounded-xl px-4 py-2.5
                          border border-gray-100 dark:border-gray-800/60 border-l-2 ${accent}
                          hover:border-gray-200 dark:hover:border-gray-700 shadow-sm
                          active:scale-[0.99] transition-all group`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon size={16} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-ui text-sm font-semibold text-near-black dark:text-gray-100
                               group-hover:text-brand transition-colors">{label}</p>
                <p className="font-ui text-xs text-gray-400 dark:text-gray-500 truncate">{description}</p>
              </div>
              <IconChevronRight size={16} strokeWidth={2} className="text-gray-300 dark:text-gray-700 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
