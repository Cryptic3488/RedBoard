import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ConfirmModal } from '../../components/ConfirmModal'
import type { Profile } from '../../types/database'
import { IconPlus, IconEdit, IconTrash, IconRoster } from '../../components/icons'

// ── Types ──────────────────────────────────────────────────────────────────────

type Position  = 'Guard' | 'Forward' | 'Center'
type ClassYear = 'Fr' | 'So' | 'Jr' | 'Sr'
type Role      = 'player' | 'admin'

interface EditForm {
  name:          string
  jersey_number: number | ''
  position:      Position | ''
  class_year:    ClassYear | ''
  role:          Role
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Pill({ children, color }: { children: React.ReactNode; color: 'gray' | 'brand' | 'gold' }) {
  const cls = {
    gray:  'bg-gray-100 dark:bg-[#3A3A3C] text-gray-500 dark:text-gray-400',
    brand: 'bg-brand/10 text-brand',
    gold:  'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  }[color]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  )
}

function Avatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl: string | null; size?: 'sm' | 'md' }) {
  const initial = (name || '?').charAt(0).toUpperCase()
  const dim = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${dim} rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600 flex-shrink-0`}
      />
    )
  }
  return (
    <div className={`${dim} rounded-full bg-brand flex items-center justify-center
                     ring-2 ring-gray-200 dark:ring-gray-600 flex-shrink-0`}>
      <span className="font-display font-bold text-white leading-none">{initial}</span>
    </div>
  )
}

// ── Add Player Form ────────────────────────────────────────────────────────────

function AddPlayerForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim())           { setError('Name is required.'); return }
    if (!email.trim())          { setError('Email is required.'); return }
    if (password.length < 8)   { setError('Password must be at least 8 characters.'); return }

    setSaving(true)
    setError(null)

    const { data, error: fnError } = await supabase.functions.invoke('create-player', {
      body: { name: name.trim(), email: email.trim().toLowerCase(), password },
    })

    if (fnError || data?.error) {
      setError(data?.error ?? fnError?.message ?? 'Failed to create player. Make sure the Edge Function is deployed.')
      setSaving(false)
      return
    }

    onSuccess()
  }

  return (
    <div className="bg-white/80 dark:bg-[#2C2C2E] border border-gray-200 rounded-2xl p-5 mb-6">
      <h2 className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-4">
        Add Player
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block font-ui text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              maxLength={80}
              className="w-full bg-gray-50 dark:bg-[#3A3A3C] border border-gray-200 dark:border-gray-600 rounded-lg
                         px-3 py-2 text-sm text-near-black dark:text-gray-100 placeholder-gray-400
                         focus:outline-none focus:border-brand"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-ui text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="player@denison.edu"
              className="w-full bg-gray-50 dark:bg-[#3A3A3C] border border-gray-200 dark:border-gray-600 rounded-lg
                         px-3 py-2 text-sm text-near-black dark:text-gray-100 placeholder-gray-400
                         focus:outline-none focus:border-brand"
            />
          </div>

          {/* Temp password */}
          <div>
            <label className="block font-ui text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1.5">
              Temporary Password
            </label>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="off"
              className="w-full bg-gray-50 dark:bg-[#3A3A3C] border border-gray-200 dark:border-gray-600 rounded-lg
                         px-3 py-2 text-sm text-near-black dark:text-gray-100 placeholder-gray-400
                         focus:outline-none focus:border-brand"
            />
            <p className="font-ui text-[11px] text-gray-400 mt-1">
              Share this with the player — they can change it from their Profile page.
            </p>
          </div>
        </div>

        {error && (
          <p className="font-ui text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium font-ui border border-gray-200 dark:border-gray-600
                       text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5
                       disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-brand text-white py-2.5 rounded-xl font-ui text-sm font-semibold
                       disabled:opacity-50 hover:bg-brand/90 transition-colors
                       flex items-center justify-center gap-2"
          >
            {saving && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {saving ? 'Creating…' : 'Create Player'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Edit Player Modal ──────────────────────────────────────────────────────────

function EditPlayerModal({
  player,
  onSave,
  onCancel,
}: {
  player: Profile
  onSave: (updated: Partial<Profile>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<EditForm>({
    name:          player.name,
    jersey_number: player.jersey_number ?? '',
    position:      player.position ?? '',
    class_year:    player.class_year ?? '',
    role:          player.role as Role,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError(null)
    await onSave({
      name:          form.name.trim(),
      jersey_number: form.jersey_number !== '' ? Number(form.jersey_number) : null,
      position:      form.position || null,
      class_year:    form.class_year || null,
      role:          form.role,
    })
    setSaving(false)
  }

  function field(label: string, children: React.ReactNode) {
    return (
      <div>
        <label className="block font-ui text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1.5">
          {label}
        </label>
        {children}
      </div>
    )
  }

  const inputCls = 'w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-near-black dark:text-gray-100 focus:outline-none focus:border-brand transition-colors'

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-ui font-semibold text-near-black dark:text-gray-100 text-base mb-5">
          Edit Player
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          {field('Full Name',
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              maxLength={80}
              className={inputCls}
            />
          )}

          {field('Jersey #',
            <input
              type="number"
              value={form.jersey_number}
              onChange={e => setForm(f => ({ ...f, jersey_number: e.target.value === '' ? '' : Number(e.target.value) }))}
              min={1}
              max={99}
              placeholder="—"
              className={inputCls}
            />
          )}

          {field('Position',
            <select
              value={form.position}
              onChange={e => setForm(f => ({ ...f, position: e.target.value as Position | '' }))}
              className={inputCls}
            >
              <option value="">— Not set —</option>
              <option value="Guard">Guard</option>
              <option value="Forward">Forward</option>
              <option value="Center">Center</option>
            </select>
          )}

          {field('Class Year',
            <select
              value={form.class_year}
              onChange={e => setForm(f => ({ ...f, class_year: e.target.value as ClassYear | '' }))}
              className={inputCls}
            >
              <option value="">— Not set —</option>
              <option value="Fr">Freshman</option>
              <option value="So">Sophomore</option>
              <option value="Jr">Junior</option>
              <option value="Sr">Senior</option>
            </select>
          )}

          {field('Role',
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
              className={inputCls}
            >
              <option value="player">Player</option>
              <option value="admin">Admin (coaching staff)</option>
            </select>
          )}

          {error && (
            <p className="font-ui text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium font-ui border border-gray-200 dark:border-gray-600
                         text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5
                         disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brand text-white py-2.5 rounded-xl font-ui text-sm font-semibold
                         disabled:opacity-50 hover:bg-brand/90 transition-colors
                         flex items-center justify-center gap-2"
            >
              {saving && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminRoster() {
  const [players,       setPlayers]       = useState<Profile[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showAddForm,   setShowAddForm]   = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Profile | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [deleteError,   setDeleteError]   = useState<string | null>(null)
  const [editError,     setEditError]     = useState<string | null>(null)
  const [banner,        setBanner]        = useState<string | null>(null)

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('name')
    setPlayers((data ?? []) as Profile[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPlayers() }, [fetchPlayers])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAddSuccess() {
    setShowAddForm(false)
    setBanner('Player created successfully.')
    fetchPlayers()
    setTimeout(() => setBanner(null), 4000)
  }

  async function handleEditSave(updated: Partial<Profile>) {
    if (!editingPlayer) return
    const { error } = await (supabase as any)
      .from('profiles')
      .update(updated)
      .eq('id', editingPlayer.id)
    if (error) {
      setEditError(error.message)
      return
    }
    setEditingPlayer(null)
    setEditError(null)
    fetchPlayers()
  }

  async function handleDeleteConfirm() {
    if (!confirmDelete) return
    setDeleting(true)
    setDeleteError(null)

    const { data, error: fnError } = await supabase.functions.invoke('delete-player', {
      body: { playerId: confirmDelete.id },
    })

    if (fnError || data?.error) {
      setDeleteError(data?.error ?? fnError?.message ?? 'Failed to remove player.')
      setDeleting(false)
      return
    }

    setConfirmDelete(null)
    setDeleting(false)
    fetchPlayers()
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const playerCount = players.filter(p => p.role === 'player').length
  const adminCount  = players.filter(p => p.role === 'admin').length

  return (
    <div className="max-w-3xl space-y-5 pb-12">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-near-black dark:text-white">Roster</h1>
          {!loading && (
            <p className="font-ui text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              {playerCount} player{playerCount !== 1 ? 's' : ''}
              {adminCount > 0 ? ` · ${adminCount} staff` : ''}
            </p>
          )}
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-xl
                       font-ui text-sm font-semibold hover:bg-brand/90 transition-colors shadow-sm"
          >
            <IconPlus size={16} strokeWidth={2.5} />
            Add Player
          </button>
        )}
      </div>

      {/* Success banner */}
      {banner && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20
                        rounded-xl px-4 py-3 font-ui text-sm text-emerald-700 dark:text-emerald-400">
          {banner}
        </div>
      )}

      {showAddForm && (
        <AddPlayerForm onSuccess={handleAddSuccess} onCancel={() => setShowAddForm(false)} />
      )}

      {deleteError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20
                        rounded-xl px-4 py-3 font-ui text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
          {deleteError}
          <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-600 ml-3">×</button>
        </div>
      )}

      {/* Player list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center
                        border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center mb-3">
            <IconRoster size={22} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="font-ui font-semibold text-near-black dark:text-gray-100">No players yet</p>
          <p className="font-ui text-sm text-gray-400 mt-1">Click "Add Player" to create the first account.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm overflow-hidden">
          {players.map((player, i) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-4 py-3.5
                ${i < players.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}
            >
              <Avatar name={player.name} avatarUrl={player.avatar_url} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-ui font-semibold text-sm text-near-black dark:text-gray-100 truncate">
                    {player.name || <span className="text-gray-400 italic">No name set</span>}
                  </p>
                  {player.role === 'admin' && <Pill color="brand">Staff</Pill>}
                  {player.jersey_number !== null && <Pill color="gray">#{player.jersey_number}</Pill>}
                  {player.position && <Pill color="gray">{player.position.charAt(0)}</Pill>}
                  {player.class_year && <Pill color="gray">{player.class_year}</Pill>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setEditingPlayer(player); setEditError(null) }}
                  className="p-2 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/8 transition-colors"
                  title="Edit"
                >
                  <IconEdit size={15} strokeWidth={2} />
                </button>
                <button
                  onClick={() => { setConfirmDelete(player); setDeleteError(null) }}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Remove"
                >
                  <IconTrash size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingPlayer && (
        <EditPlayerModal
          player={editingPlayer}
          onSave={handleEditSave}
          onCancel={() => { setEditingPlayer(null); setEditError(null) }}
        />
      )}
      {editError && (
        <p className="font-ui text-sm text-red-600 text-center">{editError}</p>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <ConfirmModal
          title="Remove Player"
          message={`Remove ${confirmDelete.name || 'this player'} from RedBoard? Their account, stats, wellness history, and film access will all be permanently deleted.`}
          confirmLabel="Remove"
          destructive
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setConfirmDelete(null); setDeleteError(null) }}
        />
      )}
    </div>
  )
}
