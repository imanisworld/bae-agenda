'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const unauthorizedError = searchParams.get('error') === 'unauthorized'
    ? 'This account is not allowed to access admin. Sign in with your approved admin email.'
    : ''
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!unauthorizedError) return
    const supabase = createClient()
    void supabase.auth.signOut()
  }, [unauthorizedError])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError('Sign in failed. Check your email and password.')
        setLoading(false)
        return
      }

      router.replace('/admin/dashboard')
      router.refresh()
      setLoading(false)
    } catch {
      setError('Unexpected error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="admin-login-shell">
      <div className="admin-login-atmosphere" aria-hidden="true">
        <span />
        <span />
      </div>

      <section className="admin-login-stage">
        <div className="admin-login-identity">
          <Link href="/" className="admin-login-wordmark">
            DJ <span>B.A.E.</span>
          </Link>
          <span className="admin-login-kicker">Private Control Room</span>
          <h1>Run the room.</h1>
          <p>
            Bookings, events, mixes, payments, clients, and site content in one private workspace.
          </p>
          <Link href="/" className="admin-login-back">← Back to public site</Link>
        </div>

        <div className="admin-login-card">
          <div className="admin-login-card-head">
            <span>Admin Access</span>
            <strong>Sign in</strong>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <label>
              <span>Email</span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error || unauthorizedError)}
              />
            </label>

            <label>
              <span>Password</span>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(error || unauthorizedError)}
              />
            </label>

            {(error || unauthorizedError) && (
              <p role="alert" className="admin-login-error">
                {error || unauthorizedError}
              </p>
            )}

            <button type="submit" disabled={loading} className="admin-login-submit">
              {loading ? 'Signing in…' : 'Enter Control Room'}
            </button>
          </form>

          <div className="admin-login-security">
            <span aria-hidden="true" />
            Approved admin accounts only
          </div>
        </div>
      </section>
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginContent />
    </Suspense>
  )
}
