import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { role, loading, profileError } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (loading) return
    if (role) {
      navigate(role === 'admin' ? '/admin' : '/app/feed', { replace: true })
      return
    }
    if (profileError) {
      setError(profileError)
      setSubmitting(false)
    }
  }, [loading, role, profileError, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111113] flex flex-col items-center justify-center px-6 pt-safe-top pb-safe">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mb-3">
            <span className="font-ui font-black text-4xl tracking-tight text-brand">Red</span>
            <span className="font-ui font-black text-4xl tracking-tight text-near-black dark:text-white">Board</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <div className="h-px w-6 bg-brand/40" />
            <p className="font-ui text-[10px] tracking-widest uppercase text-gray-400 dark:text-gray-500">
              Denison Women's Basketball
            </p>
            <div className="h-px w-6 bg-brand/40" />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="font-display text-4xl font-black text-near-black dark:text-white leading-tight">
            Sign in to<br />
            <span className="italic text-brand">your account.</span>
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block font-ui text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-[#1C1C1E] text-near-black dark:text-gray-100 rounded-2xl px-4 py-3.5
                         border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-brand
                         placeholder-gray-300 dark:placeholder-gray-600 shadow-sm transition-colors"
              placeholder="you@denison.edu"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="font-ui text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500">
                Password
              </label>
              <Link to="/forgot-password" className="font-ui text-xs text-brand hover:text-brand/80 transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-[#1C1C1E] text-near-black dark:text-gray-100 rounded-2xl px-4 py-3.5
                         border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-brand
                         placeholder-gray-300 dark:placeholder-gray-600 shadow-sm transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="font-ui text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10
                          border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand hover:bg-brand/90 disabled:opacity-50
                       text-white font-ui font-semibold rounded-2xl py-4 text-sm
                       transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 mt-2"
          >
            {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="font-ui text-gray-300 dark:text-gray-700 text-xs text-center mt-12 tracking-widest uppercase">
          Two Feet In
        </p>
      </div>
    </div>
  )
}
