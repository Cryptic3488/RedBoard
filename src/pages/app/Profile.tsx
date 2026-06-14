import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { IconLogOut, IconSun, IconMoon, IconCheck, IconTrash, IconX } from '../../components/icons'

type Position  = 'Guard' | 'Forward' | 'Center'
type ClassYear = 'Fr' | 'So' | 'Jr' | 'Sr'

const CROP_PX = 280

// ── Segmented control ───────────────────────────────────────────────────────────
function Segmented<T extends string>({
  options, value, onChange,
}: { options: { label: string; value: T }[]; value: T | ''; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 text-xs font-semibold font-ui transition-colors
            ${value === opt.value
              ? 'bg-brand text-white'
              : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Toggle ──────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors shrink-0
        ${checked ? 'bg-brand' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm
                        transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

// ── Crop modal ──────────────────────────────────────────────────────────────────
function CropModal({
  src,
  onConfirm,
  onCancel,
}: {
  src: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const imgElRef     = useRef<HTMLImageElement | null>(null)
  const drag         = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  const [ready,     setReady]     = useState(false)
  const [natural,   setNatural]   = useState({ w: 0, h: 0 })
  const [baseScale, setBaseScale] = useState(1)
  const [zoom,      setZoom]      = useState(1)
  const [offset,    setOffset]    = useState({ x: 0, y: 0 })

  // Mutable ref so one-time touch handlers always read fresh values
  const live = useRef({ offset: { x: 0, y: 0 }, natural: { w: 0, h: 0 }, baseScale: 1, zoom: 1 })
  live.current = { offset, natural, baseScale, zoom }

  function ts(bs = baseScale, z = zoom) { return bs * z }

  function clamp(ox: number, oy: number, scale: number) {
    const { natural: nat } = live.current
    return {
      x: Math.min(0, Math.max(CROP_PX - nat.w * scale, ox)),
      y: Math.min(0, Math.max(CROP_PX - nat.h * scale, oy)),
    }
  }

  function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget
    imgElRef.current = img
    const w = img.naturalWidth, h = img.naturalHeight
    const bs = Math.max(CROP_PX / w, CROP_PX / h)
    setNatural({ w, h })
    setBaseScale(bs)
    setOffset({ x: (CROP_PX - w * bs) / 2, y: (CROP_PX - h * bs) / 2 })
    setReady(true)
  }

  // Touch events — registered once with passive:false so preventDefault works
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onStart(e: TouchEvent) {
      const t = e.touches[0]
      drag.current = { sx: t.clientX, sy: t.clientY, ox: live.current.offset.x, oy: live.current.offset.y }
    }
    function onMove(e: TouchEvent) {
      e.preventDefault()
      if (!drag.current) return
      const t   = e.touches[0]
      const cur = live.current
      const s   = cur.baseScale * cur.zoom
      setOffset(prev => {
        void prev
        return {
          x: Math.min(0, Math.max(CROP_PX - cur.natural.w * s, drag.current!.ox + t.clientX - drag.current!.sx)),
          y: Math.min(0, Math.max(CROP_PX - cur.natural.h * s, drag.current!.oy + t.clientY - drag.current!.sy)),
        }
      })
    }
    function onEnd() { drag.current = null }

    el.addEventListener('touchstart', onStart,  { passive: true  })
    el.addEventListener('touchmove',  onMove,   { passive: false })
    el.addEventListener('touchend',   onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove',  onMove)
      el.removeEventListener('touchend',   onEnd)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mouse drag (browser / dev testing)
  function onMouseDown(e: React.MouseEvent) {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y }
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!drag.current) return
    setOffset(clamp(drag.current.ox + e.clientX - drag.current.sx, drag.current.oy + e.clientY - drag.current.sy, ts()))
  }
  function onMouseUp() { drag.current = null }

  function handleZoom(v: number) {
    const newTs = baseScale * v
    const cx = CROP_PX / 2, cy = CROP_PX / 2
    const px = (cx - offset.x) / ts()
    const py = (cy - offset.y) / ts()
    setZoom(v)
    setOffset(clamp(cx - px * newTs, cy - py * newTs, newTs))
  }

  function handleConfirm() {
    const canvas = canvasRef.current
    const img    = imgElRef.current
    if (!canvas || !img || !ready) return
    const OUT = 600
    canvas.width = OUT; canvas.height = OUT
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2)
    ctx.clip()
    const s = ts()
    ctx.drawImage(img, -offset.x / s, -offset.y / s, CROP_PX / s, CROP_PX / s, 0, 0, OUT, OUT)
    canvas.toBlob(b => { if (b) onConfirm(b) }, 'image/jpeg', 0.9)
  }

  const totalScale = ts()
  const R = CROP_PX / 2

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none" style={{ touchAction: 'none' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-safe-top pb-4 shrink-0">
        <button
          onClick={onCancel}
          className="font-ui text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <p className="font-ui text-sm font-semibold text-white">Move and Scale</p>
        <button
          onClick={handleConfirm}
          disabled={!ready}
          className="font-ui text-sm font-semibold text-brand hover:text-brand/80 disabled:opacity-30 transition-colors"
        >
          Choose
        </button>
      </div>

      {/* Crop viewport */}
      <div className="flex-1 flex items-center justify-center">
        <div
          ref={containerRef}
          style={{ width: CROP_PX, height: CROP_PX, position: 'relative', cursor: 'grab' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* Image clipped to circle */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', background: '#1a1a1a' }}>
            {ready && (
              <div
                style={{
                  position: 'absolute',
                  width:  natural.w * totalScale,
                  height: natural.h * totalScale,
                  left: offset.x,
                  top:  offset.y,
                  backgroundImage: `url(${src})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  pointerEvents: 'none',
                }}
              />
            )}
            {!ready && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Dim overlay with circular cutout */}
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            width={CROP_PX} height={CROP_PX}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <mask id="crop-hole">
                <rect width={CROP_PX} height={CROP_PX} fill="white" />
                <circle cx={R} cy={R} r={R - 1} fill="black" />
              </mask>
            </defs>
            <rect width={CROP_PX} height={CROP_PX} fill="rgba(0,0,0,0.55)" mask="url(#crop-hole)" />
            <circle cx={R} cy={R} r={R - 1} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
          </svg>

          {/* Hidden img used for canvas drawImage */}
          <img src={src} alt="" onLoad={handleImgLoad} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Zoom slider */}
      <div className="px-10 shrink-0 space-y-2"
           style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2.5rem)' }}>
        <input
          type="range" min={1} max={3} step={0.01} value={zoom}
          onChange={e => handleZoom(parseFloat(e.target.value))}
          className="w-full accent-brand"
          style={{ height: '4px' }}
        />
        <p className="font-ui text-[11px] text-white/30 text-center">
          Drag to reposition · Slide to zoom
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

// ── Player profile ──────────────────────────────────────────────────────────────
export default function PlayerProfile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { dim, setDim } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropSrcRef   = useRef<string | null>(null)

  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null)
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>('')
  const [position,      setPosition]      = useState<Position | ''>('')
  const [classYear,     setClassYear]     = useState<ClassYear | ''>('')
  const [uploading,     setUploading]     = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [dirty,         setDirty]         = useState(false)
  const [saveOk,        setSaveOk]        = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [deleteError,   setDeleteError]   = useState<string | null>(null)
  const [cropSrc,       setCropSrc]       = useState<string | null>(null)
  const [uploadError,   setUploadError]   = useState<string | null>(null)

  const initialRef = useRef({ jerseyNumber: '' as number | '', position: '' as Position | '', classYear: '' as ClassYear | '' })

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('avatar_url, jersey_number, position, class_year')
      .eq('id', user.id).single()
      .then(({ data }) => {
        if (!data) return
        const d = data as { avatar_url: string | null; jersey_number: number | null; position: Position | null; class_year: ClassYear | null }
        const jn = d.jersey_number ?? ''; const pos = d.position ?? ''; const cy = d.class_year ?? ''
        setAvatarUrl(d.avatar_url); setJerseyNumber(jn); setPosition(pos); setClassYear(cy)
        initialRef.current = { jerseyNumber: jn, position: pos, classYear: cy }
      })
  }, [user])

  useEffect(() => {
    setDirty(jerseyNumber !== initialRef.current.jerseyNumber || position !== initialRef.current.position || classYear !== initialRef.current.classYear)
  }, [jerseyNumber, position, classYear])

  // File selected — open crop modal instead of uploading directly
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (cropSrcRef.current) URL.revokeObjectURL(cropSrcRef.current)
    const url = URL.createObjectURL(file)
    cropSrcRef.current = url
    setCropSrc(url)
    e.target.value = ''
  }

  // Crop confirmed — upload the canvas blob
  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null)
    if (!user) return
    setUploading(true)
    setUploadError(null)
    const path = `${user.id}/avatar.jpg`
    const { error: storageErr } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
    if (storageErr) {
      setUploadError('Upload failed — please try again.')
    } else {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const bustedUrl = `${publicUrl}?t=${Date.now()}`
      setAvatarUrl(bustedUrl)
      await (supabase as any).from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    }
    setUploading(false)
    if (cropSrcRef.current) { URL.revokeObjectURL(cropSrcRef.current); cropSrcRef.current = null }
  }

  const handleCropCancel = () => {
    setCropSrc(null)
    if (cropSrcRef.current) { URL.revokeObjectURL(cropSrcRef.current); cropSrcRef.current = null }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await (supabase as any).from('profiles').update({
      jersey_number: jerseyNumber !== '' ? jerseyNumber : null,
      position: position || null,
      class_year: classYear || null,
    }).eq('id', user.id)
    initialRef.current = { jerseyNumber, position, classYear }
    setSaving(false); setDirty(false); setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2000)
  }

  const handleSignOut = async () => { await signOut(); navigate('/login', { replace: true }) }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-self`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Deletion failed')
      await signOut()
      navigate('/login', { replace: true })
    } catch (err: any) {
      setDeleteError(err.message ?? 'Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  const name    = profile?.name ?? ''
  const initial = name.charAt(0).toUpperCase()

  return (
    <>
      {cropSrc && (
        <CropModal src={cropSrc} onConfirm={handleCropConfirm} onCancel={handleCropCancel} />
      )}

      <div className="px-4 pt-8 pb-10 max-w-lg mx-auto">

        {/* Avatar hero */}
        <div className="flex flex-col items-center mb-8">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="relative group mb-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile"
                   className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-900
                              shadow-lg group-hover:ring-brand/40 transition-all" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand flex items-center justify-center
                              ring-4 ring-white dark:ring-gray-900 shadow-lg group-hover:ring-brand/40 transition-all">
                <span className="font-display text-4xl font-black text-white">{initial}</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-all
                            flex items-center justify-center">
              {uploading && <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            </div>
          </button>
          <p className="font-display text-2xl font-black text-near-black dark:text-white">{name}</p>
          <p className="font-ui text-xs text-gray-400 dark:text-gray-500 mt-1">Tap photo to change</p>
          {uploadError && (
            <p className="font-ui text-xs text-red-500 mt-1">{uploadError}</p>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>

        {/* Identity */}
        <div className="mb-5">
          <p className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-3">
            Identity
          </p>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800">
              <div>
                <p className="font-ui text-xs text-gray-400 dark:text-gray-500 mb-0.5">Name</p>
                <p className="font-ui text-sm font-semibold text-near-black dark:text-gray-100">{name}</p>
              </div>
              <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/8 flex items-center justify-center" title="Set by admin">
                🔒
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800">
              <p className="font-ui text-sm font-medium text-near-black dark:text-gray-100">Jersey #</p>
              <input
                type="number" min={1} max={99} placeholder="—" value={jerseyNumber}
                onChange={e => setJerseyNumber(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-16 text-right bg-transparent font-ui text-sm font-semibold text-near-black dark:text-gray-100
                           border-b-2 border-gray-200 dark:border-gray-700 focus:outline-none
                           focus:border-brand placeholder-gray-300 dark:placeholder-gray-700 transition-colors"
              />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800">
              <p className="font-ui text-sm font-medium text-near-black dark:text-gray-100 shrink-0 mr-4">Position</p>
              <div className="flex-1 max-w-[190px]">
                <Segmented<Position>
                  options={[{ label: 'G', value: 'Guard' }, { label: 'F', value: 'Forward' }, { label: 'C', value: 'Center' }]}
                  value={position} onChange={setPosition} />
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <p className="font-ui text-sm font-medium text-near-black dark:text-gray-100 shrink-0 mr-4">Year</p>
              <div className="flex-1 max-w-[190px]">
                <Segmented<ClassYear>
                  options={[{ label: 'Fr', value: 'Fr' }, { label: 'So', value: 'So' }, { label: 'Jr', value: 'Jr' }, { label: 'Sr', value: 'Sr' }]}
                  value={classYear} onChange={setClassYear} />
              </div>
            </div>
          </div>

          {dirty && (
            <button onClick={handleSave} disabled={saving}
                    className="mt-3 w-full bg-brand text-white py-3.5 rounded-2xl font-ui text-sm font-semibold
                               hover:bg-brand/90 disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
          {saveOk && !dirty && (
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <IconCheck size={14} className="text-emerald-600" strokeWidth={2.5} />
              <p className="font-ui text-sm font-semibold text-emerald-600">Saved</p>
            </div>
          )}
        </div>

        {/* Appearance */}
        <div className="mb-5">
          <p className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-3">
            Appearance
          </p>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                {dim ? <IconMoon size={18} className="text-gray-400" /> : <IconSun size={18} className="text-gray-400" />}
                <div>
                  <p className="font-ui text-sm font-medium text-near-black dark:text-gray-100">Dim mode</p>
                  <p className="font-ui text-xs text-gray-400 dark:text-gray-500">Easier on the eyes at night</p>
                </div>
              </div>
              <Toggle checked={dim} onChange={setDim} />
            </div>
          </div>
        </div>

        {/* Account */}
        <div>
          <p className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-3">
            Account
          </p>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm overflow-hidden">
            <button onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left group hover:bg-red-50 dark:hover:bg-red-500/5
                               border-b border-gray-50 dark:border-gray-800 transition-colors">
              <IconLogOut size={18} className="text-red-500 shrink-0" />
              <span className="font-ui text-sm font-medium text-red-500">Sign out</span>
            </button>

            {!deleteConfirm ? (
              <button onClick={() => { setDeleteConfirm(true); setDeleteError(null) }}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left group
                                 hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors">
                <IconTrash size={18} className="text-red-400 shrink-0" />
                <span className="font-ui text-sm font-medium text-red-400">Delete account</span>
              </button>
            ) : (
              <div className="px-5 py-4">
                <p className="font-ui text-sm font-semibold text-near-black dark:text-gray-100 mb-1">
                  Delete your account?
                </p>
                <p className="font-ui text-xs text-gray-400 dark:text-gray-500 mb-3">
                  Your profile, stats, wellness history, and all personal data will be permanently removed. This cannot be undone.
                </p>
                {deleteError && (
                  <p className="font-ui text-xs text-red-500 mb-3">{deleteError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-ui text-sm font-semibold
                               hover:bg-red-600 disabled:opacity-50 active:scale-[0.98] transition-all"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => { setDeleteConfirm(false); setDeleteError(null) }}
                    disabled={deleting}
                    className="flex items-center justify-center w-10 rounded-xl bg-gray-100 dark:bg-white/8
                               hover:bg-gray-200 dark:hover:bg-white/12 transition-colors disabled:opacity-50"
                  >
                    <IconX size={16} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
