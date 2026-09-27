'use client'

import { useState } from 'react'
import {
  EVENT_CITY_OPTIONS,
  EVENT_TIMEZONE_OPTIONS,
  suggestEventTimeZone,
} from '@/lib/event-form-options'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--off-black)',
  border: '1px solid var(--border)',
  color: 'var(--white)',
  padding: '11px 13px',
  fontSize: '13px',
  fontFamily: 'DM Sans, sans-serif',
}

interface EventLocationFieldsProps {
  initialVenue?: string
  initialCity?: string
  initialTimeZone?: string
  legacyTimeZone?: boolean
}

export default function EventLocationFields({
  initialVenue = '',
  initialCity = '',
  initialTimeZone = '',
  legacyTimeZone = false,
}: EventLocationFieldsProps) {
  const [city, setCity] = useState(initialCity)
  const [timeZone, setTimeZone] = useState(initialTimeZone)
  const [timeZoneTouched, setTimeZoneTouched] = useState(Boolean(initialTimeZone) && !legacyTimeZone)

  const applyCitySuggestion = () => {
    if (timeZoneTouched) return

    const suggestion = suggestEventTimeZone(city)
    if (suggestion) {
      setTimeZone(suggestion)
      return
    }

    if (city.trim()) setTimeZone('')
  }

  return (
    <>
      <div className="admin-form-grid-two">
        <label style={{ display: 'grid', gap: '7px' }}>
          <span className="admin-section-title">Venue / Address</span>
          <input
            name="venue"
            defaultValue={initialVenue}
            placeholder="Venue name or street address"
            autoComplete="street-address"
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'grid', gap: '7px' }}>
          <span className="admin-section-title">City</span>
          <input
            name="city"
            list="event-city-options"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            onBlur={applyCitySuggestion}
            placeholder="Choose or type any city"
            autoComplete="address-level2"
            style={inputStyle}
          />
        </label>
      </div>

      <label style={{ display: 'grid', gap: '7px' }}>
        <span className="admin-section-title">Event Time Zone *</span>
        <input
          name="event_timezone"
          list="event-timezone-options"
          required
          value={timeZone}
          onChange={(event) => {
            setTimeZone(event.target.value)
            setTimeZoneTouched(true)
          }}
          placeholder="e.g. America/Indiana/Indianapolis"
          autoComplete="off"
          style={inputStyle}
        />
        <span style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: 1.5 }}>
          Known cities fill this automatically. Override it whenever the event uses a different local time zone.
        </span>
        {legacyTimeZone && (
          <span style={{ color: 'var(--gold)', fontSize: '11px', lineHeight: 1.5 }}>
            This older event has no saved time zone. Review its date, start time, and time zone before saving.
          </span>
        )}
      </label>

      <datalist id="event-city-options">
        {EVENT_CITY_OPTIONS.map((option) => <option key={option} value={option} />)}
      </datalist>
      <datalist id="event-timezone-options">
        {EVENT_TIMEZONE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </datalist>
    </>
  )
}
