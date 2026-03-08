'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EVENT_TYPES, PACKAGES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  eventName: string
  eventType: string
  eventDate: string
  eventTime: string
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
  eventTime: '',
  venue: '',
  city: '',
  package: '',
  notes: '',
}

const CITY_OPTIONS = [
  'Chicago, IL',
  'Oak Park, IL',
  'Evanston, IL',
  'Naperville, IL',
  'Schaumburg, IL',
  'Milwaukee, WI',
  'Indianapolis, IN',
] as const

const DATE_OPTIONS = buildDateOptions()
const TIME_OPTIONS = buildTimeOptions()
const PACKAGE_OPTIONS = PACKAGES.map((pkg) =>
  `${pkg.name}${pkg.price ? ` (${formatCurrency(pkg.price)})` : ' (Custom quote)'}`
)

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
      const normalizedTime = TIME_OPTIONS.find(
        (option) => option.label === form.eventTime || option.value === form.eventTime
      )?.value ?? form.eventTime

      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          eventTime: normalizedTime,
        }),
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
            padding: 'clamp(20px, 4vw, 28px)',
            display: 'grid',
            gap: '18px',
          }}
        >
          <div style={responsiveGridStyle()}>
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

          <div style={responsiveGridStyle()}>
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

          <div style={responsiveGridStyle()}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>Event Type</span>
              <input
                list="event-type-options"
                value={form.eventType}
                onChange={(e) => updateField('eventType', e.target.value)}
                placeholder="Choose or type an event type"
                style={inputStyle()}
              />
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>Event Date *</span>
              <select
                required
                value={form.eventDate}
                onChange={(e) => updateField('eventDate', e.target.value)}
                style={inputStyle()}
              >
                <option value="">Select a date</option>
                {DATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={responsiveGridStyle()}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>Event Time</span>
              <input
                list="event-time-options"
                value={form.eventTime}
                onChange={(e) => updateField('eventTime', e.target.value)}
                placeholder="Choose or type a time"
                style={inputStyle()}
              />
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>City</span>
              <input
                list="city-options"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Choose or type a city"
                style={inputStyle()}
              />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '8px' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Venue / Address</span>
            <input
              value={form.venue}
              onChange={(e) => updateField('venue', e.target.value)}
              placeholder="Venue name or full address"
              style={inputStyle()}
            />
          </label>

          <label style={{ display: 'grid', gap: '8px' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Package</span>
            <input
              list="package-options"
              value={form.package}
              onChange={(e) => updateField('package', e.target.value)}
              placeholder="Choose or type a package"
              style={inputStyle()}
            />
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            alignItems: 'stretch',
          }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1, width: '100%', textAlign: 'center' }}
            >
              {loading ? 'Submitting...' : 'Submit Booking Request'}
            </button>
            <Link href="/" className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              Back to homepage
            </Link>
          </div>

          <datalist id="event-type-options">
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>

          <datalist id="event-time-options">
            {TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.label} />
            ))}
          </datalist>

          <datalist id="city-options">
            {CITY_OPTIONS.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>

          <datalist id="package-options">
            {PACKAGE_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
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
    minHeight: '48px',
    fontSize: '16px',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0',
    appearance: 'none',
  }
}

function responsiveGridStyle(): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  }
}

function buildDateOptions() {
  const options: Array<{ value: string; label: string }> = []
  const start = new Date()

  for (let i = 0; i < 365; i += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const value = formatDateValue(date)
    const label = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    options.push({ value, label })
  }

  return options
}

function buildTimeOptions() {
  const options: Array<{ value: string; label: string }> = []

  for (let hour = 10; hour <= 23; hour += 1) {
    options.push({
      value: `${String(hour).padStart(2, '0')}:00`,
      label: formatTimeLabel(hour, 0),
    })
    options.push({
      value: `${String(hour).padStart(2, '0')}:30`,
      label: formatTimeLabel(hour, 30),
    })
  }

  return options
}

function formatTimeLabel(hour: number, minute: number) {
  const normalizedHour = hour % 12 || 12
  const suffix = hour >= 12 ? 'PM' : 'AM'
  return `${normalizedHour}:${String(minute).padStart(2, '0')} ${suffix}`
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
