import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingNotifications } from '@/lib/notifications'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { toEventISO } from '@/lib/date-time'
import { createRequestId, logError } from '@/lib/monitoring'

const bookingSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional().or(z.literal('')),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  eventName: z.string().trim().min(2).max(160),
  eventType: z.string().trim().max(80).optional().or(z.literal('')),
  eventDate: z.string().trim().min(1),
  eventTime: z.string().trim().max(20).optional().or(z.literal('')),
  eventEndTime: z.string().trim().max(20).optional().or(z.literal('')),
  timeZone: z.string().trim().min(1).max(80),
  venue: z.string().trim().max(160).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  package: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  website: z.string().trim().max(200).optional().or(z.literal('')),
  startedAt: z.string().trim().max(30).optional().or(z.literal('')),
  turnstileToken: z.string().trim().max(2048).optional().or(z.literal('')),
})

async function verifyTurnstileToken(token: string, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { ok: true, configured: false }

  if (!token.trim()) {
    return { ok: false, configured: true }
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }).toString(),
    })

    if (!response.ok) return { ok: false, configured: true }

    const data = (await response.json()) as { success?: boolean }
    return { ok: Boolean(data.success), configured: true }
  } catch {
    return { ok: false, configured: true }
  }
}

const BOOKING_WINDOW_MS = 15 * 60 * 1000
const BOOKING_LIMIT = 5
const MIN_SUBMIT_MS = 1500

function normalizeOptional(value?: string): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export async function POST(request: Request) {
  const requestId = createRequestId()
  try {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (origin && host) {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return NextResponse.json({ error: 'Invalid submission origin.' }, { status: 403 })
      }
    }

    const clientIp = getClientIp(request.headers)
    const rateLimit = checkRateLimit(`booking:${clientIp}`, BOOKING_LIMIT, BOOKING_WINDOW_MS)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many booking requests. Please wait a few minutes and try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      )
    }

    const json = (await request.json()) as unknown
    const parsed = bookingSchema.safeParse(json)

    if (!parsed.success) {
      const fields = parsed.error.issues
        .map((issue) => issue.path[0])
        .filter((field): field is string => typeof field === 'string')

      return NextResponse.json(
        { error: 'Please check the highlighted form fields and try again.', fields },
        { status: 400 }
      )
    }

    const payload = parsed.data
    if (payload.website?.trim()) {
      return NextResponse.json({ success: true }, { status: 201 })
    }

    const startedAtMs = Number(payload.startedAt)
    if (
      payload.startedAt &&
      Number.isFinite(startedAtMs) &&
      startedAtMs > 0 &&
      Date.now() - startedAtMs < MIN_SUBMIT_MS
    ) {
      return NextResponse.json(
        { error: 'Submission blocked. Please try again.' },
        { status: 400 }
      )
    }

    const turnstile = await verifyTurnstileToken(payload.turnstileToken ?? '', clientIp)
    if (!turnstile.ok && turnstile.configured) {
      return NextResponse.json(
        { error: 'Verification failed. Please try again.' },
        { status: 400 }
      )
    }

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

    const endTimeISO = payload.eventEndTime
      ? toEventISO(payload.eventDate, payload.timeZone, payload.eventEndTime)
      : null

    const { error: bookingError } = await supabase
      .from('bookings')
      .insert({
        client_id: clientId,
        event_name: payload.eventName,
        event_type: normalizeOptional(payload.eventType),
        event_date: eventISO,
        event_end_time: endTimeISO,
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

    return NextResponse.json({ success: true, requestId }, { status: 201, headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    logError('Booking route failed', error, { requestId, route: '/api/booking' })
    return NextResponse.json({ error: 'Unexpected server error.', requestId }, { status: 500, headers: { 'X-Request-Id': requestId } })
  }
}
