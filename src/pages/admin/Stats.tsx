import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useStatUploads } from '../../hooks/useStatUploads'
import {
  parseCSV, parseXLSX, matchPlayers, buildStatEntries,
  STANDARD_STAT_KEYS, STAT_LABELS,
  type ParseResult, type PlayerMatch,
} from '../../lib/statParser'
import type { Profile, StatGoal } from '../../types/database'

export default function AdminStats() {
  const { user } = useAuth()
  const { uploads, loading: uploadsLoading, refresh } = useStatUploads()

  // ── Form state ──────────────────────────────────────────────────────────────
  const [label, setLabel] = useState('')
  const [sessionType, setSessionType] = useState<'practice' | 'game'>('practice')
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [matches, setMatches] = useState<PlayerMatch[]>([])
  const [players, setPlayers] = useState<Profile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Annotation modal state ──────────────────────────────────────────────────
  const [annotModal, setAnnotModal] = useState<{ uploadId: string } | null>(null)
  const [annotPlayerId, setAnnotPlayerId] = useState('')
  const [annotNote, setAnnotNote] = useState('')
  const [annotSubmitting, setAnnotSubmitting] = useState(false)
  const [annotError, setAnnotError] = useState<string | null>(null)

  // ── Goals state ─────────────────────────────────────────────────────────────
  const [goals, setGoals] = useState<StatGoal[]>([])
  const [goalPlayerId, setGoalPlayerId] = useState('')
  const [goalStatKey, setGoalStatKey] = useState('points')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalError, setGoalError] = useState<string | null>(null)

  // ── Load players ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'player').order('name')
      .then(({ data }) => { if (data) setPlayers(data as Profile[]) })
  }, [])

  // ── Load goals ──────────────────────────────────────────────────────────────
  const fetchGoals = useCallback(async () => {
    const { data } = await supabase
      .from('stat_goals').select('*').order('created_at', { ascending: false })
    if (data) setGoals(data as StatGoal[])
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  // ── File parse ──────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setParseError(null)
    setParseResult(null)
    setMatches([])
    try {
      const result = f.name.toLowerCase().endsWith('.csv')
        ? await parseCSV(f)
        : await parseXLSX(f)
      setParseResult(result)
      setMatches(matchPlayers(result.rows, players))
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse file')
    }
  }

  // ── Match override ──────────────────────────────────────────────────────────
  const handleMatchOverride = (idx: number, profileId: string) => {
    const profile = players.find(p => p.id === profileId)
    setMatches(prev => prev.map((m, i) => i !== idx ? m : {
      ...m,
      matched: !!profileId,
      profileId,
      profileName: profile?.name ?? '',
    }))
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !parseResult) return
    const matchedCount = matches.filter(m => m.matched).length
    if (!label.trim()) { setFormError('Session label is required'); return }
    if (matchedCount === 0) { setFormError('No players matched. Please check the file and player roster.'); return }
    setSubmitting(true); setFormError(null); setFormSuccess(null)

    const { data: uploadData, error: uploadErr } = await (supabase as any)
      .from('stat_uploads')
      .insert({ created_by: user.id, label: label.trim(), session_type: sessionType, session_date: sessionDate })
      .select('id').single() as { data: { id: string } | null; error: { message: string } | null }

    if (uploadErr || !uploadData) {
      setFormError(uploadErr?.message ?? 'Failed to create upload')
      setSubmitting(false); return
    }

    const entries = buildStatEntries(uploadData.id, parseResult.rows, matches)
    if (entries.length > 0) {
      const { error: entriesErr } = await (supabase as any)
        .from('stat_entries').insert(entries) as { error: { message: string } | null }
      if (entriesErr) { setFormError(entriesErr.message); setSubmitting(false); return }
    }

    setLabel(''); setFile(null); setParseResult(null); setMatches([])
    setSessionDate(new Date().toISOString().slice(0, 10))
    if (fileInputRef.current) fileInputRef.current.value = ''
    setFormSuccess(`Uploaded stats for ${matchedCount} player${matchedCount !== 1 ? 's' : ''}`)
    refresh(); setSubmitting(false)
  }

  // ── Delete upload ───────────────────────────────────────────────────────────
  const handleDeleteUpload = async (id: string) => {
    if (!confirm('Delete this upload and all its stats?')) return
    await supabase.from('stat_uploads').delete().eq('id', id)
    refresh()
  }

  // ── Annotation submit ───────────────────────────────────────────────────────
  const handleAnnotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !annotModal || !annotPlayerId || !annotNote.trim()) return
    setAnnotSubmitting(true); setAnnotError(null)
    const { error } = await (supabase as any)
      .from('stat_annotations')
      .upsert(
        { upload_id: annotModal.uploadId, player_id: annotPlayerId, note: annotNote.trim(), created_by: user.id },
        { onConflict: 'upload_id,player_id' }
      ) as { error: { message: string } | null }
    if (error) { setAnnotError(error.message); setAnnotSubmitting(false); return }
    setAnnotModal(null); setAnnotNote(''); setAnnotPlayerId(''); setAnnotSubmitting(false)
  }

  // ── Goal submit ─────────────────────────────────────────────────────────────
  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !goalPlayerId || !goalTarget) return
    setGoalError(null)
    const { error } = await (supabase as any)
      .from('stat_goals')
      .upsert(
        { player_id: goalPlayerId, stat_key: goalStatKey, target: parseFloat(goalTarget), created_by: user.id },
        { onConflict: 'player_id,stat_key' }
      ) as { error: { message: string } | null }
    if (error) { setGoalError(error.message); return }
    setGoalPlayerId(''); setGoalTarget(''); fetchGoals()
  }

  // ── Delete goal ─────────────────────────────────────────────────────────────
  const handleDeleteGoal = async (id: string) => {
    await supabase.from('stat_goals').delete().eq('id', id)
    fetchGoals()
  }

  const matchedCount = matches.filter(m => m.matched).length
  const playerMap = new Map(players.map(p => [p.id, p.name]))

  return (
    <div className="space-y-8 pb-12">
      <h1 className="text-near-black text-xl font-bold">Stats</h1>

      {/* ── Upload Form ──────────────────────────────────────────────────────── */}
      <section className="bg-white/80 border border-gray-200 rounded-2xl p-6">
        <h2 className="text-near-black font-semibold text-base mb-5">Upload Session Stats</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Session label */}
          <div>
            <label className="block text-xs font-medium tracking-wide uppercase text-gray-600 mb-1.5">
              Session Label
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Pre-season practice 1"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-near-black placeholder-gray-400 focus:outline-none focus:border-brand"
              maxLength={120}
            />
          </div>

          {/* Session type + date */}
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-medium tracking-wide uppercase text-gray-600 mb-1.5">Type</label>
              <div className="flex gap-1 border border-gray-200 rounded-lg p-0.5 w-fit">
                {(['practice', 'game'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSessionType(t)}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                      sessionType === t ? 'bg-brand text-white' : 'text-gray-600 hover:text-near-black'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium tracking-wide uppercase text-gray-600 mb-1.5">Date</label>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-near-black focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* File input */}
          <div>
            <label className="block text-xs font-medium tracking-wide uppercase text-gray-600 mb-1.5">Stat File</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-brand/50 transition-colors">
              <span className="text-2xl mb-2">📊</span>
              <span className="text-sm text-near-black font-medium">
                {file ? file.name : 'Click to choose CSV or XLSX'}
              </span>
              {file && (
                <span className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {parseError && <p className="text-xs text-red-600 mt-1.5">{parseError}</p>}
          </div>

          {/* Parse preview */}
          {parseResult && (
            <div className="border border-gray-200 rounded-xl p-4 space-y-4 bg-gray-50">
              <div>
                <p className="text-xs text-gray-600 mb-2">
                  <span className="font-medium text-near-black">Player column:</span>{' '}
                  {parseResult.detectedPlayerColumn}
                  <span className="mx-2">·</span>
                  <span className="font-medium text-near-black">{parseResult.rows.length}</span> rows found
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {parseResult.recognizedColumns.map(c => (
                    <span key={c} className="px-2 py-0.5 text-xs rounded-full bg-brand/10 text-brand border border-brand/20">
                      {c}
                    </span>
                  ))}
                  {parseResult.customColumns.map(c => (
                    <span key={c} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                      {c} (custom)
                    </span>
                  ))}
                </div>
              </div>

              {/* Player match list */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                  Player Matching — {matchedCount}/{matches.length} matched
                </p>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {matches.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.matched ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className="text-near-black w-32 truncate text-xs">{m.csvName}</span>
                      <span className="text-gray-400 text-xs">→</span>
                      <select
                        value={m.profileId}
                        onChange={e => handleMatchOverride(i, e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-md px-2 py-1 text-xs text-near-black focus:outline-none focus:border-brand"
                      >
                        <option value="">— Skip —</option>
                        {players.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{formError}</p>
          )}
          {formSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">{formSuccess}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !parseResult}
            className="w-full bg-brand text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-brand/90 transition-colors"
          >
            {submitting ? 'Uploading…' : 'Upload Stats'}
          </button>
        </form>
      </section>

      {/* ── Upload History ───────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Published Uploads</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        {uploadsLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : uploads.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No uploads yet</p>
        ) : (
          <div className="space-y-3">
            {uploads.map(upload => (
              <div key={upload.id} className="bg-white/80 border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-near-black truncate">{upload.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {upload.session_date}
                    <span className="mx-1.5">·</span>
                    <span className="capitalize">{upload.session_type}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAnnotModal({ uploadId: upload.id })
                    setAnnotPlayerId('')
                    setAnnotNote('')
                  }}
                  className="text-xs text-brand hover:text-brand/70 font-medium transition-colors"
                >
                  Annotate
                </button>
                <button
                  onClick={() => handleDeleteUpload(upload.id)}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Player Goals ─────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Player Goals</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="bg-white/80 border border-gray-200 rounded-2xl p-5 space-y-5">
          <form onSubmit={handleGoalSubmit} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Player</label>
              <select
                value={goalPlayerId}
                onChange={e => setGoalPlayerId(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-near-black focus:outline-none focus:border-brand"
              >
                <option value="">Select player</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stat</label>
              <select
                value={goalStatKey}
                onChange={e => setGoalStatKey(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-near-black focus:outline-none focus:border-brand"
              >
                {STANDARD_STAT_KEYS.map(k => (
                  <option key={k} value={k}>{STAT_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target</label>
              <input
                type="number"
                value={goalTarget}
                onChange={e => setGoalTarget(e.target.value)}
                placeholder="0"
                step="0.1"
                min="0"
                className="w-24 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-near-black focus:outline-none focus:border-brand"
              />
            </div>
            <button
              type="submit"
              disabled={!goalPlayerId || !goalTarget}
              className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand/90 transition-colors"
            >
              Set Goal
            </button>
          </form>
          {goalError && <p className="text-xs text-red-600">{goalError}</p>}
          {goals.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {goals.map(g => (
                <div key={g.id} className="flex items-center gap-2 text-sm">
                  <span className="text-near-black font-medium w-36 truncate">
                    {playerMap.get(g.player_id) ?? '—'}
                  </span>
                  <span className="text-gray-400 text-xs">·</span>
                  <span className="text-gray-600 text-xs flex-1">
                    {STAT_LABELS[g.stat_key as keyof typeof STAT_LABELS] ?? g.stat_key}
                  </span>
                  <span className="text-brand font-semibold text-sm">{g.target}</span>
                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="text-xs text-gray-400 hover:text-red-600 transition-colors ml-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Annotation Modal ─────────────────────────────────────────────────── */}
      {annotModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-near-black font-semibold mb-4">Add Coaching Annotation</h3>
            <form onSubmit={handleAnnotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Player</label>
                <select
                  value={annotPlayerId}
                  onChange={e => setAnnotPlayerId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-near-black focus:outline-none focus:border-brand"
                >
                  <option value="">Select a player</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Note</label>
                <textarea
                  value={annotNote}
                  onChange={e => setAnnotNote(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Great effort on transition defense this session…"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-near-black placeholder-gray-400 focus:outline-none focus:border-brand resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-0.5">{annotNote.length}/1000</p>
              </div>
              {annotError && <p className="text-xs text-red-600">{annotError}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAnnotModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={annotSubmitting || !annotPlayerId || !annotNote.trim()}
                  className="flex-1 bg-brand text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-brand/90 transition-colors"
                >
                  {annotSubmitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
