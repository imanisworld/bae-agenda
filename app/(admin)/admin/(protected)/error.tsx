'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin-error]', error)
  }, [error])

  return (
    <div className="admin-page admin-page--narrow">
      <div className="admin-section" style={{ padding: '28px' }}>
        <div className="admin-section-title" style={{ marginBottom: '10px' }}>
          Admin data could not be loaded
        </div>
        <p className="muted" style={{ fontSize: '13px', lineHeight: 1.7, margin: '0 0 18px' }}>
          The page hit a database or server error. No empty-state data is being substituted.
        </p>
        <button type="button" className="admin-btn-primary" onClick={reset}>
          Try Again
        </button>
      </div>
    </div>
  )
}
