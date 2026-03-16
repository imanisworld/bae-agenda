import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingNotifications } from '@/lib/notifications'

const bookingSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional().or(z.literal('')),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  eventName: z.string().trim().min(2).max(160),
  eventType: z.string().trim().max(80).optional().or(z.literal('')),
  eventDate: z.string().trim().min(1),
  eventTime: z.string().trim().max(20).optional().or(z.literal('')),
  timeZone: z.string().trim().min(1).max(80),
  venue: z.string().trim().max(160).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  package: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
})

function normalizeOptional(value?: string): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
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

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

function toEventISO(dateValue: string, timeZone: string, timeValue?: string): string | null {
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

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as unknown
    const parsed = bookingSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check your form fields and try again.' },
        { status: 400 }
      )
    }

    const payload = parsed.data
    const eventISO = toEventISO(payload.eventDate, payload.timeZone, payload.eventTime)
    if (!eventISO) {
      return NextResponse.json(
        { error: 'Invalid event date, time, or timezone.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const normalizedEmail = payload.email.toLowerCase().trim()

    const { data: existingClient, error: clientLookupError } = await supabase
      .from('clients')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (clientLookupError) {
      return NextResponse.json({ error: 'Could not process booking request.' }, { status: 500 })
    }

    let clientId: string

    if (existingClient?.id) {
      clientId = existingClient.id
      const { error: updateClientError } = await supabase
        .from('clients')
        .update({
          first_name: payload.firstName,
          last_name: normalizeOptional(payload.lastName),
          phone: normalizeOptional(payload.phone),
        })
        .eq('id', clientId)

      if (updateClientError) {
        return NextResponse.json({ error: 'Could not process booking request.' }, { status: 500 })
      }
    } else {
      const { data: createdClient, error: createClientError } = await supabase
        .from('clients')
        .insert({
          first_name: payload.firstName,
          last_name: normalizeOptional(payload.lastName),
          email: normalizedEmail,
          phone: normalizeOptional(payload.phone),
        })
        .select('id')
        .single()

      if (createClientError || !createdClient?.id) {
        return NextResponse.json({ error: 'Could not process booking request.' }, { status: 500 })
      }

      clientId = createdClient.id
    }

    const { error: bookingError } = await supabase
      .from('bookings')
      .insert({
        client_id: clientId,
        event_name: payload.eventName,
        event_type: normalizeOptional(payload.eventType),
        event_date: eventISO,
        event_timezone: payload.timeZone.trim(),
        venue: normalizeOptional(payload.venue),
        city: normalizeOptional(payload.city),
        package: normalizeOptional(payload.package),
        status: 'inquiry',
        notes: normalizeOptional(payload.notes),
      })

    if (bookingError) {
      return NextResponse.json({ error: 'Could not process booking request.' }, { status: 500 })
    }

    await sendBookingNotifications({
      firstName: payload.firstName,
      lastName: normalizeOptional(payload.lastName),
      email: normalizedEmail,
      phone: normalizeOptional(payload.phone),
      eventName: payload.eventName,
      eventType: normalizeOptional(payload.eventType),
      eventDate: eventISO,
      eventTimeZone: payload.timeZone.trim(),
      venue: normalizeOptional(payload.venue),
      city: normalizeOptional(payload.city),
      packageName: normalizeOptional(payload.package),
      notes: normalizeOptional(payload.notes),
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 })
  }
}
