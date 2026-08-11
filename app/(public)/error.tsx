'use client'

import { useEffect } from 'react'
import { reportClientError } from '@/lib/client-error-reporting'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportClientError(error, {
      source: 'public-route',
      digest: error.digest,
    })
  }, [error])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--black)', color: 'var(--white)', paddingTop: 'calc(var(--nav-height) + var(--safe-top))', paddingBottom: 'var(--safe-bottom)' }}>
      <div className="section-container" style={{ maxWidth: '760px', paddingTop: 0 }}>
        <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '32px' }}>
          <span className="section-label">Error</span>
          <h1 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(30px, 5vw, 52px)', margin: '0 0 14px' }}>
            Something broke.
          </h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 20px' }}>
            The issue has been logged. Try the page again in a moment.
          </p>
          <button type="button" onClick={reset} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
