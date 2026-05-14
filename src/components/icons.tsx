// Custom SVG icon components — stroke-based, Apple HIG proportions
// All icons: 24x24 viewBox, strokeWidth 1.75, strokeLinecap/join round

interface IconProps {
  className?: string
  size?: number
  strokeWidth?: number
}

const base = (strokeWidth = 1.75) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

// ── Player nav ────────────────────────────────────────────────────────────────

export function IconFeed({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

export function IconStats({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

export function IconFilm({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  )
}

export function IconWellness({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

export function IconPlaybook({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )
}

// ── Admin nav ─────────────────────────────────────────────────────────────────

export function IconDashboard({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

export function IconRoster({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

export function IconWellnessAdmin({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  )
}

// ── General UI ────────────────────────────────────────────────────────────────

export function IconChevronRight({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function IconChevronDown({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function IconPlus({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconUpload({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  )
}

export function IconTrash({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

export function IconEdit({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function IconEye({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function IconSearch({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function IconBell({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

export function IconSun({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

export function IconMoon({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}

export function IconUser({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function IconLogOut({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function IconFolder({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  )
}

export function IconFile({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  )
}

export function IconCheck({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function IconX({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function IconTrendUp({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

export function IconTrendDown({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  )
}

export function IconExternalLink({ className, size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(strokeWidth)} width={size} height={size} className={className}>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
