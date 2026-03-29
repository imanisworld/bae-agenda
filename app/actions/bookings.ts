'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin-auth'
import { toEventISO } from '@/lib/date-time'
import { PAYMENT_METHODS, PAYMENT_TYPES } from '@/lib/constants'
import type { BookingStatus, PaymentMethod, PaymentStatus, PaymentType } from '@/types/index'

function redirectWithError(path: string, message: string) {
  const params = new URLSearchParams({ error: message })
  redirect(`${path}?${params.toString()}`)
}

function optionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function isBookingStatus(value: string): value is BookingStatus {
  return ['inquiry', 'confirmed', 'completed', 'cancelled'].includes(value)
}

function parseDateTimeLocal(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || value.trim().length === 0) return null

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim())
  if (!match) return null

  return {
    date: `${match[1]}-${match[2]}-${match[3]}`,
    time: `${match[4]}:${match[5]}`,
  }
}

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function isPaymentType(value: string): value is PaymentType {
  return PAYMENT_TYPES.includes(value as PaymentType)
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod)
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return ['pending', 'received', 'refunded'].includes(value)
}

function parseOptionalDate(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.toISOString()
}

export async function updateBookingStatusAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  const nextStatusRaw = optionalString(formData.get('next_status'))

  if (!id || !nextStatusRaw || !isBookingStatus(nextStatusRaw)) {
    redirectWithError('/admin/bookings', 'Missing booking update details.')
  }

  const { error } = await admin
    .from('bookings')
    .update({ status: nextStatusRaw })
    .eq('id', id)

  if (error) {
    redirectWithError('/admin/bookings', error.message || 'Unable to update booking status.')
  }

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  redirect('/admin/bookings')
}

export async function updateBookingDetailsAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  const eventName = optionalString(formData.get('event_name'))
  const eventTimeZone = optionalString(formData.get('event_timezone'))
  const statusRaw = optionalString(formData.get('status'))
  const eventDateTime = parseDateTimeLocal(formData.get('event_date'))
  const eventEndDateTime = parseDateTimeLocal(formData.get('event_end_time'))

  if (!id || !eventName || !eventTimeZone || !statusRaw || !eventDateTime || !isBookingStatus(statusRaw)) {
    redirectWithError('/admin/bookings', 'Booking name, date, timezone, and status are required.')
  }

  const eventDate = toEventISO(eventDateTime!.date, eventTimeZone!, eventDateTime!.time)
  const eventEndTime = eventEndDateTime
    ? toEventISO(eventEndDateTime.date, eventTimeZone!, eventEndDateTime.time)
    : null

  if (!eventDate || (eventEndDateTime && !eventEndTime)) {
    redirectWithError(`/admin/bookings/${id}`, 'Please use a valid event date, time, and timezone.')
  }

  const { error } = await admin
    .from('bookings')
    .update({
      event_name: eventName,
      event_type: optionalString(formData.get('event_type')),
      event_date: eventDate,
      event_end_time: eventEndTime,
      event_timezone: eventTimeZone,
      venue: optionalString(formData.get('venue')),
      city: optionalString(formData.get('city')),
      package: optionalString(formData.get('package')),
      hours: parseOptionalNumber(formData.get('hours')),
      quote: parseOptionalNumber(formData.get('quote')),
      deposit_amount: parseOptionalNumber(formData.get('deposit_amount')),
      notes: optionalString(formData.get('notes')),
      status: statusRaw,
    })
    .eq('id', id)

  if (error) {
    redirectWithError('/admin/bookings', error.message || 'Unable to update booking.')
  }

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${id}`)
  revalidatePath('/admin/dashboard')
  redirect(`/admin/bookings/${id}`)
}

interface BookingEventSource {
  id: string
  event_name: string
  event_date: string
  venue: string | null
  city: string | null
  notes: string | null
  status: BookingStatus
}

export async function createEventFromBookingAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))

  if (!bookingId) {
    redirectWithError('/admin/bookings', 'Missing booking id.')
  }

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('id, event_name, event_date, venue, city, notes, status')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    redirectWithError('/admin/bookings', 'Could not find that booking.')
  }

  const source = booking as BookingEventSource

  if (source.status !== 'confirmed' && source.status !== 'completed') {
    redirectWithError('/admin/bookings', 'Only confirmed bookings can be turned into events.')
  }

  const { data: existingEvent, error: existingEventError } = await admin
    .from('events')
    .select('id')
    .eq('title', source.event_name)
    .eq('event_date', source.event_date)
    .limit(1)
    .maybeSingle()

  if (existingEventError) {
    redirectWithError('/admin/bookings', 'Could not verify whether this booking already has an event.')
  }

  if (existingEvent?.id) {
    redirect(`/admin/events/${existingEvent.id}`)
  }

  const { data: createdEvent, error: createError } = await admin
    .from('events')
    .insert({
      title: source.event_name,
      event_date: source.event_date,
      venue: source.venue,
      city: source.city,
      description: source.notes,
      public: false,
      featured: false,
    })
    .select('id')
    .single()

  if (createError || !createdEvent?.id) {
    redirectWithError('/admin/bookings', createError?.message || 'Unable to create event from booking.')
    return
  }

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/events')
  revalidatePath('/admin/dashboard')
  revalidatePath('/events')
  revalidatePath('/')
  redirect(`/admin/events/${createdEvent.id}`)
}

export async function createBookingPaymentAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))
  const amount = parseOptionalNumber(formData.get('amount'))
  const typeRaw = optionalString(formData.get('type'))
  const methodRaw = optionalString(formData.get('method'))
  const statusRaw = optionalString(formData.get('status'))
  const paidAt = parseOptionalDate(formData.get('paid_at'))
  const notes = optionalString(formData.get('notes'))

  if (!bookingId || amount === null || amount <= 0 || !typeRaw || !statusRaw) {
    redirectWithError('/admin/payments', 'Booking, amount, payment type, and status are required.')
  }

  if (!isPaymentType(typeRaw!) || !isPaymentStatus(statusRaw!)) {
    redirectWithError('/admin/payments', 'Invalid payment details.')
  }

  if (methodRaw && !isPaymentMethod(methodRaw)) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Invalid payment method.')
  }

  const finalPaidAt = statusRaw === 'received'
    ? paidAt ?? new Date().toISOString()
    : paidAt

  const { error } = await admin
    .from('payments')
    .insert({
      booking_id: bookingId,
      amount,
      type: typeRaw,
      method: methodRaw,
      status: statusRaw,
      paid_at: finalPaidAt,
      notes,
    })

  if (error) {
    redirectWithError(`/admin/bookings/${bookingId}`, error.message || 'Unable to record payment.')
  }

  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/payments')
  revalidatePath('/admin/dashboard')
  redirect(`/admin/bookings/${bookingId}`)
}

export async function createBookingNoteAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))
  const clientId = optionalString(formData.get('client_id'))
  const body = optionalString(formData.get('body'))

  if (!bookingId || !body) {
    redirectWithError('/admin/bookings', 'A note body is required.')
  }

  const { error } = await admin
    .from('notes')
    .insert({
      booking_id: bookingId,
      client_id: clientId,
      body,
    })

  if (error) {
    redirectWithError(`/admin/bookings/${bookingId}`, error.message || 'Unable to save note.')
  }

  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  redirect(`/admin/bookings/${bookingId}`)
}
