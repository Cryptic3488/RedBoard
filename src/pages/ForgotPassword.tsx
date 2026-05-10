import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const redirectTo = `${import.meta.env.VITE_APP_URL}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
      setError(error.message)
      setSubmitting(false)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1C1C1E] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo lockup */}
        <div className="mb-10 text-center">
          <div className="mb-4">
            <span className="font-ui font-black text-4xl tracking-tight text-brand">Red</span>
            <span className="font-ui font-black text-4xl tracking-tight text-near-black dark:text-gray-100">Board</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <div className="h-px w-8 bg-brand" />
            <p className="font-ui text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400">
              Denison Women's Basketball
            </p>
            <div className="h-px w-8 bg-brand" />
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-semibold text-near-black dark:text-gray-100 mb-2">
              Check your email
            </h1>
            <p className="font-ui text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
              We sent a password reset link to <span className="font-semibold text-near-black dark:text-gray-200">{email}</span>.
              Check your inbox and click the link to set a new password.
            </p>
            <Link
              to="/login"
              className="font-ui text-sm text-brand hover:text-brand/80 transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="font-display text-4xl font-semibold text-near-black dark:text-gray-100 leading-tight">
                Reset your<br />
                <span className="italic text-brand">password.</span>
              </h1>
              <p className="font-ui text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                Enter your email and we'll send you a link to set a new password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block font-ui text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#2C2C2E] text-near-black dark:text-gray-100 rounded-lg px-4 py-3 font-ui text-sm
                             border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-brand
                             placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  placeholder="you@denison.edu"
                />
              </div>

              {error && (
                <p className="font-ui text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed
                           text-white font-ui font-semibold rounded-lg py-3.5 text-sm tracking-wide
                           transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {submitting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="font-ui text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
