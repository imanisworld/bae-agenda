'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global application error', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0d0d0f', color: '#faf8f3', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 'max(24px, calc(var(--safe-top) + 20px)) max(24px, calc(var(--safe-right) + 20px)) max(24px, calc(var(--safe-bottom) + 20px)) max(24px, calc(var(--safe-left) + 20px))' }}>
          <div style={{ maxWidth: '560px', width: '100%', border: '1px solid rgba(255,255,255,0.14)', background: '#151518', padding: '32px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(250,248,243,0.68)', marginBottom: '12px' }}>
              Unexpected Error
            </div>
            <h1 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '32px', lineHeight: 1.05, margin: '0 0 12px' }}>
              Something went wrong.
            </h1>
            <p style={{ color: 'rgba(250,248,243,0.68)', lineHeight: 1.7, margin: '0 0 20px' }}>
              The issue has been logged. Please try again.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '12px 18px',
                border: '1px solid rgba(255,255,255,0.14)',
                background: '#9b5de5',
                color: '#faf8f3',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
