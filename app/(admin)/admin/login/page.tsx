'use client'

/**
 * ADMIN LOGIN PAGE
 * Single-user auth via Supabase email + password.
 * On success: redirect to /admin/dashboard.
 * On fail: show inline error without revealing details.
 */
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const unauthorizedError = searchParams.get('error') === 'unauthorized'
    ? 'This account is not allowed to access admin. Sign in with your approved admin email.'
    : ''
  const [loading, setLoading]   = useState(false)

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

      const { error: authError } =
        await supabase.auth.signInWithPassword({ email, password })

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
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--black)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Subtle noise overlay — matches static site aesthetic */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.4,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.25em',
              color: 'var(--white)',
              marginBottom: '8px',
            }}
          >
            DJ <span style={{ color: 'var(--violet)' }}>B.A.E.</span>
          </div>
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Admin Access
          </div>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '40px',
          }}
        >
          <h1
            style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              marginBottom: '32px',
              color: 'var(--white)',
            }}
          >
            Sign In
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="email"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  background: 'var(--off-black)',
                  border: `1px solid ${error ? '#e85d75' : 'var(--border)'}`,
                  color: 'var(--white)',
                  padding: '14px 16px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 300,
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                  width: '100%',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--violet)' }}
                onBlur={e => { e.currentTarget.style.borderColor = error ? '#e85d75' : 'var(--border)' }}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  background: 'var(--off-black)',
                  border: `1px solid ${error ? '#e85d75' : 'var(--border)'}`,
                  color: 'var(--white)',
                  padding: '14px 16px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 300,
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                  width: '100%',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--violet)' }}
                onBlur={e => { e.currentTarget.style.borderColor = error ? '#e85d75' : 'var(--border)' }}
              />
            </div>

            {/* Error */}
            {(error || unauthorizedError) && (
              <p
                role="alert"
                style={{
                  fontSize: '12px',
                  color: '#e85d75',
                  letterSpacing: '0.04em',
                }}
              >
                {error || unauthorizedError}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                padding: '16px',
                background: loading ? 'rgba(155,93,229,0.5)' : 'var(--violet)',
                color: 'var(--black)',
                border: 'none',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase' as const,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
                width: '100%',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Back to site */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '11px',
            color: 'var(--muted)',
          }}
        >
          <Link
            href="/"
            style={{ color: 'var(--muted)', textDecoration: 'none' }}
            onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--white)' }}
            onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)' }}
          >
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginContent />
    </Suspense>
  )
}
