'use client'

/**
 * REVIEW DRAWER — Client Component
 * "Leave a Review" button that opens a bottom drawer on mobile,
 * centered modal on desktop. Contains ReviewForm.
 */
import { useState, useEffect, useRef } from 'react'
import { useBodyScrollLock } from '@/components/hooks/useBodyScrollLock'
import ReviewForm from '@/components/public/ReviewForm'

export default function ReviewDrawer() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useBodyScrollLock(open)

  function closeDrawer() {
    setOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeDrawer()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
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
          onClick={closeDrawer}
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
      {open ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Leave a Review"
          className="review-drawer-shell is-open"
          style={{
            position: 'fixed',
            zIndex: 201,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(520px, calc(100vw - 32px))',
            maxHeight: '90vh',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            padding: 'clamp(20px, 4vw, 32px)',
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
              ref={closeRef}
              type="button"
              onClick={closeDrawer}
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
      ) : null}

    </>
  )
}
