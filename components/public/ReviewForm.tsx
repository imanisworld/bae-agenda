'use client'

import { useState, useRef } from 'react'
import { submitReview } from '@/app/actions/reviews'
import { trackEvent } from '@/lib/analytics'

const EVENT_TYPES = [
  'Club Night',
  'Private Party',
  'Birthday',
  'Wedding / Reception',
  'Corporate Event',
  'Rooftop / Day Party',
  'Other',
]

export default function ReviewForm({ compact = false }: { compact?: boolean }) {
  const [rating,    setRating]    = useState(0)
  const [hover,     setHover]     = useState(0)
  const [status,    setStatus]    = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg,  setErrorMsg]  = useState('')
  const [startedAt] = useState(() => String(Date.now()))
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!rating) {
      setErrorMsg('Please select a star rating.')
      trackEvent('review_submit_failed', { reason: 'missing_rating' })
      return
    }
    setStatus('loading')
    setErrorMsg('')
    trackEvent('review_submit_started', { rating, compact })

    const fd = new FormData(e.currentTarget)
    fd.set('rating', String(rating))

    const result = await submitReview(fd)
    if (result?.error) {
      setStatus('error')
      setErrorMsg(result.error)
      trackEvent('review_submit_failed', { reason: 'server_rejected', rating, compact })
    } else {
      setStatus('success')
      formRef.current?.reset()
      setRating(0)
      trackEvent('review_submit_succeeded', { rating, compact })
    }
  }

  if (status === 'success') {
    return (
      <div style={{
        border:   '1px solid rgba(155,93,229,0.24)',
        padding:  compact ? '24px 20px' : '32px 28px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(155,93,229,0.08), rgba(8,8,12,0.72))',
      }}>
        <div style={{ fontSize: '22px', marginBottom: '12px', color: 'var(--violet)' }}>◈</div>
        <div style={{
          fontFamily: 'Conthrax, sans-serif',
          fontSize:   '14px',
          color:      'var(--violet)',
          letterSpacing: '0.08em',
          marginBottom: '8px',
        }}>
          Thank you
        </div>
        <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.7 }}>
          Your review has been submitted and will be published once approved.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          style={{
            marginTop:   '20px',
            fontSize:    '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color:       'var(--violet)',
            background:  'none',
            border:      '1px solid transparent',
            cursor:      'pointer',
          }}
        >
          Submit another →
        </button>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width:       '100%',
    background:  'rgba(8,8,12,0.92)',
    border:      '1px solid rgba(255,255,255,0.16)',
    color:       'var(--white)',
    padding:     compact ? '10px 12px' : '12px 14px',
    fontFamily:  'DM Sans, sans-serif',
    // 16px avoids iOS Safari zooming the viewport on input focus.
    fontSize:    '16px',
    fontWeight:  300,
    boxSizing:   'border-box',
    boxShadow:   'inset 0 1px 0 rgba(255,255,255,0.03)',
  }

  const labelStyle: React.CSSProperties = {
    fontSize:      '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color:         'var(--muted)',
    display:       'block',
    marginBottom:  '6px',
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'grid', gap: compact ? '16px' : '20px' }}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
      <input type="hidden" name="startedAt" value={startedAt} />

      {/* Name + Event Type row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: compact ? '12px' : '16px' }}>
        <div style={{ display: 'grid', gap: '8px' }}>
          <label htmlFor="rv-name" style={labelStyle}>Your Name *</label>
          <input id="rv-name" name="name" type="text" required style={inputStyle} placeholder="First name or alias" />
        </div>
        <div style={{ display: 'grid', gap: '8px' }}>
          <label htmlFor="rv-event" style={labelStyle}>Event Type</label>
          <select
            id="rv-event"
            name="event_type"
            style={{
              ...inputStyle,
              appearance: 'none',
              paddingRight: '38px',
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='14' height='9' viewBox='0 0 14 9' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L7 7.5L13 1.5' stroke='%238f8f98' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
              backgroundSize: '14px 9px',
            }}
          >
            <option value="">Select type…</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Star rating */}
      <div style={{
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(8,8,12,0.35)',
        padding: compact ? '12px' : '16px 14px',
        display: 'grid',
        gap: compact ? '10px' : '12px',
      }}>
        <span style={labelStyle}>Rating *</span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              style={{
                background: 'none',
                border:     'none',
                cursor:     'pointer',
                fontSize:   compact ? '24px' : '28px',
                width:      compact ? '44px' : '48px',
                height:     compact ? '44px' : '48px',
                display:    'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding:    0,
                color:      n <= (hover || rating) ? 'var(--violet)' : 'rgba(255,255,255,0.15)',
                transition: 'color 100ms ease',
                lineHeight: 1,
                touchAction: 'manipulation',
              }}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
          <span style={{
            fontSize: '11px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: rating ? 'var(--violet)' : 'var(--muted)',
            marginLeft: '6px',
          }}>
            {rating ? `${rating}.0 Selected` : 'Select Rating'}
          </span>
        </div>
      </div>

      {/* Message */}
      <div style={{ display: 'grid', gap: '8px' }}>
        <label htmlFor="rv-message" style={labelStyle}>Your Review *</label>
        <textarea
          id="rv-message"
          name="message"
          required
          rows={compact ? 3 : 4}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
          placeholder="Tell us about your experience…"
        />
      </div>

      {/* Error */}
      {errorMsg && (
        <p role="alert" style={{ fontSize: '13px', color: '#e85d75', margin: 0 }}>
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding:       compact ? '14px 18px' : '16px',
          background:    status === 'loading' ? 'rgba(155,93,229,0.5)' : 'var(--violet)',
          color:         'var(--black)',
          border:        'none',
          fontFamily:    'DM Sans, sans-serif',
          fontSize:      '11px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          fontWeight:    500,
          cursor:        status === 'loading' ? 'not-allowed' : 'pointer',
          alignSelf:     'start',
          paddingLeft:   compact ? '22px' : '32px',
          paddingRight:  compact ? '22px' : '32px',
          boxShadow:     status === 'loading' ? 'none' : '0 10px 30px rgba(155,93,229,0.18)',
        }}
      >
        {status === 'loading' ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  )
}
