export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

function parseDateParts(dateValue: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null
  }

  return { year, month, day }
}

function parseTimeParts(timeValue?: string) {
  if (!timeValue?.trim()) return { hour: 12, minute: 0 }

  const match = /^(\d{2}):(\d{2})$/.exec(timeValue.trim())
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }

  return { hour, minute }
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(date)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  }
}

export function toEventISO(dateValue: string, timeZone: string, timeValue?: string): string | null {
  const dateParts = parseDateParts(dateValue)
  const timeParts = parseTimeParts(timeValue)
  if (!dateParts || !timeParts || !isValidTimeZone(timeZone)) return null

  const desiredUtc = Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hour,
    timeParts.minute
  )

  const guess = new Date(desiredUtc)
  const zoned = getTimeZoneParts(guess, timeZone)
  const zonedUtc = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute
  )

  const corrected = new Date(desiredUtc + (desiredUtc - zonedUtc))
  const verified = getTimeZoneParts(corrected, timeZone)

  if (
    verified.year !== dateParts.year ||
    verified.month !== dateParts.month ||
    verified.day !== dateParts.day ||
    verified.hour !== timeParts.hour ||
    verified.minute !== timeParts.minute
  ) {
    return null
  }

  return corrected.toISOString()
}

export function formatEventDate(iso: string | null, timeZone: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—'

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(timeZone ? { timeZone } : {}),
    ...options,
  })
}

export function formatEventTime(iso: string | null, timeZone: string | null) {
  if (!iso) return null

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(timeZone ? { timeZone } : {}),
  })
}

export function formatEventTimeRange(
  startIso: string | null,
  endIso: string | null,
  timeZone: string | null
) {
  const start = formatEventTime(startIso, timeZone)
  const end = formatEventTime(endIso, timeZone)

  if (start && end) return `${start} - ${end}`
  return start ?? end ?? null
}
