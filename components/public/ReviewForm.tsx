'use client'

import { useState, useRef } from 'react'
import { submitReview } from '@/app/actions/reviews'

const EVENT_TYPES = [
  'Club Night',
  'Private Party',
  'Birthday',
  'Wedding / Reception',
  'Corporate Event',
  'Rooftop / Day Party',
  'Other',
]

export default function ReviewForm() {
  const [rating,    setRating]    = useState(0)
  const [hover,     setHover]     = useState(0)
  const [status,    setStatus]    = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg,  setErrorMsg]  = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!rating) { setErrorMsg('Please select a star rating.'); return }
    setStatus('loading')
    setErrorMsg('')

    const fd = new FormData(e.currentTarget)
    fd.set('rating', String(rating))

    const result = await submitReview(fd)
    if (result?.error) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('success')
      formRef.current?.reset()
      setRating(0)
    }
  }

  if (status === 'success') {
    return (
      <div style={{
        border:   '1px solid rgba(155,93,229,0.24)',
        padding:  '32px 28px',
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
        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7 }}>
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
            border:      'none',
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
    border:      '1px solid rgba(255,255,255,0.1)',
    color:       'var(--white)',
    padding:     '12px 14px',
    fontFamily:  'DM Sans, sans-serif',
    fontSize:    '14px',
    fontWeight:  300,
    outline:     'none',
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
    <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>

      {/* Name + Event Type row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ display: 'grid', gap: '8px' }}>
          <label htmlFor="rv-name" style={labelStyle}>Your Name *</label>
          <input id="rv-name" name="name" type="text" required style={inputStyle} placeholder="First name or alias" />
        </div>
        <div style={{ display: 'grid', gap: '8px' }}>
          <label htmlFor="rv-event" style={labelStyle}>Event Type</label>
          <select id="rv-event" name="event_type" style={{ ...inputStyle, appearance: 'none' }}>
            <option value="">Select type…</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Star rating */}
      <div style={{
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(8,8,12,0.35)',
        padding: '16px 14px',
        display: 'grid',
        gap: '12px',
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
                fontSize:   '28px',
                padding:    '2px',
                color:      n <= (hover || rating) ? 'var(--violet)' : 'rgba(255,255,255,0.15)',
                transition: 'color 100ms ease',
                lineHeight: 1,
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
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
          placeholder="Tell us about your experience…"
        />
      </div>

      {/* Error */}
      {errorMsg && (
        <p role="alert" style={{ fontSize: '12px', color: '#e85d75', margin: 0 }}>
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding:       '16px',
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
          paddingLeft:   '32px',
          paddingRight:  '32px',
          boxShadow:     status === 'loading' ? 'none' : '0 10px 30px rgba(155,93,229,0.18)',
        }}
      >
        {status === 'loading' ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  )
}
