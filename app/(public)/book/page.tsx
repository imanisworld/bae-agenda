'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EVENT_TYPES, PACKAGES } from '@/lib/constants'

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  eventName: string
  eventType: string
  eventDate: string
  venue: string
  city: string
  package: string
  notes: string
}

const INITIAL_STATE: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  eventName: '',
  eventType: '',
  eventDate: '',
  venue: '',
  city: '',
  package: '',
  notes: '',
}

export default function BookPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const payload = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(payload.error ?? 'Could not submit booking request.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setForm(INITIAL_STATE)
      setLoading(false)
    } catch {
      setError('Unexpected error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        background: 'var(--off-black)',
        minHeight: '100vh',
        paddingTop: '120px',
      }}
    >
      <div className="section-container" style={{ maxWidth: '920px' }}>
        <div style={{ marginBottom: '36px' }}>
          <span className="section-label">Booking Inquiry</span>
          <h1
            style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: 'clamp(28px, 4.5vw, 52px)',
              fontWeight: 600,
              color: 'var(--white)',
              lineHeight: 1.1,
              margin: '12px 0 16px',
            }}
          >
            Book DJ B.A.E.
            <span style={{ color: 'var(--gold)' }}>.</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '560px' }}>
            Share your event details below. Requests are saved directly to the admin dashboard as
            new inquiries.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '28px',
            display: 'grid',
            gap: '18px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>First Name *</span>
              <input
                required
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                style={inputStyle()}
              />
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>Last Name</span>
              <input
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                style={inputStyle()}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>Email *</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                style={inputStyle()}
              />
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>Phone</span>
              <input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                style={inputStyle()}
              />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '8px' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Event Name *</span>
            <input
              required
              value={form.eventName}
              onChange={(e) => updateField('eventName', e.target.value)}
              style={inputStyle()}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>Event Type</span>
              <select
                value={form.eventType}
                onChange={(e) => updateField('eventType', e.target.value)}
                style={inputStyle()}
              >
                <option value="">Select an event type</option>
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>Event Date *</span>
              <input
                required
                type="date"
                value={form.eventDate}
                onChange={(e) => updateField('eventDate', e.target.value)}
                style={inputStyle()}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>Venue</span>
              <input
                value={form.venue}
                onChange={(e) => updateField('venue', e.target.value)}
                style={inputStyle()}
              />
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>City</span>
              <input
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                style={inputStyle()}
              />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '8px' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Package</span>
            <select
              value={form.package}
              onChange={(e) => updateField('package', e.target.value)}
              style={inputStyle()}
            >
              <option value="">Select a package</option>
              {PACKAGES.map((pkg) => (
                <option key={pkg.name} value={pkg.name}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '8px' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Notes</span>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              style={inputStyle()}
            />
          </label>

          {error && (
            <p style={{ color: '#e85d75', fontSize: '13px' }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ color: '#34d399', fontSize: '13px' }}>
              Booking request submitted. Check your admin bookings page for the new inquiry.
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Submitting...' : 'Submit Booking Request'}
            </button>
            <Link href="/" className="btn-ghost">
              Back to homepage
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    background: 'var(--off-black)',
    border: '1px solid var(--border)',
    color: 'var(--white)',
    padding: '12px 14px',
    fontSize: '14px',
    fontFamily: 'DM Sans, sans-serif',
  }
}
