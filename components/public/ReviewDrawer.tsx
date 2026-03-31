'use client'

/**
 * REVIEW DRAWER — Client Component
 * "Leave a Review" button that opens a bottom drawer on mobile,
 * centered modal on desktop. Contains ReviewForm.
 */
import { useState, useEffect } from 'react'
import { useBodyScrollLock } from '@/components/hooks/useBodyScrollLock'
import ReviewForm from '@/components/public/ReviewForm'

export default function ReviewDrawer() {
  const [open, setOpen] = useState(false)

  useBodyScrollLock(open)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost"
        style={{ marginTop: '24px' }}
      >
        Leave a Review
      </button>

      {/* Backdrop */}
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(6px)',
          }}
        />
      )}

      {/* Drawer / Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Leave a Review"
        aria-hidden={!open}
        className={`review-drawer-shell${open ? ' is-open' : ''}`}
        style={{
          position: 'fixed',
          zIndex: 201,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          // Desktop: centered modal
          top: '50%',
          left: '50%',
          transform: open
            ? 'translate(-50%, -50%)'
            : 'translate(-50%, calc(-50% + 20px))',
          width: 'min(520px, calc(100vw - 32px))',
          maxHeight: '90vh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          padding: 'clamp(20px, 4vw, 32px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <span className="section-label" style={{ marginBottom: 0 }}>Leave a Review</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '18px',
              cursor: 'pointer',
              width: '44px',
              height: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
          Share your experience. It stays private until approved.
        </p>
        <ReviewForm compact />
      </div>
    </>
  )
}
