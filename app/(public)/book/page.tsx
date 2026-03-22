'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EVENT_TYPES, PACKAGES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import TurnstileWidget from '@/components/public/TurnstileWidget'

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  eventName: string
  eventType: string
  eventDate: string
  eventTime: string
  timeZone: string
  venue: string
  city: string
  package: string
  notes: string
  website: string
  startedAt: string
  turnstileToken: string
}

type FieldKey =
  | 'firstName'
  | 'email'
  | 'eventName'
  | 'eventDate'
  | 'timeZone'
  | 'turnstileToken'

type FieldErrors = Partial<Record<FieldKey, string>>

const INITIAL_STATE: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  eventName: '',
  eventType: '',
  eventDate: '',
  eventTime: '',
  timeZone: 'America/Indiana/Indianapolis',
  venue: '',
  city: '',
  package: '',
  notes: '',
  website: '',
  startedAt: '',
  turnstileToken: '',
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

const TIME_ZONE_OPTIONS = [
  { value: 'America/Indiana/Indianapolis', label: 'Indianapolis (Eastern)' },
  { value: 'America/Chicago', label: 'Chicago (Central)' },
  { value: 'America/New_York', label: 'New York (Eastern)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (Pacific)' },
] as const

const CITY_TIME_ZONE_MAP: Record<string, string> = {
  'Chicago, IL': 'America/Chicago',
  'Oak Park, IL': 'America/Chicago',
  'Evanston, IL': 'America/Chicago',
  'Naperville, IL': 'America/Chicago',
  'Schaumburg, IL': 'America/Chicago',
  'Milwaukee, WI': 'America/Chicago',
  'Indianapolis, IN': 'America/Indiana/Indianapolis',
}

const TIME_OPTIONS = buildTimeOptions()
const PACKAGE_OPTIONS = PACKAGES.map((pkg) =>
  `${pkg.name}${pkg.price ? ` (${formatCurrency(pkg.price)})` : ' (Custom quote)'}`
)

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export default function BookPage() {
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL_STATE,
    startedAt: String(Date.now()),
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key in fieldErrors) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[key as FieldKey]
        return next
      })
    }
  }

  function updateCity(value: string) {
    setForm((prev) => ({
      ...prev,
      city: value,
      timeZone: CITY_TIME_ZONE_MAP[value] ?? prev.timeZone,
    }))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setFieldErrors({})
    setLoading(true)

    const nextErrors: FieldErrors = {}
    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.'
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    if (!form.eventName.trim()) nextErrors.eventName = 'Event name is required.'
    if (!form.eventDate.trim()) nextErrors.eventDate = 'Event date is required.'
    if (!form.timeZone.trim()) nextErrors.timeZone = 'Timezone is required.'
    if (TURNSTILE_SITE_KEY && !form.turnstileToken.trim()) {
      nextErrors.turnstileToken = 'Please complete the verification check.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setError('Please complete the highlighted fields and try again.')
      setLoading(false)
      return
    }

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

      const payload = (await res.json()) as { error?: string; fields?: string[] }

      if (!res.ok) {
        if (payload.fields?.length) {
          const fromServer: FieldErrors = {}
          payload.fields.forEach((field) => {
            if (field in form) {
              fromServer[field as FieldKey] = 'Please review this field.'
            }
          })
          setFieldErrors(fromServer)
        }
        setError(payload.error ?? 'Could not submit booking request.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setForm({
        ...INITIAL_STATE,
        startedAt: String(Date.now()),
        turnstileToken: '',
      })
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
        paddingTop: '68px',
      }}
    >
      <div className="section-container" style={{ maxWidth: '920px', paddingTop: 0 }}>
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
          <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6, maxWidth: '620px' }}>
            This form uses basic spam protection and abuse checks so only real inquiries make it through.
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
          <input
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            name="website"
            value={form.website}
            onChange={(e) => updateField('website', e.target.value)}
            style={{
              position: 'absolute',
              left: '-9999px',
              width: '1px',
              height: '1px',
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
          <input type="hidden" name="startedAt" value={form.startedAt} />

          <div style={responsiveGridStyle()}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>First Name *</span>
              <input
                required
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                style={inputStyle(Boolean(fieldErrors.firstName))}
              />
              {fieldErrors.firstName && <span style={fieldErrorStyle()}>{fieldErrors.firstName}</span>}
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
                style={inputStyle(Boolean(fieldErrors.email))}
              />
              {fieldErrors.email && <span style={fieldErrorStyle()}>{fieldErrors.email}</span>}
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
              style={inputStyle(Boolean(fieldErrors.eventName))}
            />
            {fieldErrors.eventName && <span style={fieldErrorStyle()}>{fieldErrors.eventName}</span>}
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
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={form.eventDate}
                onChange={(e) => updateField('eventDate', e.target.value)}
                style={{
                  ...inputStyle(Boolean(fieldErrors.eventDate)),
                  colorScheme: 'dark',
                }}
              />
              {fieldErrors.eventDate && <span style={fieldErrorStyle()}>{fieldErrors.eventDate}</span>}
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
                onChange={(e) => updateCity(e.target.value)}
                placeholder="Choose or type any city"
                style={inputStyle()}
              />
              <span style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
                Type any city you want. The list is only a shortcut.
              </span>
            </label>
          </div>

          <label style={{ display: 'grid', gap: '8px' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Event Time Zone *</span>
            <select
              required
              value={form.timeZone}
              onChange={(e) => updateField('timeZone', e.target.value)}
              style={inputStyle(Boolean(fieldErrors.timeZone))}
            >
              {TIME_ZONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Choose the timezone where the event will happen. Indianapolis is Eastern; Chicago is Central.
            </span>
            {fieldErrors.timeZone && <span style={fieldErrorStyle()}>{fieldErrors.timeZone}</span>}
          </label>

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
              Request received! We'll review your details and be in touch within 24–48 hours.
            </p>
          )}

          {TURNSTILE_SITE_KEY && (
            <div style={{ display: 'grid', gap: '10px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>Verification</span>
              <TurnstileWidget
                siteKey={TURNSTILE_SITE_KEY}
                onToken={(token) => updateField('turnstileToken', token)}
              />
              <span style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
                This helps keep spam and bot submissions out of the booking form.
              </span>
              {fieldErrors.turnstileToken && <span style={fieldErrorStyle()}>{fieldErrors.turnstileToken}</span>}
            </div>
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
              disabled={loading || Boolean(TURNSTILE_SITE_KEY && !form.turnstileToken)}
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

function inputStyle(hasError = false): React.CSSProperties {
  return {
    width: '100%',
    background: 'var(--off-black)',
    border: `1px solid ${hasError ? '#e85d75' : 'var(--border)'}`,
    color: 'var(--white)',
    padding: '12px 14px',
    minHeight: '48px',
    fontSize: '16px',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0',
    appearance: 'none',
  }
}

function fieldErrorStyle(): React.CSSProperties {
  return {
    fontSize: '12px',
    color: '#ff8da0',
    lineHeight: 1.5,
  }
}

function responsiveGridStyle(): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  }
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
