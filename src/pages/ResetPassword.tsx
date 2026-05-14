import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type PageState = 'waiting' | 'ready' | 'success' | 'error'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [pageState, setPageState] = useState<PageState>('waiting')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user lands here via the magic link.
    // The client automatically extracts the token from the URL and sets the session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready')
      }
    })

    // Handle case where the token has already been processed (page re-render / StrictMode)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setPageState('ready')
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setSubmitting(false)
    } else {
      setPageState('success')
      // Sign out so user logs in fresh with new password
      await supabase.auth.signOut()
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111113] flex flex-col items-center justify-center px-4">
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

        {pageState === 'waiting' && (
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-ui text-sm text-gray-500 dark:text-gray-400">
              Verifying your reset link…
            </p>
          </div>
        )}

        {pageState === 'success' && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-semibold text-near-black dark:text-gray-100 mb-2">
              Password updated
            </h1>
            <p className="font-ui text-sm text-gray-500 dark:text-gray-400">
              Redirecting you to sign in…
            </p>
          </div>
        )}

        {pageState === 'ready' && (
          <>
            <div className="mb-8">
              <h1 className="font-display text-4xl font-semibold text-near-black dark:text-gray-100 leading-tight">
                Set a new<br />
                <span className="italic text-brand">password.</span>
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block font-ui text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-[#1C1C1E] text-near-black dark:text-gray-100 rounded-2xl px-4 py-3.5 shadow-sm font-ui text-sm
                             border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-brand
                             placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block font-ui text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-white dark:bg-[#1C1C1E] text-near-black dark:text-gray-100 rounded-2xl px-4 py-3.5 shadow-sm font-ui text-sm
                             border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-brand
                             placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  placeholder="••••••••"
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
                {submitting ? 'Updating…' : 'Set new password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
