export const BOOKING_VIBE_SOURCES = {
  rnb: '90s + 2000s R&B',
  'girls-night': 'Girls’ Night',
  cookout: 'Cookout / Day Party',
  grown: 'Grown & Sexy',
  'open-format': 'Open Format',
  'global-club': 'Global / Club',
} as const

export type BookingSourceContext =
  | { kind: 'vibe'; id: keyof typeof BOOKING_VIBE_SOURCES }
  | { kind: 'portfolio'; id: string }

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function parseBookingSourceContext(value: string | null | undefined): BookingSourceContext | null {
  const raw = value?.trim()
  if (!raw) return null

  if (raw.startsWith('vibe:')) {
    const id = raw.slice(5) as keyof typeof BOOKING_VIBE_SOURCES
    return id in BOOKING_VIBE_SOURCES ? { kind: 'vibe', id } : null
  }

  if (raw.startsWith('portfolio:')) {
    const id = raw.slice(10)
    return UUID_PATTERN.test(id) ? { kind: 'portfolio', id } : null
  }

  return null
}

export function bookingSourceContextValue(context: BookingSourceContext | null) {
  if (!context) return ''
  return `${context.kind}:${context.id}`
}

export function bookingVibeSourceLabel(id: keyof typeof BOOKING_VIBE_SOURCES) {
  return BOOKING_VIBE_SOURCES[id]
}
