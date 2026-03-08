import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const bookingSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional().or(z.literal('')),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  eventName: z.string().trim().min(2).max(160),
  eventType: z.string().trim().max(80).optional().or(z.literal('')),
  eventDate: z.string().trim().min(1),
  eventTime: z.string().trim().max(20).optional().or(z.literal('')),
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

function toEventISO(dateValue: string, timeValue?: string): string | null {
  const normalizedTime = timeValue?.trim() ? `${timeValue.trim()}:00` : '12:00:00'
  const parsed = new Date(`${dateValue}T${normalizedTime}`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
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
    const eventISO = toEventISO(payload.eventDate, payload.eventTime)
    if (!eventISO) {
      return NextResponse.json(
        { error: 'Invalid event date.' },
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
        venue: normalizeOptional(payload.venue),
        city: normalizeOptional(payload.city),
        package: normalizeOptional(payload.package),
        status: 'inquiry',
        notes: normalizeOptional(payload.notes),
      })

    if (bookingError) {
      return NextResponse.json({ error: 'Could not process booking request.' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 })
  }
}
