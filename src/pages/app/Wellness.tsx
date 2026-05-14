import { useState } from 'react'
import { useWellnessCheck } from '../../hooks/useWellnessCheck'
import type { WellnessQuestion } from '../../types/database'
import { IconWellness, IconCheck } from '../../components/icons'

// ── Question inputs ───────────────────────────────────────────────────────────

function RatingInput({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Best']
  return (
    <div className="space-y-3">
      <div className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all
              ${value === n
                ? 'bg-brand text-white shadow-sm scale-105'
                : 'bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/12'
              }`}
          >
            {n}
          </button>
        ))}
      </div>
      {value && (
        <p className="text-center text-xs text-brand font-semibold">{labels[value]}</p>
      )}
    </div>
  )
}

function YesNoInput({ value, onChange }: { value: string | undefined; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-3">
      {['Yes', 'No'].map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all
            ${value === opt
              ? opt === 'Yes'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-gray-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/12'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function QuestionCard({ q, index, value, onChange, total }: {
  q: WellnessQuestion
  index: number
  value: number | string | undefined
  onChange: (id: string, v: number | string) => void
  total: number
}) {
  const answered = value !== undefined && value !== ''
  return (
    <div className={`bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border transition-all shadow-sm
      ${answered
        ? 'border-brand/20 dark:border-brand/30'
        : 'border-gray-100 dark:border-gray-800/60'}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="font-ui text-xs text-gray-400 dark:text-gray-500">{index + 1} of {total}</span>
        {answered && (
          <span className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center">
            <IconCheck size={11} className="text-brand" strokeWidth={3} />
          </span>
        )}
      </div>
      <p className="font-ui text-sm font-semibold text-near-black dark:text-gray-100 mb-4 leading-snug">
        {q.label}
      </p>
      {q.type === 'rating' && (
        <RatingInput value={value as number | undefined} onChange={v => onChange(q.id, v)} />
      )}
      {q.type === 'yesno' && (
        <YesNoInput value={value as string | undefined} onChange={v => onChange(q.id, v)} />
      )}
      {q.type === 'text' && (
        <textarea
          value={(value as string) ?? ''}
          onChange={e => onChange(q.id, e.target.value)}
          rows={3}
          placeholder="Type your response…"
          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700
                     rounded-xl px-4 py-3 text-sm text-near-black dark:text-gray-100
                     placeholder-gray-300 dark:placeholder-gray-600
                     focus:outline-none focus:border-brand resize-none transition-colors"
        />
      )}
    </div>
  )
}

// ── Submitted state ───────────────────────────────────────────────────────────

function SubmittedState({ form, answers }: {
  form: { title: string; questions: WellnessQuestion[] }
  answers: Record<string, number | string>
}) {
  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20
                      rounded-2xl px-5 py-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center
                        justify-center mx-auto mb-3">
          <IconCheck size={22} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
        </div>
        <p className="font-ui font-semibold text-near-black dark:text-gray-100">All done for today</p>
        <p className="font-ui text-sm text-gray-400 dark:text-gray-500 mt-1">{form.title}</p>
      </div>
      <div className="space-y-2">
        {form.questions.map(q => (
          <div key={q.id} className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-gray-800/60
                                     rounded-xl px-4 py-3 flex justify-between items-center gap-3">
            <span className="font-ui text-sm text-gray-500 dark:text-gray-400 flex-1">{q.label}</span>
            <span className="font-ui text-sm font-semibold text-near-black dark:text-gray-100 shrink-0">
              {answers[q.id] !== undefined
                ? q.type === 'rating' ? `${answers[q.id]} / 5` : String(answers[q.id])
                : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Wellness() {
  const { form, todayResponse, loading, submit } = useWellnessCheck()
  const [answers, setAnswers] = useState<Record<string, number | string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = (id: string, value: number | string) =>
    setAnswers(prev => ({ ...prev, [id]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    const unanswered = form.questions.filter(q => answers[q.id] === undefined || answers[q.id] === '')
    if (unanswered.length > 0) {
      setSubmitError(`${unanswered.length} question${unanswered.length > 1 ? 's' : ''} still need${unanswered.length === 1 ? 's' : ''} an answer`)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    const { error } = await submit(answers)
    if (error) setSubmitError(error)
    setSubmitting(false)
  }

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!form) return (
    <div className="px-4 py-20 text-center max-w-sm mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/8 flex items-center justify-center mx-auto mb-4">
        <IconWellness size={24} className="text-gray-300 dark:text-gray-600" />
      </div>
      <p className="font-ui font-semibold text-near-black dark:text-gray-100">No check-in today</p>
      <p className="font-ui text-sm text-gray-400 dark:text-gray-500 mt-1">Your coach hasn't posted one yet.</p>
    </div>
  )

  const answeredCount = form.questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length
  const progress = todayResponse ? 100 : (answeredCount / form.questions.length) * 100

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">

      {/* Header */}
      <div className="mb-6">
        <p className="font-ui text-xs tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="font-display text-3xl font-black text-near-black dark:text-white leading-none mb-3">
          {form.title}
        </h1>
        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-white/8 rounded-full h-1.5">
          <div
            className="bg-brand h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {!todayResponse && (
          <p className="font-ui text-xs text-gray-400 dark:text-gray-500 mt-1.5">
            {answeredCount} of {form.questions.length} answered
          </p>
        )}
      </div>

      {todayResponse ? (
        <SubmittedState form={form} answers={todayResponse.answers} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {form.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={i}
              value={answers[q.id]}
              onChange={handleChange}
              total={form.questions.length}
            />
          ))}

          {submitError && (
            <p className="font-ui text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10
                          border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand text-white py-4 rounded-2xl font-ui text-sm font-semibold
                       disabled:opacity-50 hover:bg-brand/90 active:scale-[0.98] transition-all mt-2 shadow-sm"
          >
            {submitting ? 'Submitting…' : 'Submit Check-in'}
          </button>
        </form>
      )}
    </div>
  )
}
