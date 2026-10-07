import { describe, expect, it } from 'vitest'
import {
  bookingSourceContextValue,
  bookingVibeSourceLabel,
  parseBookingSourceContext,
} from './booking-source-context'

describe('booking source context', () => {
  it('accepts only known vibe ids', () => {
    expect(parseBookingSourceContext('vibe:open-format')).toEqual({ kind: 'vibe', id: 'open-format' })
    expect(parseBookingSourceContext('vibe:not-real')).toBeNull()
  })

  it('accepts portfolio UUIDs and rejects arbitrary values', () => {
    expect(parseBookingSourceContext('portfolio:32e3ffb0-3e3c-40a9-9e45-ae0a0acdd2fb')).toEqual({
      kind: 'portfolio',
      id: '32e3ffb0-3e3c-40a9-9e45-ae0a0acdd2fb',
    })
    expect(parseBookingSourceContext('portfolio:../../admin')).toBeNull()
    expect(parseBookingSourceContext('whatever')).toBeNull()
  })

  it('round-trips validated context and exposes stable vibe labels', () => {
    const context = parseBookingSourceContext('vibe:rnb')
    expect(bookingSourceContextValue(context)).toBe('vibe:rnb')
    expect(bookingVibeSourceLabel('rnb')).toBe('90s + 2000s R&B')
  })
})
