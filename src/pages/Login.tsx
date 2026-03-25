import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <div className="min-h-screen bg-cream dark:bg-[#1C1C1E] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo lockup */}
        <div className="mb-10 text-center">
          <div className="mb-4">
            <span className="font-ui font-black text-4xl tracking-tight text-brand">Red</span>
            <span className="font-ui font-black text-4xl tracking-tight text-near-black">Board</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <div className="h-px w-8 bg-brand" />
            <p className="font-ui text-xs tracking-widest uppercase text-gray-500">
              Denison Women's Basketball
            </p>
            <div className="h-px w-8 bg-brand" />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold text-near-black dark:text-gray-100 leading-tight">
            Sign in to<br />
            <span className="italic text-brand">your account.</span>
          </h1>
        </div>

        {/* Form */}
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

          <div>
            <label htmlFor="password" className="block font-ui text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#2C2C2E] text-near-black dark:text-gray-100 rounded-lg px-4 py-3 font-ui text-sm
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
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Footer mark */}
        <p className="font-ui text-gray-600 text-xs text-center mt-10 tracking-wide">
          TWO FEET IN
        </p>
      </div>
    </div>
  )
}
