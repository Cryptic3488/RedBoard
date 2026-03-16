import { useState } from 'react'
import { useWellnessCheck } from '../../hooks/useWellnessCheck'
import type { WellnessQuestion } from '../../types/database'

// ── Question renderers ────────────────────────────────────────────────────────

function RatingInput({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-11 h-11 rounded-full text-sm font-bold transition-colors ${
            value === n
              ? 'bg-brand text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function YesNoInput({ value, onChange }: { value: string | undefined; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {['Yes', 'No'].map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            value === opt
              ? 'bg-brand text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function QuestionCard({
  q, index, value, onChange,
}: {
  q: WellnessQuestion
  index: number
  value: number | string | undefined
  onChange: (id: string, v: number | string) => void
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 space-y-3">
      <p className="text-sm font-medium text-near-black">
        <span className="text-gray-400 mr-1.5">{index + 1}.</span>
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
          rows={2}
          placeholder="Type your response…"
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-near-black placeholder-gray-400 focus:outline-none focus:border-brand resize-none"
        />
      )}
    </div>
  )
}

// ── Submitted state ───────────────────────────────────────────────────────────

function SubmittedCard({ form, answers }: {
  form: { title: string; questions: WellnessQuestion[] }
  answers: Record<string, number | string>
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white border-2 border-gold rounded-2xl px-5 py-5 text-center">
        <span className="text-3xl">✓</span>
        <p className="text-near-black font-semibold mt-2">All done for today</p>
        <p className="text-sm text-gray-400 mt-1">{form.title}</p>
      </div>
      <div className="space-y-2">
        {form.questions.map(q => (
          <div key={q.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-600">{q.label}</span>
            <span className="font-medium text-near-black">
              {answers[q.id] !== undefined
                ? q.type === 'rating' ? `${answers[q.id]}/5` : String(answers[q.id])
                : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

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
    // Validate all questions answered
    const unanswered = form.questions.filter(q => answers[q.id] === undefined || answers[q.id] === '')
    if (unanswered.length > 0) {
      setSubmitError('Please answer all questions before submitting')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    const { error } = await submit(answers)
    if (error) setSubmitError(error)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!form) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-4xl mb-3">💪</p>
        <p className="text-near-black font-semibold">No check-in today</p>
        <p className="text-sm text-gray-400 mt-1">Your coach hasn't posted one yet.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 pb-24">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-near-black text-xl font-bold">{form.title}</h1>
      </div>

      {todayResponse ? (
        <SubmittedCard form={form} answers={todayResponse.answers} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {form.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={i}
              value={answers[q.id]}
              onChange={handleChange}
            />
          ))}

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand text-white py-3 rounded-2xl text-sm font-semibold disabled:opacity-50 hover:bg-brand/90 transition-colors mt-2"
          >
            {submitting ? 'Submitting…' : 'Submit Check-in'}
          </button>
        </form>
      )}
    </div>
  )
}
