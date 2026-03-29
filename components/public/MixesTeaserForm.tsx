'use client'

import { useState } from 'react'

export default function MixesTeaserForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit() {
    const trimmed = email.trim()
    if (!trimmed || status === 'loading' || status === 'done') return

    setStatus('loading')
    try {
      const res = await fetch('/api/notify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, company: '' }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <p style={{
        fontSize: '13px',
        color: 'rgba(250,248,243,0.6)',
        letterSpacing: '0.06em',
        padding: '14px 0',
      }}>
        You&apos;re in 🎧
      </p>
    )
  }

  return (
    <form
      className="mixes-teaser-signup"
      onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
    >
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <label className="mixes-teaser-signup-field">
        <span className="sr-only">Email address</span>
        <input
          type="email"
          inputMode="email"
          placeholder="Enter email"
          aria-label="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
          required
        />
      </label>
      <button
        type="submit"
        className="mixes-teaser-signup-button"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? '...' : status === 'error' ? 'Try Again' : 'Notify Me'}
      </button>
    </form>
  )
}
