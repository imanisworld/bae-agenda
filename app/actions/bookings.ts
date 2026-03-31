'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin-auth'
import { getBookingPaymentStatus } from '@/lib/booking-payment-status'
import { syncBookingDepositState } from '@/lib/booking-deposit-sync'
import {
  getBookingLifecycleStatus,
  getBookingWorkflowPaymentStatus,
  mapLifecycleStatusToLegacyBookingStatus,
  type BookingLifecycleStatus,
  type BookingWorkflowPaymentStatus,
} from '@/lib/booking-workflow'
import {
  getBalanceReminderPayloadFromBooking,
  getConfirmationPayloadFromBooking,
  getDepositReminderPayloadFromBooking,
  getEventReminderPayloadFromBooking,
  getInquiryReceiptPayloadFromBooking,
  type BookingBalanceReminderSource,
  type BookingConfirmationSource,
  type BookingDepositReminderSource,
  type BookingEventReminderSource,
  type BookingInquiryReceiptSource,
} from '@/lib/booking-email-payloads'
import { toEventISO } from '@/lib/date-time'
import { buildInvoiceDraftRecord, type InvoiceDraftSource } from '@/lib/invoice-drafts'
import { sendBookingBalanceReminder, sendBookingConfirmedNotification, sendBookingDepositReminder, sendBookingEventReminder, sendBookingInquiryReceipt, sendW9Notification } from '@/lib/notifications'
import { BOOKING_LIFECYCLE_STATUSES, BOOKING_WORKFLOW_PAYMENT_STATUSES, PAYMENT_METHODS, PAYMENT_TYPES } from '@/lib/constants'
import { generateW9Pdf } from '@/lib/w9-pdf'
import { shouldAutoSendW9ForPayment } from '@/lib/w9-automation'
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

function isBookingLifecycleStatus(value: string): value is BookingLifecycleStatus {
  return BOOKING_LIFECYCLE_STATUSES.includes(value as BookingLifecycleStatus)
}

function isBookingWorkflowPaymentStatus(value: string): value is BookingWorkflowPaymentStatus {
  return BOOKING_WORKFLOW_PAYMENT_STATUSES.includes(value as BookingWorkflowPaymentStatus)
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

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

async function appendBookingTimelineNote(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string,
  body: string
) {
  const { error } = await admin
    .from('notes')
    .insert({
      booking_id: bookingId,
      body,
    })

  if (error) {
    console.error('[booking-note] unable to save timeline note:', error.message)
  }
}

async function getBookingConfirmationSource(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      status,
      event_name,
      event_date,
      event_timezone,
      quote,
      venue,
      city,
      deposit_amount,
      payments(amount, status),
      clients(first_name, last_name, email)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error('[booking-confirmation] unable to load booking:', error)
    return null
  }

  return data as BookingConfirmationSource
}

async function getBookingInquiryReceiptSource(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      event_name,
      event_type,
      event_date,
      event_timezone,
      venue,
      city,
      clients(first_name, last_name, email)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error('[booking-inquiry] unable to load booking:', error)
    return null
  }

  return data as BookingInquiryReceiptSource
}

async function getBookingDepositReminderSource(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      event_name,
      event_date,
      event_timezone,
      deposit_amount,
      clients(first_name, last_name, email),
      payments(amount, status)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error('[booking-deposit] unable to load booking:', error)
    return null
  }

  return data as BookingDepositReminderSource
}

async function getBookingBalanceReminderSource(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      event_name,
      event_date,
      event_timezone,
      quote,
      clients(first_name, last_name, email),
      payments(amount, status)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error('[booking-balance] unable to load booking:', error)
    return null
  }

  return data as BookingBalanceReminderSource
}

async function getBookingEventReminderSource(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      status,
      event_name,
      event_date,
      event_timezone,
      venue,
      city,
      clients(first_name, last_name, email)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error('[booking-event] unable to load booking:', error)
    return null
  }

  return data as BookingEventReminderSource
}

async function getBookingInvoiceDraftSource(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      status,
      event_name,
      event_type,
      event_date,
      event_end_time,
      event_timezone,
      venue,
      city,
      package,
      hours,
      quote,
      deposit_amount,
      notes,
      clients(first_name, last_name, email, phone)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error('[invoice-draft] unable to load booking:', error)
    return null
  }

  return data as unknown as InvoiceDraftSource
}

async function ensureInvoiceDraft(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const booking = await getBookingInvoiceDraftSource(admin, bookingId)
  if (!booking || booking.status !== 'confirmed') return { created: false, updated: false }

  const draft = buildInvoiceDraftRecord(booking)
  const { data: existing, error: existingError } = await admin
    .from('invoices')
    .select('id')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (existingError) {
    console.error('[invoice-draft] unable to check existing invoice:', existingError)
  }

  const { error } = await admin
    .from('invoices')
    .upsert(draft, { onConflict: 'booking_id' })

  if (error) {
    console.error('[invoice-draft] unable to upsert invoice:', error)
    return { created: false, updated: false }
  }

  return { created: !existing?.id, updated: Boolean(existing?.id) }
}

async function getBookingW9Recipient(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      event_name,
      clients(first_name, last_name, email)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error('[booking-w9] unable to load booking:', error)
    return null
  }

  return data as {
    id: string
    event_name: string | null
    clients: Array<{
      first_name: string | null
      last_name: string | null
      email: string | null
    }> | null
  }
}

async function syncInvoicePaymentState(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('quote, payments(amount, status)')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    console.error('[invoice-payment-sync] unable to load booking payments:', bookingError)
    return { paymentStatus: 'unpaid' as const, updatedInvoice: false }
  }

  const paymentStatus = getBookingPaymentStatus(
    booking.quote as number | null,
    (booking.payments as Array<{ amount: number; status: 'pending' | 'received' | 'refunded' }> | null) ?? null
  )

  const nextInvoiceStatus = paymentStatus === 'paid' ? 'paid' : 'draft'
  const payload = nextInvoiceStatus === 'paid'
    ? { status: nextInvoiceStatus, sent_at: new Date().toISOString() }
    : { status: nextInvoiceStatus, sent_at: null }

  const { error: invoiceError } = await admin
    .from('invoices')
    .update(payload)
    .eq('booking_id', bookingId)

  if (invoiceError) {
    console.error('[invoice-payment-sync] unable to sync invoice state:', invoiceError)
    return { paymentStatus, updatedInvoice: false }
  }

  return { paymentStatus, updatedInvoice: true }
}

async function syncBookingWorkflowState(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data: booking, error } = await admin
    .from('bookings')
    .select('status, lifecycle_status, payment_status, quote, deposit_amount, payments(amount, type, status, method)')
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !booking) {
    console.error('[booking-workflow-sync] unable to load booking:', error)
    return null
  }

  const lifecycleStatus = getBookingLifecycleStatus(
    booking.lifecycle_status as BookingLifecycleStatus | null | undefined,
    booking.status as BookingStatus | null | undefined,
  )
  const paymentStatus = getBookingWorkflowPaymentStatus({
    currentStatus: booking.payment_status as BookingWorkflowPaymentStatus | null | undefined,
    quote: booking.quote as number | null | undefined,
    depositAmount: booking.deposit_amount as number | null | undefined,
    lifecycleStatus,
    payments: (booking.payments as Array<{
      amount: number
      type?: string | null
      status: 'pending' | 'received' | 'refunded'
      method?: string | null
    }> | null | undefined) ?? null,
  })

  const { error: updateError } = await admin
    .from('bookings')
    .update({
      lifecycle_status: lifecycleStatus,
      payment_status: paymentStatus,
      status: mapLifecycleStatusToLegacyBookingStatus(lifecycleStatus),
      balance_paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', bookingId)

  if (updateError) {
    console.error('[booking-workflow-sync] unable to update booking:', updateError.message)
    return null
  }

  return { lifecycleStatus, paymentStatus }
}

async function getConfirmationPayloadIfNeeded(admin: ReturnType<typeof createAdminClient>, bookingId: string, nextStatus: BookingStatus) {
  if (nextStatus !== 'confirmed') return null

  const booking = await getBookingConfirmationSource(admin, bookingId)
  if (!booking || booking.status === 'confirmed') return null

  return getConfirmationPayloadFromBooking(booking)
}

async function sendConfirmationIfPresent(payload: Awaited<ReturnType<typeof getConfirmationPayloadIfNeeded>>) {
  if (!payload) return

  const result = await sendBookingConfirmedNotification(payload)
  return result
}

export async function resendBookingConfirmationAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingIdRaw = optionalString(formData.get('booking_id'))

  if (!bookingIdRaw) {
    redirectWithError('/admin/bookings', 'Missing booking id for confirmation email.')
  }

  const bookingId = bookingIdRaw as string
  const booking = await getBookingConfirmationSource(admin, bookingId)
  if (!booking) {
    redirectWithError('/admin/bookings', 'Could not find that booking.')
  }

  const bookingRecord = booking as BookingConfirmationSource

  if (bookingRecord.status !== 'confirmed' && bookingRecord.status !== 'completed') {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Only confirmed bookings can resend the confirmation email.')
  }

  const payload = getConfirmationPayloadFromBooking(bookingRecord)
  if (!payload) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'This booking needs a client email, event name, and timezone before sending.')
  }

  const confirmationPayload = payload as NonNullable<typeof payload>
  const result = await sendBookingConfirmedNotification(confirmationPayload)
  if (!result.ok) {
    redirectWithError(`/admin/bookings/${bookingId}`, result.detail || 'Unable to send confirmation email.')
  }

  await appendBookingTimelineNote(
    admin,
    bookingId,
    `Confirmation email resent to ${confirmationPayload.email}.`
  )

  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent(`Confirmation email sent to ${confirmationPayload.email}.`)}`)
}

export async function resendBookingInquiryReceiptAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingIdRaw = optionalString(formData.get('booking_id'))

  if (!bookingIdRaw) {
    redirectWithError('/admin/bookings', 'Missing booking id for inquiry receipt email.')
  }

  const bookingId = bookingIdRaw as string
  const booking = await getBookingInquiryReceiptSource(admin, bookingId)
  if (!booking) {
    redirectWithError('/admin/bookings', 'Could not find that booking.')
  }

  const payload = getInquiryReceiptPayloadFromBooking(booking as BookingInquiryReceiptSource)
  if (!payload) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'This booking needs a client email, event name, and timezone before sending.')
  }

  const inquiryPayload = payload as NonNullable<typeof payload>
  const result = await sendBookingInquiryReceipt(inquiryPayload)
  if (!result.ok) {
    redirectWithError(`/admin/bookings/${bookingId}`, result.detail || 'Unable to send inquiry receipt email.')
  }

  await appendBookingTimelineNote(
    admin,
    bookingId,
    `Inquiry receipt email resent to ${inquiryPayload.email}.`
  )

  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent(`Inquiry receipt email sent to ${inquiryPayload.email}.`)}`)
}

export async function sendBookingDepositReminderAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingIdRaw = optionalString(formData.get('booking_id'))

  if (!bookingIdRaw) {
    redirectWithError('/admin/bookings', 'Missing booking id for deposit reminder email.')
  }

  const bookingId = bookingIdRaw as string
  const booking = await getBookingDepositReminderSource(admin, bookingId)
  if (!booking) {
    redirectWithError('/admin/bookings', 'Could not find that booking.')
  }

  const payload = getDepositReminderPayloadFromBooking(booking as BookingDepositReminderSource)
  if (!payload) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'This booking does not currently have an outstanding deposit reminder to send.')
  }

  const depositPayload = payload as NonNullable<typeof payload>
  const result = await sendBookingDepositReminder(depositPayload)
  if (!result.ok) {
    redirectWithError(`/admin/bookings/${bookingId}`, result.detail || 'Unable to send deposit reminder email.')
  }

  await appendBookingTimelineNote(
    admin,
    bookingId,
    `Deposit reminder email sent to ${depositPayload.email} for ${depositPayload.depositDue}.`
  )

  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent(`Deposit reminder email sent to ${depositPayload.email}.`)}`)
}

export async function sendBookingBalanceReminderAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingIdRaw = optionalString(formData.get('booking_id'))

  if (!bookingIdRaw) {
    redirectWithError('/admin/bookings', 'Missing booking id for balance reminder email.')
  }

  const bookingId = bookingIdRaw as string
  const booking = await getBookingBalanceReminderSource(admin, bookingId)
  if (!booking) {
    redirectWithError('/admin/bookings', 'Could not find that booking.')
  }

  const payload = getBalanceReminderPayloadFromBooking(booking as BookingBalanceReminderSource)
  if (!payload) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'This booking does not currently have an outstanding balance reminder to send.')
  }

  const balancePayload = payload as NonNullable<typeof payload>
  const result = await sendBookingBalanceReminder(balancePayload)
  if (!result.ok) {
    redirectWithError(`/admin/bookings/${bookingId}`, result.detail || 'Unable to send balance reminder email.')
  }

  await appendBookingTimelineNote(
    admin,
    bookingId,
    `Balance reminder email sent to ${balancePayload.email} for ${balancePayload.balanceDue}.`
  )

  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent(`Balance reminder email sent to ${balancePayload.email}.`)}`)
}

export async function sendBookingEventReminderAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingIdRaw = optionalString(formData.get('booking_id'))

  if (!bookingIdRaw) {
    redirectWithError('/admin/bookings', 'Missing booking id for event reminder email.')
  }

  const bookingId = bookingIdRaw as string
  const booking = await getBookingEventReminderSource(admin, bookingId)
  if (!booking) {
    redirectWithError('/admin/bookings', 'Could not find that booking.')
  }

  const bookingRecord = booking as BookingEventReminderSource
  if (bookingRecord.status !== 'confirmed' && bookingRecord.status !== 'completed') {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Only confirmed bookings can send an event reminder.')
  }

  const payload = getEventReminderPayloadFromBooking(bookingRecord)
  if (!payload) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'This booking needs a client email, event name, and timezone before sending.')
  }

  const eventPayload = payload as NonNullable<typeof payload>
  const result = await sendBookingEventReminder(eventPayload)
  if (!result.ok) {
    redirectWithError(`/admin/bookings/${bookingId}`, result.detail || 'Unable to send event reminder email.')
  }

  await appendBookingTimelineNote(
    admin,
    bookingId,
    `Event reminder email sent to ${eventPayload.email}.`
  )

  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent(`Event reminder email sent to ${eventPayload.email}.`)}`)
}

export async function updateBookingStatusAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  const nextStatusRaw = optionalString(formData.get('next_status'))

  if (!id || !nextStatusRaw || !isBookingStatus(nextStatusRaw)) {
    redirectWithError('/admin/bookings', 'Missing booking update details.')
  }

  const bookingId = id as string
  const nextStatus = nextStatusRaw as BookingStatus
  const confirmationPayload = await getConfirmationPayloadIfNeeded(admin, bookingId, nextStatus)
  const lifecycleStatus = getBookingLifecycleStatus(undefined, nextStatus)
  const nextPaymentStatus: BookingWorkflowPaymentStatus = nextStatus === 'confirmed' ? 'deposit_requested' : 'unpaid'

  const { error } = await admin
    .from('bookings')
    .update({
      status: nextStatus,
      lifecycle_status: lifecycleStatus,
      payment_status: nextPaymentStatus,
    })
    .eq('id', bookingId)

  if (error) {
    redirectWithError('/admin/bookings', error.message || 'Unable to update booking status.')
  }

  const confirmationResult = await sendConfirmationIfPresent(confirmationPayload)
  if (confirmationPayload && confirmationResult?.ok) {
    await appendBookingTimelineNote(
      admin,
      bookingId,
      `Confirmation email sent to ${confirmationPayload.email}.`
    )
  } else if (confirmationResult && !confirmationResult.ok) {
    console.error('[booking-confirmation] email failed:', confirmationResult.reason, confirmationResult.detail ?? '')
  }

  const invoiceDraftResult = await ensureInvoiceDraft(admin, bookingId)
  if (invoiceDraftResult.created) {
    await appendBookingTimelineNote(
      admin,
      bookingId,
      'Invoice draft created automatically when the booking was confirmed.'
    )
  }

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
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

  const bookingId = id as string
  const nextStatus = statusRaw as BookingStatus
  const lifecycleStatusRaw = optionalString(formData.get('lifecycle_status'))
  const paymentWorkflowStatusRaw = optionalString(formData.get('payment_status'))

  const eventDate = toEventISO(eventDateTime!.date, eventTimeZone!, eventDateTime!.time)
  const eventEndTime = eventEndDateTime
    ? toEventISO(eventEndDateTime.date, eventTimeZone!, eventEndDateTime.time)
    : null

  if (!eventDate || (eventEndDateTime && !eventEndTime)) {
    redirectWithError(`/admin/bookings/${id}`, 'Please use a valid event date, time, and timezone.')
  }

  const confirmationPayload = await getConfirmationPayloadIfNeeded(admin, bookingId, nextStatus)
  const lifecycleStatus = lifecycleStatusRaw && isBookingLifecycleStatus(lifecycleStatusRaw)
    ? lifecycleStatusRaw
    : getBookingLifecycleStatus(undefined, nextStatus)
  const paymentWorkflowStatus = paymentWorkflowStatusRaw && isBookingWorkflowPaymentStatus(paymentWorkflowStatusRaw)
    ? paymentWorkflowStatusRaw
    : (nextStatus === 'confirmed' ? 'deposit_requested' : 'unpaid')

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
      status: nextStatus,
      lifecycle_status: lifecycleStatus,
      payment_status: paymentWorkflowStatus,
    })
    .eq('id', bookingId)

  if (error) {
    redirectWithError('/admin/bookings', error.message || 'Unable to update booking.')
  }

  const confirmationResult = await sendConfirmationIfPresent(confirmationPayload)
  if (confirmationPayload && confirmationResult?.ok) {
    await appendBookingTimelineNote(
      admin,
      bookingId,
      `Confirmation email sent to ${confirmationPayload.email}.`
    )
  } else if (confirmationResult && !confirmationResult.ok) {
    console.error('[booking-confirmation] email failed:', confirmationResult.reason, confirmationResult.detail ?? '')
  }

  const invoiceDraftResult = await ensureInvoiceDraft(admin, bookingId)
  if (invoiceDraftResult.created) {
    await appendBookingTimelineNote(
      admin,
      bookingId,
      'Invoice draft created automatically when the booking was confirmed.'
    )
  } else if (invoiceDraftResult.updated) {
    await appendBookingTimelineNote(
      admin,
      bookingId,
      'Invoice draft refreshed to match the latest booking details.'
    )
  }

  await syncBookingDepositState(admin, bookingId)
  await syncBookingWorkflowState(admin, bookingId)

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath(`/admin/bookings/${bookingId}/invoice`)
  revalidatePath('/admin/dashboard')
  redirect(`/admin/bookings/${bookingId}`)
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

  const finalBookingId = bookingId as string
  const finalAmount = amount as number
  const finalType = typeRaw as PaymentType
  const finalStatus = statusRaw as PaymentStatus
  const finalMethod = methodRaw as PaymentMethod | null

  const finalPaidAt = finalStatus === 'received'
    ? paidAt ?? new Date().toISOString()
    : paidAt

  const { error } = await admin
    .from('payments')
    .insert({
      booking_id: finalBookingId,
      amount: finalAmount,
      type: finalType,
      method: finalMethod,
      status: finalStatus,
      paid_at: finalPaidAt,
      notes,
  })

  if (error) {
    redirectWithError(`/admin/bookings/${finalBookingId}`, error.message || 'Unable to record payment.')
  }

  if (shouldAutoSendW9ForPayment(finalAmount, finalStatus)) {
    const booking = await getBookingW9Recipient(admin, finalBookingId)
    const client = booking?.clients?.[0] ?? null
    const clientEmail = client?.email?.trim()
    const eventName = booking?.event_name?.trim()

    if (booking && clientEmail && eventName) {
      const paymentAmount = formatCurrency(finalAmount)

      try {
        const pdf = await generateW9Pdf()
        const result = await sendW9Notification({
          to: clientEmail,
          clientName: [client?.first_name?.trim(), client?.last_name?.trim()].filter(Boolean).join(' '),
          eventName,
          paymentAmount,
          pdfBase64: pdf.toString('base64'),
          pdfFilename: 'DJ-BAE-W9.pdf',
        })

        if (result.ok) {
          await appendBookingTimelineNote(
            admin,
            finalBookingId,
            `W-9 email sent to ${clientEmail} after recording a ${paymentAmount} payment.`
          )
        } else {
          console.error('[booking-w9] email failed:', result.reason, result.detail ?? '')
          await appendBookingTimelineNote(
            admin,
            finalBookingId,
            'W-9 email could not be sent automatically after payment logging.'
          )
        }
      } catch (w9Error) {
        console.error('[booking-w9] unexpected error:', w9Error)
        await appendBookingTimelineNote(
          admin,
          finalBookingId,
          'W-9 email could not be generated automatically after payment logging.'
        )
      }
    }
  }

  const invoicePaymentState = await syncInvoicePaymentState(admin, finalBookingId)
  await syncBookingDepositState(admin, finalBookingId)
  await syncBookingWorkflowState(admin, finalBookingId)
  if (invoicePaymentState.paymentStatus === 'paid') {
    await appendBookingTimelineNote(
      admin,
      finalBookingId,
      'Booking balance is now fully paid.'
    )
  }

  revalidatePath(`/admin/bookings/${finalBookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/payments')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/admin/bookings/${finalBookingId}/invoice`)
  redirect(`/admin/bookings/${finalBookingId}`)
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
