import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useWellnessForms } from '../../hooks/useWellnessForms'
import type { Profile, WellnessForm, WellnessQuestion, WellnessResponse } from '../../types/database'

// ── Helpers ───────────────────────────────────────────────────────────────────

function newQuestion(): WellnessQuestion {
  return { id: crypto.randomUUID(), type: 'rating', label: '' }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function answerDisplay(q: WellnessQuestion, val: number | string | undefined): string {
  if (val === undefined || val === '') return '—'
  if (q.type === 'rating') return `${val}/5`
  return String(val)
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminWellness() {
  const { user } = useAuth()
  const { forms, loading: formsLoading, refresh } = useWellnessForms()

  // ── Form builder state ────────────────────────────────────────────────────
  const [mode, setMode] = useState<'list' | 'build'>('list')
  const [editingForm, setEditingForm] = useState<WellnessForm | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [questions, setQuestions] = useState<WellnessQuestion[]>([newQuestion()])
  const [saving, setSaving] = useState(false)
  const [buildError, setBuildError] = useState<string | null>(null)

  // ── Dashboard state ───────────────────────────────────────────────────────
  const [players, setPlayers] = useState<Profile[]>([])
  const [todayResponses, setTodayResponses] = useState<WellnessResponse[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dashLoading, setDashLoading] = useState(false)

  const activeForm = forms.find(f => f.is_active) ?? null
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const todayISO = new Date().toISOString().slice(0, 10)

  // ── Load players + today's responses ─────────────────────────────────────
  const fetchDashboard = useCallback(async (form: WellnessForm) => {
    setDashLoading(true)
    const [{ data: playerData }, { data: respData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'player').order('name'),
      supabase.from('wellness_responses').select('*').eq('form_id', form.id).eq('date', todayISO),
    ])
    if (playerData) setPlayers(playerData as Profile[])
    if (respData) setTodayResponses(respData as WellnessResponse[])
    setDashLoading(false)
  }, [todayISO])

  useEffect(() => {
    if (activeForm) fetchDashboard(activeForm)
  }, [activeForm?.id, fetchDashboard])

  // ── Form builder actions ──────────────────────────────────────────────────
  const handleEdit = (form: WellnessForm) => {
    setEditingForm(form)
    setFormTitle(form.title)
    setQuestions(form.questions.length > 0 ? form.questions : [newQuestion()])
    setBuildError(null)
    setMode('build')
  }

  const handleCancelBuild = () => {
    setMode('list')
    setEditingForm(null)
    setFormTitle('')
    setQuestions([newQuestion()])
    setBuildError(null)
  }

  const addQuestion = () => setQuestions(q => [...q, newQuestion()])

  const removeQuestion = (id: string) =>
    setQuestions(q => q.filter(x => x.id !== id))

  const updateQuestion = (id: string, patch: Partial<WellnessQuestion>) =>
    setQuestions(q => q.map(x => x.id === id ? { ...x, ...patch } : x))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!formTitle.trim()) { setBuildError('Title is required'); return }
    const filled = questions.filter(q => q.label.trim())
    if (filled.length === 0) { setBuildError('Add at least one question'); return }
    setSaving(true); setBuildError(null)

    let saveError: { message: string } | null = null

    if (editingForm) {
      const { error } = (await (supabase as any)
        .from('wellness_forms')
        .update({ title: formTitle.trim(), questions: filled })
        .eq('id', editingForm.id)
      ) as { error: { message: string } | null }
      saveError = error
    } else {
      const { error } = (await (supabase as any)
        .from('wellness_forms')
        .insert({ title: formTitle.trim(), questions: filled, is_active: false, created_by: user.id })
      ) as { error: { message: string } | null }
      saveError = error
    }

    if (saveError) { setBuildError(saveError.message); setSaving(false); return }
    setEditingForm(null); setFormTitle(''); setQuestions([newQuestion()]); setMode('list'); refresh()
    setSaving(false)
  }

  // ── Activate / deactivate form ────────────────────────────────────────────
  const handleSetActive = async (formId: string) => {
    await (supabase as any).from('wellness_forms').update({ is_active: false }).eq('is_active', true)
    await (supabase as any).from('wellness_forms').update({ is_active: true }).eq('id', formId)
    refresh()
  }

  const handleDeactivate = async (formId: string) => {
    await (supabase as any).from('wellness_forms').update({ is_active: false }).eq('id', formId)
    refresh()
  }

  // ── Delete form ───────────────────────────────────────────────────────────
  const handleDelete = async (formId: string) => {
    if (!confirm('Delete this form and all its responses?')) return
    await supabase.from('wellness_forms').delete().eq('id', formId)
    refresh()
  }

  const responseMap = new Map(todayResponses.map(r => [r.player_id, r]))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-near-black text-xl font-bold">Wellness</h1>
        {mode === 'list' && (
          <button
            onClick={() => setMode('build')}
            className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors"
          >
            + New Form
          </button>
        )}
      </div>

      {/* ── Form Builder ────────────────────────────────────────────────── */}
      {mode === 'build' && (
        <section className="bg-white/80 border border-gray-200 rounded-2xl p-6">
          <h2 className="text-near-black font-semibold text-base mb-5">{editingForm ? 'Edit Form' : 'New Form'}</h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-600 mb-1.5">
                Form Title
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Daily Wellness Check"
                maxLength={120}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-near-black placeholder-gray-400 focus:outline-none focus:border-brand"
              />
            </div>

            {/* Questions */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-600 mb-3">
                Questions
              </label>
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex gap-2 items-start">
                    <span className="text-xs text-gray-400 pt-2.5 w-4 flex-shrink-0">{i + 1}</span>
                    <select
                      value={q.type}
                      onChange={e => updateQuestion(q.id, { type: e.target.value as WellnessQuestion['type'] })}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-xs text-near-black focus:outline-none focus:border-brand flex-shrink-0"
                    >
                      <option value="rating">Rating 1–5</option>
                      <option value="yesno">Yes / No</option>
                      <option value="text">Text</option>
                    </select>
                    <input
                      type="text"
                      value={q.label}
                      onChange={e => updateQuestion(q.id, { label: e.target.value })}
                      placeholder="Question label…"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-near-black placeholder-gray-400 focus:outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      disabled={questions.length === 1}
                      className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 pt-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="mt-3 text-sm text-brand hover:text-brand/70 font-medium transition-colors"
              >
                + Add question
              </button>
            </div>

            {buildError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {buildError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelBuild}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-brand text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-brand/90 transition-colors"
              >
                {saving ? 'Saving…' : editingForm ? 'Save Changes' : 'Save Form'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Forms Library ────────────────────────────────────────────────── */}
      {mode === 'list' && (
        <>
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Forms</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {formsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            ) : forms.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No forms yet — create one above</p>
            ) : (
              <div className="space-y-3">
                {forms.map(form => (
                  <div key={form.id} className="bg-white/80 border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-near-black truncate">{form.title}</p>
                        {form.is_active && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-green-50 text-green-700 border border-green-200 rounded-full flex-shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {form.questions.length} question{form.questions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {form.is_active ? (
                      <button
                        onClick={() => handleDeactivate(form.id)}
                        className="text-xs text-gray-400 hover:text-near-black font-medium transition-colors flex-shrink-0"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSetActive(form.id)}
                        className="text-xs text-brand hover:text-brand/70 font-medium transition-colors flex-shrink-0"
                      >
                        Set active
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(form)}
                      className="text-xs text-gray-500 hover:text-near-black font-medium transition-colors flex-shrink-0"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(form.id)}
                      className="text-xs text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Today's Dashboard ─────────────────────────────────────────── */}
          {activeForm && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Today — {today}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">
                  {responseMap.size}/{players.length} submitted
                </span>
              </div>

              {dashLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : players.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No players on roster yet</p>
              ) : (
                <div className="space-y-2">
                  {players.map(player => {
                    const resp = responseMap.get(player.id)
                    const isExpanded = expandedId === player.id

                    return (
                      <div key={player.id} className="bg-white/80 border border-gray-200 rounded-2xl overflow-hidden">
                        <button
                          className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
                          onClick={() => resp && setExpandedId(isExpanded ? null : player.id)}
                          disabled={!resp}
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${resp ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm font-medium text-near-black flex-1">{player.name}</span>
                          {resp ? (
                            <span className="text-xs text-gray-400">{formatTime(resp.submitted_at)}</span>
                          ) : (
                            <span className="text-xs text-gray-300">Pending</span>
                          )}
                          {resp && (
                            <span className="text-xs text-gray-400 ml-1">{isExpanded ? '▲' : '▼'}</span>
                          )}
                        </button>

                        {/* Expanded response detail */}
                        {isExpanded && resp && (
                          <div className="px-5 pb-4 pt-1 border-t border-gray-100 space-y-2">
                            {activeForm.questions.map(q => (
                              <div key={q.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">{q.label}</span>
                                <span className="font-medium text-near-black">
                                  {answerDisplay(q, resp.answers[q.id])}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
