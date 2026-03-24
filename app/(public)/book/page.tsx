'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EVENT_TYPES, PACKAGES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

type Step = 1 | 2 | 3

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  eventName: string
  eventType: string
  eventDate: string
  eventTime: string
  eventEndTime: string
  timeZone: string
  venue: string
  city: string
  package: string
  notes: string
  website: string
  startedAt: string
}

type FieldKey = 'firstName' | 'email' | 'eventName' | 'eventDate' | 'timeZone'
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
  eventEndTime: '',
  timeZone: 'America/Indiana/Indianapolis',
  venue: '',
  city: '',
  package: '',
  notes: '',
  website: '',
  startedAt: '',
}

const CITY_OPTIONS = [
  'Chicago, IL', 'Oak Park, IL', 'Evanston, IL', 'Naperville, IL',
  'Schaumburg, IL', 'Milwaukee, WI', 'Indianapolis, IN',
] as const

const TIME_ZONE_OPTIONS = [
  { value: 'America/Indiana/Indianapolis', label: 'Indianapolis (Eastern)' },
  { value: 'America/Chicago',              label: 'Chicago (Central)'      },
  { value: 'America/New_York',             label: 'New York (Eastern)'     },
  { value: 'America/Los_Angeles',          label: 'Los Angeles (Pacific)'  },
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

const STEP_LABELS: Record<Step, string> = {
  1: 'The Event',
  2: 'Your Info',
  3: 'Details',
}

export default function BookPage() {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL_STATE,
    startedAt: String(Date.now()),
  }))
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key in fieldErrors) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[key as FieldKey]; return n })
    }
  }

  function setCity(value: string) {
    setForm((prev) => ({
      ...prev,
      city: value,
      timeZone: CITY_TIME_ZONE_MAP[value] ?? prev.timeZone,
    }))
  }

  function validateStep(s: Step): FieldErrors {
    const e: FieldErrors = {}
    if (s === 1) {
      if (!form.eventDate.trim()) e.eventDate = 'Event date is required.'
      if (!form.timeZone.trim())  e.timeZone  = 'Timezone is required.'
    }
    if (s === 2) {
      if (!form.firstName.trim()) e.firstName = 'First name is required.'
      if (!form.email.trim())     e.email     = 'Email is required.'
    }
    if (s === 3) {
      if (!form.eventName.trim()) e.eventName = 'Event name is required.'
    }
    return e
  }

  function handleContinue() {
    const errors = validateStep(step)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errors = validateStep(3)
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const normalizedTime = TIME_OPTIONS.find(
        (o) => o.label === form.eventTime || o.value === form.eventTime
      )?.value ?? form.eventTime

      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, eventTime: normalizedTime }),
      })

      const payload = (await res.json()) as { error?: string; fields?: string[] }

      if (!res.ok) {
        if (payload.fields?.length) {
          const fromServer: FieldErrors = {}
          payload.fields.forEach((field) => {
            if (field in form) fromServer[field as FieldKey] = 'Please review this field.'
          })
          setFieldErrors(fromServer)
        }
        setError(payload.error ?? 'Could not submit booking request.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setForm({ ...INITIAL_STATE, startedAt: String(Date.now()) })
      setStep(1)
      setLoading(false)
    } catch {
      setError('Unexpected error. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ background: 'var(--off-black)', paddingTop: '68px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px', padding: '48px 24px' }}>
          <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '22px', color: 'var(--violet)', marginBottom: '16px' }}>◈</div>
          <h1 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(22px, 4vw, 32px)', color: 'var(--white)', marginBottom: '16px' }}>Request Received</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.75, marginBottom: '32px' }}>
            We&apos;ll review your details and reach back within 24–48 hours.
          </p>
          <Link href="/" className="btn-ghost">Back to homepage</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--off-black)', paddingTop: '68px' }}>
      <div className="section-container" style={{ maxWidth: '680px', paddingTop: 0, paddingBottom: '64px' }}>

        {/* Page header */}
        <div style={{ marginBottom: '36px' }}>
          <span className="section-label">Booking Inquiry</span>
          <h1 style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(28px, 4.5vw, 48px)',
            fontWeight: 600,
            color: 'var(--white)',
            lineHeight: 1.1,
            margin: '12px 0 0',
          }}>
            Book DJ B.A.E.<span style={{ color: 'var(--gold)' }}>.</span>
          </h1>
        </div>

        {/* Step indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '28px',
        }}>
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
                background: s === step ? 'var(--violet)' : s < step ? 'rgba(155,93,229,0.2)' : 'var(--surface)',
                color: s === step ? 'var(--black)' : s < step ? 'var(--violet)' : 'var(--muted)',
                border: `1px solid ${s === step ? 'var(--violet)' : s < step ? 'rgba(155,93,229,0.3)' : 'var(--border)'}`,
                transition: 'all 200ms ease',
              }}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div style={{
                  width: '32px',
                  height: '1px',
                  background: s < step ? 'var(--violet)' : 'var(--border)',
                  transition: 'background 200ms ease',
                }} />
              )}
            </div>
          ))}
          <span style={{
            marginLeft: '8px',
            fontSize: '11px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}>
            {step} of 3 — {STEP_LABELS[step]}
          </span>
        </div>

        {/* Hidden honeypot — always in DOM */}
        <input
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          name="website"
          value={form.website}
          onChange={(e) => set('website', e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
        />
        <input type="hidden" name="startedAt" value={form.startedAt} />

        <form onSubmit={onSubmit}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: 'clamp(20px, 4vw, 32px)',
            display: 'grid',
            gap: '20px',
          }}>

            {/* ── Step 1: The Event ─────────────────────── */}
            {step === 1 && (
              <>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <span className="section-label" style={{ marginBottom: 0 }}>Event Type</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    {EVENT_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => set('eventType', form.eventType === type ? '' : type)}
                        style={{
                          padding: '10px 12px',
                          fontSize: '11px',
                          letterSpacing: '0.08em',
                          textAlign: 'left',
                          background: form.eventType === type ? 'rgba(155,93,229,0.15)' : 'var(--off-black)',
                          border: `1px solid ${form.eventType === type ? 'var(--violet)' : 'var(--border)'}`,
                          color: form.eventType === type ? 'var(--white)' : 'var(--muted)',
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <label style={{ display: 'grid', gap: '8px' }}>
                  <span className="section-label" style={{ marginBottom: 0 }}>Event Date *</span>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={form.eventDate}
                    onChange={(e) => set('eventDate', e.target.value)}
                    style={{ ...inputStyle(Boolean(fieldErrors.eventDate)), colorScheme: 'dark' }}
                  />
                  {fieldErrors.eventDate && <span style={fieldErrorStyle()}>{fieldErrors.eventDate}</span>}
                </label>

                <div style={twoColGrid()}>
                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span className="section-label" style={{ marginBottom: 0 }}>Start Time</span>
                    <input
                      list="event-time-options"
                      value={form.eventTime}
                      onChange={(e) => set('eventTime', e.target.value)}
                      placeholder="Choose or type a time"
                      style={inputStyle()}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span className="section-label" style={{ marginBottom: 0 }}>End Time</span>
                    <input
                      list="event-end-time-options"
                      value={form.eventEndTime}
                      onChange={(e) => set('eventEndTime', e.target.value)}
                      placeholder="Choose or type a time"
                      style={inputStyle()}
                    />
                  </label>
                </div>

                <label style={{ display: 'grid', gap: '8px' }}>
                  <span className="section-label" style={{ marginBottom: 0 }}>Event Time Zone *</span>
                  <select
                    required
                    value={form.timeZone}
                    onChange={(e) => set('timeZone', e.target.value)}
                    style={inputStyle(Boolean(fieldErrors.timeZone))}
                  >
                    {TIME_ZONE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {fieldErrors.timeZone && <span style={fieldErrorStyle()}>{fieldErrors.timeZone}</span>}
                </label>
              </>
            )}

            {/* ── Step 2: Your Info ─────────────────────── */}
            {step === 2 && (
              <>
                <div style={twoColGrid()}>
                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span className="section-label" style={{ marginBottom: 0 }}>First Name *</span>
                    <input
                      required
                      value={form.firstName}
                      onChange={(e) => set('firstName', e.target.value)}
                      style={inputStyle(Boolean(fieldErrors.firstName))}
                    />
                    {fieldErrors.firstName && <span style={fieldErrorStyle()}>{fieldErrors.firstName}</span>}
                  </label>
                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span className="section-label" style={{ marginBottom: 0 }}>Last Name</span>
                    <input
                      value={form.lastName}
                      onChange={(e) => set('lastName', e.target.value)}
                      style={inputStyle()}
                    />
                  </label>
                </div>

                <div style={twoColGrid()}>
                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span className="section-label" style={{ marginBottom: 0 }}>Email *</span>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      style={inputStyle(Boolean(fieldErrors.email))}
                    />
                    {fieldErrors.email && <span style={fieldErrorStyle()}>{fieldErrors.email}</span>}
                  </label>
                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span className="section-label" style={{ marginBottom: 0 }}>Phone</span>
                    <input
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      style={inputStyle()}
                    />
                  </label>
                </div>
              </>
            )}

            {/* ── Step 3: Details ───────────────────────── */}
            {step === 3 && (
              <>
                <label style={{ display: 'grid', gap: '8px' }}>
                  <span className="section-label" style={{ marginBottom: 0 }}>Event Name *</span>
                  <input
                    required
                    value={form.eventName}
                    onChange={(e) => set('eventName', e.target.value)}
                    style={inputStyle(Boolean(fieldErrors.eventName))}
                  />
                  {fieldErrors.eventName && <span style={fieldErrorStyle()}>{fieldErrors.eventName}</span>}
                </label>

                <label style={{ display: 'grid', gap: '8px' }}>
                  <span className="section-label" style={{ marginBottom: 0 }}>Venue / Address</span>
                  <input
                    value={form.venue}
                    onChange={(e) => set('venue', e.target.value)}
                    placeholder="Venue name or full address"
                    style={inputStyle()}
                  />
                </label>

                <label style={{ display: 'grid', gap: '8px' }}>
                  <span className="section-label" style={{ marginBottom: 0 }}>City</span>
                  <input
                    list="city-options"
                    value={form.city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Choose or type any city"
                    style={inputStyle()}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
                    Type any city. The list is a shortcut.
                  </span>
                </label>

                <label style={{ display: 'grid', gap: '8px' }}>
                  <span className="section-label" style={{ marginBottom: 0 }}>Package</span>
                  <input
                    list="package-options"
                    value={form.package}
                    onChange={(e) => set('package', e.target.value)}
                    placeholder="Choose or type a package"
                    style={inputStyle()}
                  />
                </label>

                <label style={{ display: 'grid', gap: '8px' }}>
                  <span className="section-label" style={{ marginBottom: 0 }}>Notes</span>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    style={inputStyle()}
                  />
                </label>

                {error && <p style={{ color: '#e85d75', fontSize: '13px', margin: 0 }}>{error}</p>}
              </>
            )}

          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => { setFieldErrors({}); setStep((s) => (s - 1) as Step) }}
                className="btn-ghost"
              >
                ← Back
              </button>
            ) : (
              <Link href="/" className="btn-ghost">Cancel</Link>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleContinue}
                className="btn-primary"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Submitting…' : 'Submit Booking Request'}
              </button>
            )}
          </div>
        </form>

        {/* Datalists */}
        <datalist id="event-time-options">
          {TIME_OPTIONS.map((o) => <option key={o.value} value={o.label} />)}
        </datalist>
        <datalist id="event-end-time-options">
          {TIME_OPTIONS.map((o) => <option key={o.value} value={o.label} />)}
        </datalist>
        <datalist id="city-options">
          {CITY_OPTIONS.map((c) => <option key={c} value={c} />)}
        </datalist>
        <datalist id="package-options">
          {PACKAGE_OPTIONS.map((o) => <option key={o} value={o} />)}
        </datalist>
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
  return { fontSize: '12px', color: '#ff8da0', lineHeight: 1.5 }
}

function twoColGrid(): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
  }
}

function buildTimeOptions() {
  const options: Array<{ value: string; label: string }> = []
  for (let hour = 10; hour <= 23; hour++) {
    options.push({ value: `${String(hour).padStart(2, '0')}:00`, label: formatTimeLabel(hour, 0) })
    options.push({ value: `${String(hour).padStart(2, '0')}:30`, label: formatTimeLabel(hour, 30) })
  }
  return options
}

function formatTimeLabel(hour: number, minute: number) {
  const h = hour % 12 || 12
  return `${h}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}
