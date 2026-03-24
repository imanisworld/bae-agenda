'use client'

/**
 * REVIEW DRAWER — Client Component
 * "Leave a Review" button that opens a bottom drawer on mobile,
 * centered modal on desktop. Contains ReviewForm.
 */
import { useState, useEffect } from 'react'
import ReviewForm from '@/components/public/ReviewForm'

export default function ReviewDrawer() {
  const [open, setOpen] = useState(false)

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

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
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
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
