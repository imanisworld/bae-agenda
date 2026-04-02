'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns'
import { EVENT_TYPES, PACKAGES } from '@/lib/constants'
import { trackEvent } from '@/lib/analytics'
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

type FieldKey =
  | 'firstName'
  | 'email'
  | 'eventName'
  | 'eventDate'
  | 'timeZone'
  | 'eventTime'
  | 'eventEndTime'

type FieldErrors = Partial<Record<FieldKey, string>>

type BookingSubmitPayload = {
  error?: string
  fields?: string[]
  retryAfter?: number
  fieldErrors?: Partial<Record<FieldKey, string>>
  conflicts?: Array<{ title: string; time: string; type: string }>
}

type BookingSuccessState = {
  firstName: string
  email: string
  eventName: string
  eventDate: string
  eventType: string
  city: string
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

const STEP_LABELS: Record<Step, string> = {
  1: 'The Event',
  2: 'Your Info',
  3: 'Details',
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseFormTime(s: string): number | null {
  const trimmed = sanitizeTimeInput(s)
  if (!trimmed) return null

  const h24 = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (h24) {
    const h = Number(h24[1])
    const m = Number(h24[2])
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return h * 60 + m
    return null
  }

  const h12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(trimmed)
  if (h12) {
    let h = Number(h12[1])
    const m = Number(h12[2])
    const period = h12[3].toUpperCase()
    if (m < 0 || m > 59 || h < 1 || h > 12) return null
    if (period === 'AM' && h === 12) h = 0
    if (period === 'PM' && h !== 12) h += 12
    return h * 60 + m
  }

  return null
}

function normalizeTimeValue(t: string): string {
  const sanitized = sanitizeTimeInput(t)
  return TIME_OPTIONS.find((o) => o.label === sanitized || o.value === sanitized)?.value ?? sanitized
}

function sanitizeTimeInput(value: string) {
  return value
    ?.replace(/[\u00A0\u202F]/g, ' ')
    .replace(/\./g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase() ?? ''
}

function stepForField(field: string): Step {
  if (field === 'firstName' || field === 'email') return 2
  if (field === 'eventName') return 3
  return 1
}

export default function BookingForm() {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL_STATE,
    startedAt: String(Date.now()),
  }))
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [loadingBlockedDates, setLoadingBlockedDates] = useState(true)
  const [error, setError] = useState('')
  const [availabilityError, setAvailabilityError] = useState('')
  const [blockedDatesError, setBlockedDatesError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successState, setSuccessState] = useState<BookingSuccessState | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))

  const blockedDateSet = useMemo(() => new Set(blockedDates), [blockedDates])
  const normalizedStartTime = normalizeTimeValue(form.eventTime)
  const endTimeOptions = useMemo(
    () => getEndTimeOptions(normalizedStartTime),
    [normalizedStartTime]
  )

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key in fieldErrors) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[key as FieldKey]
        return next
      })
    }
    if (key === 'eventDate' || key === 'eventTime' || key === 'eventEndTime' || key === 'timeZone') {
      setAvailabilityError('')
    }
  }

  function setCity(value: string) {
    setForm((prev) => ({
      ...prev,
      city: value,
      timeZone: CITY_TIME_ZONE_MAP[value] ?? prev.timeZone,
    }))
  }

  useEffect(() => {
    let cancelled = false

    async function loadBlockedDates() {
      setLoadingBlockedDates(true)
      setBlockedDatesError('')

      try {
        const res = await fetch(`/api/booking/blocked-dates?timeZone=${encodeURIComponent(form.timeZone)}`)
        const payload = await res.json() as { dates?: string[]; error?: string }

        if (!res.ok) {
          throw new Error(payload.error ?? 'Could not load blocked dates.')
        }

        if (cancelled) return
        setBlockedDates(payload.dates ?? [])
      } catch (err) {
        if (cancelled) return
        setBlockedDates([])
        setBlockedDatesError(err instanceof Error ? err.message : 'Could not load blocked dates.')
      } finally {
        if (!cancelled) setLoadingBlockedDates(false)
      }
    }

    void loadBlockedDates()

    return () => {
      cancelled = true
    }
  }, [form.timeZone])

  useEffect(() => {
    if (!form.eventDate) return

    if (blockedDateSet.has(form.eventDate)) {
      set('eventDate', '')
      setFieldErrors((prev) => ({
        ...prev,
        eventDate: 'That date is already unavailable. Please choose another date.',
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockedDateSet, form.eventDate])

  useEffect(() => {
    if (!form.eventEndTime) return

    const normalizedEnd = normalizeTimeValue(form.eventEndTime)
    if (!endTimeOptions.some((option) => option.value === normalizedEnd)) {
      set('eventEndTime', '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTimeOptions, form.eventEndTime])

  useEffect(() => {
    const priorityField = getFirstErrorField(fieldErrors)
    if (!priorityField) return

    const target = formRef.current?.querySelector<HTMLElement>(`[data-booking-field="${priorityField}"]`)
    if (!target) return

    window.requestAnimationFrame(() => {
      target.focus()
      target.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }, [fieldErrors])

  function validateStep(currentStep: Step): FieldErrors {
    const errors: FieldErrors = {}

    if (currentStep === 1) {
      const normalizedStart = normalizeTimeValue(form.eventTime)
      const normalizedEnd = normalizeTimeValue(form.eventEndTime)

      if (!form.eventDate.trim()) {
        errors.eventDate = 'Event date is required.'
      } else {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const chosen = new Date(form.eventDate + 'T00:00:00')
        if (chosen < today) {
          errors.eventDate = 'Event date must be in the future.'
        } else if (blockedDateSet.has(form.eventDate)) {
          errors.eventDate = 'That date is already unavailable. Please choose another date.'
        }
      }

      if (!form.timeZone.trim()) errors.timeZone = 'Timezone is required.'

      if (normalizedStart && parseFormTime(normalizedStart) === null) {
        errors.eventTime = 'Invalid format. Use "10:00 AM" or "22:00".'
      }
      if (normalizedEnd && parseFormTime(normalizedEnd) === null) {
        errors.eventEndTime = 'Invalid format. Use "11:30 PM" or "23:30".'
      }

      if (!errors.eventTime && !errors.eventEndTime && normalizedStart && normalizedEnd) {
        const startMins = parseFormTime(normalizedStart)
        const endMins = parseFormTime(normalizedEnd)
        if (startMins !== null && endMins !== null && endMins <= startMins) {
          errors.eventEndTime = 'End time must be after start time.'
        }
      }
    }

    if (currentStep === 2) {
      if (!form.firstName.trim()) errors.firstName = 'First name is required.'
      if (!form.email.trim()) errors.email = 'Email is required.'
      else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.'
    }

    if (currentStep === 3 && !form.eventName.trim()) {
      errors.eventName = 'Event name is required.'
    }

    return errors
  }

  async function handleContinue() {
    const errors = validateStep(step)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    if (step === 1) {
      if (loadingBlockedDates) {
        setBlockedDatesError('Please wait while we load unavailable dates.')
        return
      }

      setCheckingAvailability(true)
      setAvailabilityError('')
      try {
        const res = await fetch('/api/booking/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventDate: form.eventDate,
            eventTime: normalizeTimeValue(form.eventTime),
            eventEndTime: normalizeTimeValue(form.eventEndTime),
            timeZone: form.timeZone,
          }),
        })

        type CheckResult = {
          available: boolean
          hasTime: boolean
          conflicts: Array<{ title: string; time: string; type: string }>
          error?: string
        }

        const result = await res.json() as CheckResult

        if (!res.ok) {
          setAvailabilityError(result.error ?? 'We could not verify availability right now. Please try again.')
          setCheckingAvailability(false)
          return
        }

        if (!result.available && result.conflicts.length > 0) {
          const names = result.conflicts.map((conflict) => `"${conflict.title}" at ${conflict.time}`).join(', ')
          trackEvent('booking_availability_conflict', {
            hasTime: result.hasTime,
            conflictCount: result.conflicts.length,
          })
          setAvailabilityError(
            result.hasTime
              ? `That time is no longer available. Please choose another time. Current conflicts: ${names}.`
              : `There are already events scheduled that day: ${names}. Add a start time so we can check availability more accurately.`
          )
          setCheckingAvailability(false)
          return
        }
      } catch {
        console.warn('[book] availability check failed, proceeding anyway')
        trackEvent('booking_availability_check_failed', { reason: 'network_error' })
      }
      setCheckingAvailability(false)
    }

    trackEvent('booking_step_completed', {
      step,
      nextStep: step < 3 ? step + 1 : step,
    })
    setStep((current) => (current < 3 ? ((current + 1) as Step) : current))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errors = validateStep(3)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setError('')
    setSuccess(false)
    setLoading(true)
    trackEvent('booking_submit_started', {
      eventType: form.eventType || 'unspecified',
      hasStartTime: Boolean(form.eventTime.trim()),
      hasEndTime: Boolean(form.eventEndTime.trim()),
      hasPackage: Boolean(form.package.trim()),
      hasCity: Boolean(form.city.trim()),
    })

    try {
      const normalizedStart = normalizeTimeValue(form.eventTime)
      const normalizedEnd = normalizeTimeValue(form.eventEndTime)

      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          eventTime: normalizedStart,
          eventEndTime: normalizedEnd,
        }),
      })

      const payload = (await res.json()) as BookingSubmitPayload

      if (!res.ok) {
        let nextStep: Step | null = null

        if (payload.fieldErrors && Object.keys(payload.fieldErrors).length > 0) {
          setFieldErrors(payload.fieldErrors)
          nextStep = Object.keys(payload.fieldErrors).reduce<Step>(
            (current, field) => Math.min(current, stepForField(field)) as Step,
            3
          )
        } else if (payload.fields?.length) {
          const serverErrors: FieldErrors = {}
          payload.fields.forEach((field) => {
            if (field in form) serverErrors[field as FieldKey] = payload.error ?? 'Please review this field.'
          })
          setFieldErrors(serverErrors)
          nextStep = payload.fields.reduce<Step>(
            (current, field) => Math.min(current, stepForField(field)) as Step,
            3
          )
        }

        if (payload.conflicts?.length) {
          const names = payload.conflicts.map((conflict) => `"${conflict.title}" at ${conflict.time}`).join(', ')
          setAvailabilityError(
            form.eventTime || form.eventEndTime
              ? `This time is too close to an existing event: ${names}. Events must be at least 30 minutes apart.`
              : `That date is already tied to another event: ${names}. Please choose another date.`
          )
          nextStep = 1
        }

        if (nextStep) setStep(nextStep)

        trackEvent('booking_submit_failed', {
          reason: payload.error ?? 'request_failed',
          fieldCount: payload.fields?.length ?? 0,
        })
        if (res.status === 429 && payload.retryAfter) {
          setError(`Too many requests. Please wait ${formatRetryAfter(payload.retryAfter)} and try again.`)
        } else {
          setError(payload.error ?? 'Could not submit booking request.')
        }
        setLoading(false)
        return
      }

      trackEvent('booking_submit_succeeded', {
        eventType: form.eventType || 'unspecified',
        hasPackage: Boolean(form.package.trim()),
        hasCity: Boolean(form.city.trim()),
      })
      setSuccessState({
        firstName: form.firstName.trim(),
        email: form.email.trim(),
        eventName: form.eventName.trim(),
        eventDate: form.eventDate,
        eventType: form.eventType.trim(),
        city: form.city.trim(),
      })
      setSuccess(true)
      setForm({ ...INITIAL_STATE, startedAt: String(Date.now()) })
      setStep(1)
      setLoading(false)
    } catch {
      trackEvent('booking_submit_failed', { reason: 'network_error' })
      setError('Unexpected error. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return <BookingSuccess summary={successState} />
  }

  return (
    <div style={{ background: 'var(--off-black)', paddingTop: '68px' }}>
      <div className="section-container" style={{ maxWidth: '680px', paddingTop: 0, paddingBottom: '64px' }}>
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

        <BookingProgress step={step} />

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

        <form ref={formRef} onSubmit={onSubmit} noValidate>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: 'clamp(20px, 4vw, 32px)',
            display: 'grid',
            gap: '20px',
          }}>
            <div aria-live="polite" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
              {checkingAvailability
                ? 'Checking availability.'
                : loading
                  ? 'Submitting booking request.'
                  : availabilityError || error || blockedDatesError || Object.values(fieldErrors)[0] || ''}
            </div>

            {step === 1 && (
              <EventStep
                availabilityError={availabilityError}
                blockedDates={blockedDateSet}
                blockedDatesError={blockedDatesError}
                calendarMonth={calendarMonth}
                fieldErrors={fieldErrors}
                form={form}
                loadingBlockedDates={loadingBlockedDates}
                setCalendarMonth={setCalendarMonth}
                set={set}
              />
            )}

            {step === 2 && (
              <ContactStep
                fieldErrors={fieldErrors}
                form={form}
                set={set}
              />
            )}

            {step === 3 && (
              <DetailsStep
                error={error}
                fieldErrors={fieldErrors}
                form={form}
                set={set}
                setCity={setCity}
                onEditTimes={() => {
                  setFieldErrors({})
                  setAvailabilityError('')
                  setStep(1)
                }}
              />
            )}
          </div>

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
                onClick={() => {
                  setFieldErrors({})
                  setAvailabilityError('')
                  setStep((current) => (current - 1) as Step)
                }}
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
                disabled={checkingAvailability}
                style={{ opacity: checkingAvailability ? 0.6 : 1 }}
              >
                {checkingAvailability ? 'Checking availability…' : 'Continue →'}
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

        <datalist id="city-options">
          {CITY_OPTIONS.map((city) => <option key={city} value={city} />)}
        </datalist>
        <datalist id="package-options">
          {PACKAGE_OPTIONS.map((option) => <option key={option} value={option} />)}
        </datalist>
      </div>
    </div>
  )
}

function BookingSuccess({ summary }: { summary: BookingSuccessState | null }) {
  const submittedDate = summary?.eventDate
    ? format(parseISO(`${summary.eventDate}T00:00:00`), 'MMMM d, yyyy')
    : null

  return (
    <div style={{ background: 'var(--off-black)', paddingTop: '68px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 'min(100%, 640px)', padding: '48px 24px' }}>
        <div
          style={{
            border: '1px solid var(--border)',
            background: 'linear-gradient(180deg, rgba(18,18,22,0.98), rgba(12,12,16,0.98))',
            padding: 'clamp(24px, 4vw, 40px)',
            display: 'grid',
            gap: '22px',
          }}
        >
        <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '22px', color: 'var(--violet)', marginBottom: '16px' }}>◈</div>
          <div>
            <div className="section-label" style={{ marginBottom: '10px' }}>Inquiry Sent</div>
            <h1 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(22px, 4vw, 32px)', color: 'var(--white)', margin: 0 }}>Request Received</h1>
            <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.75, margin: '16px 0 0' }}>
              We&apos;ll review your details and reach back within 24–48 hours. Keep an eye on <span style={{ color: 'var(--white)' }}>{summary?.email || 'your inbox'}</span> for the first follow-up.
            </p>
          </div>

          {summary ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              {[
                { label: 'Event', value: summary.eventName || 'Booking inquiry' },
                { label: 'Date', value: submittedDate || 'Date received' },
                { label: 'Type', value: summary.eventType || 'Event details received' },
                { label: 'City', value: summary.city || 'Location pending' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '14px 16px',
                    display: 'grid',
                    gap: '6px',
                  }}
                >
                  <div style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--white)' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              What Happens Next
            </div>
            <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'rgba(250,248,243,0.76)' }}>
              We review availability, format, and event fit first. If it looks like a match, the next email will cover follow-up questions, pricing clarity, and what it takes to lock the date in.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/" className="btn-ghost">Back to homepage</Link>
            <Link href="/portfolio" className="btn-primary">See Recent Events →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingProgress({ step }: { step: Step }) {
  return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
      {([1, 2, 3] as Step[]).map((value) => (
        <div key={value} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            background: value === step ? 'var(--violet)' : value < step ? 'rgba(155,93,229,0.2)' : 'var(--surface)',
            color: value === step ? 'var(--black)' : value < step ? 'var(--violet)' : 'var(--muted)',
            border: `1px solid ${value === step ? 'var(--violet)' : value < step ? 'rgba(155,93,229,0.3)' : 'var(--border)'}`,
            transition: 'background 200ms ease, border-color 200ms ease, color 200ms ease',
          }}>
            {value < step ? '✓' : value}
          </div>
          {value < 3 && (
            <div style={{
              width: '32px',
              height: '1px',
              background: value < step ? 'var(--violet)' : 'var(--border)',
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
  )
}

function EventStep({
  availabilityError,
  blockedDates,
  blockedDatesError,
  calendarMonth,
  fieldErrors,
  form,
  loadingBlockedDates,
  setCalendarMonth,
  set,
}: {
  availabilityError: string
  blockedDates: Set<string>
  blockedDatesError: string
  calendarMonth: Date
  fieldErrors: FieldErrors
  form: FormState
  loadingBlockedDates: boolean
  setCalendarMonth: (value: Date) => void
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  const today = startOfToday()
  const selectedDate = form.eventDate ? parseISO(`${form.eventDate}T00:00:00`) : null
  const visibleMonth = selectedDate && isSameMonth(selectedDate, calendarMonth)
    ? calendarMonth
    : startOfMonth(calendarMonth)
  const calendarDays = buildCalendarDays(visibleMonth)

  return (
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
                minHeight: '44px',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textAlign: 'left',
                background: form.eventType === type ? 'rgba(155,93,229,0.15)' : 'var(--off-black)',
                border: `1px solid ${form.eventType === type ? 'var(--violet)' : 'var(--border)'}`,
                color: form.eventType === type ? 'var(--white)' : 'var(--muted)',
                cursor: 'pointer',
                transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>Event Date *</span>
        <div
          data-booking-field="eventDate"
          tabIndex={-1}
          style={calendarShellStyle(Boolean(fieldErrors.eventDate))}
        >
          <div style={calendarHeaderStyle()}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Selected Date</div>
              <div style={{ color: 'var(--white)', fontSize: '15px' }}>
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Choose an available date'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCalendarMonth(addMonths(visibleMonth, -1))}
                className="btn-ghost"
                disabled={isBefore(endOfMonth(addMonths(visibleMonth, -1)), today)}
                style={{ minWidth: 'unset', padding: '8px 12px' }}
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setCalendarMonth(addMonths(visibleMonth, 1))}
                className="btn-ghost"
                style={{ minWidth: 'unset', padding: '8px 12px' }}
              >
                Next
              </button>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--white)', marginBottom: '12px' }}>
            {format(visibleMonth, 'MMMM yyyy')}
          </div>

          <div style={calendarGridStyle()}>
            {WEEKDAY_LABELS.map((day) => (
              <div key={day} style={calendarWeekdayStyle()}>{day}</div>
            ))}
            {calendarDays.map((day) => {
              const dateValue = format(day, 'yyyy-MM-dd')
              const isPast = isBefore(day, today)
              const isBlocked = blockedDates.has(dateValue)
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
              const disabled = isPast || isBlocked

              return (
                <button
                  key={dateValue}
                  type="button"
                  onClick={() => set('eventDate', dateValue)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  style={calendarDayStyle({
                    isCurrentMonth: isSameMonth(day, visibleMonth),
                    isDisabled: disabled,
                    isSelected,
                    isBlocked,
                  })}
                >
                  <span>{format(day, 'd')}</span>
                </button>
              )
            })}
          </div>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
          Past dates and dates already used in bookings or admin events are unavailable.
        </span>
        {loadingBlockedDates && <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Loading unavailable dates…</span>}
        {blockedDatesError && <span style={fieldErrorStyle()}>{blockedDatesError}</span>}
        {fieldErrors.eventDate && <span style={fieldErrorStyle()}>{fieldErrors.eventDate}</span>}
      </div>

      <div style={twoColGrid()}>
        <label style={{ display: 'grid', gap: '8px' }}>
          <span className="section-label" style={{ marginBottom: 0 }}>Start Time</span>
          <select
            data-booking-field="eventTime"
            aria-invalid={Boolean(fieldErrors.eventTime)}
            value={normalizeTimeValue(form.eventTime)}
            onChange={(e) => set('eventTime', e.target.value)}
            style={inputStyle(Boolean(fieldErrors.eventTime))}
          >
            <option value="">Select a start time</option>
            {TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {fieldErrors.eventTime && <span style={fieldErrorStyle()}>{fieldErrors.eventTime}</span>}
        </label>
        <label style={{ display: 'grid', gap: '8px' }}>
          <span className="section-label" style={{ marginBottom: 0 }}>End Time</span>
          <select
            data-booking-field="eventEndTime"
            aria-invalid={Boolean(fieldErrors.eventEndTime)}
            value={normalizeTimeValue(form.eventEndTime)}
            onChange={(e) => set('eventEndTime', e.target.value)}
            style={inputStyle(Boolean(fieldErrors.eventEndTime))}
          >
            <option value="">Select an end time</option>
            {getEndTimeOptions(normalizeTimeValue(form.eventTime)).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {fieldErrors.eventEndTime && <span style={fieldErrorStyle()}>{fieldErrors.eventEndTime}</span>}
        </label>
      </div>

      <label style={{ display: 'grid', gap: '8px' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>Event Time Zone *</span>
        <select
          required
          data-booking-field="timeZone"
          aria-invalid={Boolean(fieldErrors.timeZone)}
          value={form.timeZone}
          onChange={(e) => set('timeZone', e.target.value)}
          style={inputStyle(Boolean(fieldErrors.timeZone))}
        >
          {TIME_ZONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {fieldErrors.timeZone && <span style={fieldErrorStyle()}>{fieldErrors.timeZone}</span>}
      </label>

      {availabilityError && (
        <div style={{
          background: 'rgba(232, 93, 117, 0.1)',
          border: '1px solid rgba(232, 93, 117, 0.4)',
          padding: '12px 14px',
          fontSize: '13px',
          color: '#ff8da0',
          lineHeight: 1.6,
        }}>
          <strong style={{ display: 'block', marginBottom: '4px', color: '#e85d75' }}>
            Date / Time Conflict
          </strong>
          {availabilityError}
        </div>
      )}
    </>
  )
}

function ContactStep({
  fieldErrors,
  form,
  set,
}: {
  fieldErrors: FieldErrors
  form: FormState
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <>
      <div style={twoColGrid()}>
        <label style={{ display: 'grid', gap: '8px' }}>
          <span className="section-label" style={{ marginBottom: 0 }}>First Name *</span>
          <input
            required
            name="first_name"
            autoComplete="given-name"
            data-booking-field="firstName"
            aria-invalid={Boolean(fieldErrors.firstName)}
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            style={inputStyle(Boolean(fieldErrors.firstName))}
          />
          {fieldErrors.firstName && <span style={fieldErrorStyle()}>{fieldErrors.firstName}</span>}
        </label>
        <label style={{ display: 'grid', gap: '8px' }}>
          <span className="section-label" style={{ marginBottom: 0 }}>Last Name</span>
          <input
            name="last_name"
            autoComplete="family-name"
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
            name="email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            data-booking-field="email"
            aria-invalid={Boolean(fieldErrors.email)}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            style={inputStyle(Boolean(fieldErrors.email))}
          />
          {fieldErrors.email && <span style={fieldErrorStyle()}>{fieldErrors.email}</span>}
        </label>
        <label style={{ display: 'grid', gap: '8px' }}>
          <span className="section-label" style={{ marginBottom: 0 }}>Phone</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            style={inputStyle()}
          />
        </label>
      </div>
    </>
  )
}

function DetailsStep({
  error,
  fieldErrors,
  form,
  set,
  setCity,
  onEditTimes,
}: {
  error: string
  fieldErrors: FieldErrors
  form: FormState
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  setCity: (value: string) => void
  onEditTimes: () => void
}) {
  const normalizedStart = normalizeTimeValue(form.eventTime)
  const normalizedEnd = normalizeTimeValue(form.eventEndTime)
  const startMin = parseFormTime(normalizedStart)
  const endMin = parseFormTime(normalizedEnd)
  const durationHours = (startMin !== null && endMin !== null && endMin > startMin)
    ? (endMin - startMin) / 60
    : null

  const startLabel = TIME_OPTIONS.find((o) => o.value === normalizedStart)?.label ?? normalizedStart
  const endLabel = TIME_OPTIONS.find((o) => o.value === normalizedEnd)?.label ?? normalizedEnd

  const matchedPkg = PACKAGES.find(
    (pkg) => pkg.price !== null && form.package.startsWith(pkg.name)
  ) as { name: string; price: number; hours: number } | undefined
  const estimatedTotal = durationHours !== null && matchedPkg
    ? durationHours * matchedPkg.price
    : null

  const hasTimes = form.eventTime && form.eventEndTime

  return (
    <>
      <label style={{ display: 'grid', gap: '8px' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>Event Name *</span>
        <input
          required
          name="event_name"
          autoComplete="off"
          data-booking-field="eventName"
          aria-invalid={Boolean(fieldErrors.eventName)}
          value={form.eventName}
          onChange={(e) => set('eventName', e.target.value)}
          style={inputStyle(Boolean(fieldErrors.eventName))}
        />
        {fieldErrors.eventName && <span style={fieldErrorStyle()}>{fieldErrors.eventName}</span>}
      </label>

      <label style={{ display: 'grid', gap: '8px' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>Venue / Address</span>
        <input
          name="venue"
          autoComplete="street-address"
          value={form.venue}
          onChange={(e) => set('venue', e.target.value)}
          placeholder="Venue name or full address…"
          style={inputStyle()}
        />
      </label>

      <label style={{ display: 'grid', gap: '8px' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>City</span>
        <input
          list="city-options"
          name="city"
          autoComplete="address-level2"
          value={form.city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Choose or type any city…"
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
          name="package"
          autoComplete="off"
          value={form.package}
          onChange={(e) => set('package', e.target.value)}
          placeholder="Choose or type a package…"
          style={inputStyle()}
        />
      </label>

      {hasTimes && (
        <div style={{
          border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.03)',
          padding: '16px 18px',
          display: 'grid',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Booking Summary</span>
            <button
              type="button"
              onClick={onEditTimes}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--violet)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Edit times
            </button>
          </div>

          <div style={{ display: 'grid', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '14px' }}>
              <span style={{ color: 'var(--muted)' }}>Time</span>
              <span>{startLabel} → {endLabel}</span>
            </div>

            {durationHours !== null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '14px' }}>
                <span style={{ color: 'var(--muted)' }}>Duration</span>
                <span>
                  {durationHours % 1 === 0
                    ? `${durationHours} hr${durationHours !== 1 ? 's' : ''}`
                    : `${durationHours.toFixed(1)} hrs`}
                </span>
              </div>
            )}

            {estimatedTotal !== null ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '14px' }}>
                <span style={{ color: 'var(--muted)' }}>Estimated Total</span>
                <span style={{ fontFamily: 'Conthrax, sans-serif' }}>
                  {formatCurrency(estimatedTotal)}
                </span>
              </div>
            ) : matchedPkg === undefined && form.package ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '14px' }}>
                <span style={{ color: 'var(--muted)' }}>Rate</span>
                <span style={{ color: 'var(--muted)' }}>Custom — we&apos;ll follow up</span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <label style={{ display: 'grid', gap: '8px' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>Notes</span>
        <textarea
          rows={4}
          name="notes"
          autoComplete="off"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          style={inputStyle()}
        />
      </label>

      {error && (
        <div style={{
          background: 'rgba(232, 93, 117, 0.1)',
          border: '1px solid rgba(232, 93, 117, 0.4)',
          padding: '12px 14px',
          fontSize: '13px',
          color: '#ff8da0',
          lineHeight: 1.6,
        }}>
          {error}
        </div>
      )}
    </>
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

function getFirstErrorField(errors: FieldErrors): FieldKey | null {
  const priority: FieldKey[] = ['eventDate', 'timeZone', 'eventTime', 'eventEndTime', 'firstName', 'email', 'eventName']
  return priority.find((field) => Boolean(errors[field])) ?? null
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

function formatRetryAfter(seconds: number) {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`
  }

  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

function getEndTimeOptions(startValue: string) {
  const startMinutes = parseFormTime(startValue)
  if (startMinutes === null) return TIME_OPTIONS
  return TIME_OPTIONS.filter((option) => {
    const optionMinutes = parseFormTime(option.value)
    return optionMinutes !== null && optionMinutes > startMinutes
  })
}

function buildCalendarDays(month: Date) {
  const start = startOfWeek(startOfMonth(month))
  const end = endOfWeek(endOfMonth(month))
  const days: Date[] = []

  for (let day = start; !isBefore(end, day); day = addDays(day, 1)) {
    days.push(day)
  }

  return days
}

function calendarShellStyle(hasError: boolean): React.CSSProperties {
  return {
    background: 'var(--off-black)',
    border: `1px solid ${hasError ? '#e85d75' : 'var(--border)'}`,
    padding: '14px',
    display: 'grid',
    gap: '12px',
  }
}

function calendarHeaderStyle(): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  }
}

function calendarGridStyle(): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    gap: '8px',
  }
}

function calendarWeekdayStyle(): React.CSSProperties {
  return {
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    textAlign: 'center',
    paddingBottom: '4px',
  }
}

function calendarDayStyle({
  isBlocked,
  isCurrentMonth,
  isDisabled,
  isSelected,
}: {
  isBlocked: boolean
  isCurrentMonth: boolean
  isDisabled: boolean
  isSelected: boolean
}): React.CSSProperties {
  return {
    minHeight: '44px',
    border: `1px solid ${
      isSelected ? 'var(--violet)' : isBlocked ? 'rgba(232, 93, 117, 0.4)' : 'var(--border)'
    }`,
    background: isSelected
      ? 'rgba(155,93,229,0.18)'
      : isBlocked
        ? 'rgba(232, 93, 117, 0.08)'
        : 'var(--surface)',
    color: isDisabled
      ? (isBlocked ? '#ff8da0' : 'var(--muted)')
      : (isCurrentMonth ? 'var(--white)' : 'rgba(255,255,255,0.4)'),
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isCurrentMonth ? 1 : 0.6,
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease, opacity 150ms ease',
  }
}
