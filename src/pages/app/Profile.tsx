import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useDimMode } from '../../hooks/useDimMode'

// ── Types ──────────────────────────────────────────────────────────────────────

type Position  = 'Guard' | 'Forward' | 'Center'
type ClassYear = 'Fr' | 'So' | 'Jr' | 'Sr'

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="font-ui text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/80 dark:bg-[#2C2C2E] border border-gray-200 rounded-2xl overflow-hidden">
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0">
      {children}
    </div>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T | ''
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 text-xs font-medium font-ui transition-colors
            ${value === opt.value
              ? 'bg-brand text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0
        ${checked ? 'bg-brand' : 'bg-gray-200 dark:bg-gray-600'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
                    transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PlayerProfile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { dim, setDim } = useDimMode()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [avatarUrl, setAvatarUrl]       = useState<string | null>(null)
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>('')
  const [position, setPosition]         = useState<Position | ''>('')
  const [classYear, setClassYear]       = useState<ClassYear | ''>('')
  const [uploading, setUploading]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [dirty, setDirty]               = useState(false)
  const [saveOk, setSaveOk]             = useState(false)

  // Store initial values to detect dirty state
  const initialRef = useRef({ jerseyNumber: '' as number | '', position: '' as Position | '', classYear: '' as ClassYear | '' })

  // Load extended profile fields on mount
  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('avatar_url, jersey_number, position, class_year')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const d = data as {
          avatar_url: string | null
          jersey_number: number | null
          position: Position | null
          class_year: ClassYear | null
        }
        const jn = d.jersey_number ?? ''
        const pos = d.position ?? ''
        const cy = d.class_year ?? ''
        setAvatarUrl(d.avatar_url)
        setJerseyNumber(jn)
        setPosition(pos)
        setClassYear(cy)
        initialRef.current = { jerseyNumber: jn, position: pos, classYear: cy }
      })
  }, [user])

  // Track dirty state
  useEffect(() => {
    setDirty(
      jerseyNumber !== initialRef.current.jerseyNumber ||
      position    !== initialRef.current.position     ||
      classYear   !== initialRef.current.classYear
    )
  }, [jerseyNumber, position, classYear])

  // ── Avatar upload ───────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5 MB'); return }

    setUploading(true)
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/avatar.${ext}`

    const { error: storageErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { contentType: file.type, upsert: true })

    if (!storageErr) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const bustedUrl = `${publicUrl}?t=${Date.now()}`
      setAvatarUrl(bustedUrl)
      await (supabase as any).from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    }
    setUploading(false)
    e.target.value = ''
  }

  // ── Save identity fields ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await (supabase as any).from('profiles').update({
      jersey_number: jerseyNumber !== '' ? jerseyNumber : null,
      position:      position || null,
      class_year:    classYear || null,
    }).eq('id', user.id)
    initialRef.current = { jerseyNumber, position, classYear }
    setSaving(false)
    setDirty(false)
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2000)
  }

  // ── Sign out ────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const name    = profile?.name ?? ''
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="px-4 pt-8 pb-10 max-w-lg mx-auto space-y-6">

      {/* Header */}
      <div className="mb-2">
        <p className="font-ui text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-1">Your</p>
        <h1 className="font-display text-4xl font-bold text-near-black dark:text-gray-100 leading-none">Profile.</h1>
      </div>

      {/* ── Avatar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative group"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-200 dark:ring-gray-600
                         group-hover:ring-brand transition-all"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-brand flex items-center justify-center
                            ring-4 ring-gray-200 dark:ring-gray-600 group-hover:ring-brand transition-all">
              <span className="font-display text-4xl font-bold text-white">{initial}</span>
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20
                          flex items-center justify-center transition-all">
            {uploading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Edit
              </span>
            )}
          </div>
        </button>
        <p className="font-ui text-xs text-gray-400 dark:text-gray-500">Tap to change photo</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      </div>

      {/* ── Identity ───────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Identity</SectionLabel>
        <Card>
          {/* Name — read only */}
          <Row>
            <div className="flex-1 min-w-0">
              <p className="font-ui text-xs text-gray-400 dark:text-gray-500 mb-0.5">Name</p>
              <p className="font-ui text-sm font-medium text-near-black dark:text-gray-100 truncate">{name}</p>
            </div>
            <span className="text-gray-300 dark:text-gray-600 text-sm ml-3" title="Set by admin">🔒</span>
          </Row>

          {/* Jersey number */}
          <Row>
            <p className="font-ui text-sm text-near-black dark:text-gray-100 flex-shrink-0 mr-4">Jersey #</p>
            <input
              type="number"
              min={1}
              max={99}
              placeholder="—"
              value={jerseyNumber}
              onChange={e => setJerseyNumber(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-16 text-right bg-transparent font-ui text-sm text-near-black dark:text-gray-100
                         border-b border-gray-200 dark:border-gray-600 focus:outline-none
                         focus:border-brand placeholder-gray-300"
            />
          </Row>

          {/* Position */}
          <Row>
            <p className="font-ui text-sm text-near-black dark:text-gray-100 flex-shrink-0 mr-4">Position</p>
            <div className="flex-1 max-w-[200px]">
              <Segmented<Position>
                options={[
                  { label: 'G', value: 'Guard' },
                  { label: 'F', value: 'Forward' },
                  { label: 'C', value: 'Center' },
                ]}
                value={position}
                onChange={setPosition}
              />
            </div>
          </Row>

          {/* Class year */}
          <Row>
            <p className="font-ui text-sm text-near-black dark:text-gray-100 flex-shrink-0 mr-4">Year</p>
            <div className="flex-1 max-w-[200px]">
              <Segmented<ClassYear>
                options={[
                  { label: 'Fr', value: 'Fr' },
                  { label: 'So', value: 'So' },
                  { label: 'Jr', value: 'Jr' },
                  { label: 'Sr', value: 'Sr' },
                ]}
                value={classYear}
                onChange={setClassYear}
              />
            </div>
          </Row>
        </Card>

        {/* Save button — only shown when dirty */}
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 w-full bg-brand text-white py-2.5 rounded-xl font-ui text-sm
                       font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
        {saveOk && !dirty && (
          <p className="mt-2 text-center font-ui text-xs text-green-600">Saved ✓</p>
        )}
      </div>

      {/* ── Appearance ─────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Appearance</SectionLabel>
        <Card>
          <Row>
            <div>
              <p className="font-ui text-sm font-medium text-near-black dark:text-gray-100">Dim mode</p>
              <p className="font-ui text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Easier on the eyes at night
              </p>
            </div>
            <Toggle checked={dim} onChange={setDim} />
          </Row>
        </Card>
      </div>

      {/* ── Account ────────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Account</SectionLabel>
        <Card>
          <Row>
            <button
              onClick={handleSignOut}
              className="font-ui text-sm font-medium text-brand hover:text-brand/70 transition-colors"
            >
              Sign out
            </button>
          </Row>
        </Card>
      </div>

    </div>
  )
}
