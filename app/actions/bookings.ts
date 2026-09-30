'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPrimaryBookingClient } from '@/lib/booking-client'
import { getOutstandingBalance, getOutstandingDeposit } from '@/lib/booking-finance'
import { stampBookingEmailSentAt } from '@/lib/booking-email-tracking'
import { syncComputedBookingPaymentState } from '@/lib/booking-payment-sync'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin-auth'
import { sendBookingPostEventFollowUpEmail, sendBookingReviewRequestEmail } from '@/lib/booking-email-workflows'
import { getBookingPaymentStatus } from '@/lib/booking-payment-status'
import { syncBookingDepositState } from '@/lib/booking-deposit-sync'
import {
  assertValidLifecycleTransition,
  getBookingLifecycleStatus,
  getBookingWorkflowPaymentStatus,
  mapLifecycleStatusToLegacyBookingStatus,
  type BookingLifecycleStatus,
} from '@/lib/booking-workflow'
import { logBookingActivity } from '@/lib/booking-activity'
import {
  getBalanceReminderPayloadFromBooking,
  getConfirmationPayloadFromBooking,
  getInquiryReceiptPayloadFromBooking,
  getPostEventFollowUpPayloadFromBooking,
  getReviewRequestPayloadFromBooking,
  type BookingBalanceReminderSource,
  type BookingConfirmationSource,
  type BookingInquiryReceiptSource,
  type BookingPostEventFollowUpSource,
  type BookingReviewRequestSource,
} from '@/lib/booking-email-payloads'
import { isValidTimeZone, toEventISO } from '@/lib/date-time'
import { suggestEventTimeZone } from '@/lib/event-form-options'
import { buildInvoiceDraftRecord, type InvoiceDraftSource } from '@/lib/invoice-drafts'
import { sendBookingBalanceReminder, sendBookingConfirmedNotification, sendBookingInquiryReceipt, sendW9Notification } from '@/lib/notifications'
import { BOOKING_LIFECYCLE_STATUSES, PAYMENT_METHODS, PAYMENT_TYPES } from '@/lib/constants'
import { generateW9Pdf } from '@/lib/w9-pdf'
import { shouldAutoSendW9ForPayment } from '@/lib/w9-automation'
import type { BookingStatus, PaymentMethod, PaymentStatus, PaymentType } from '@/types/index'

type PortalRequestStatus = 'new' | 'reviewed' | 'resolved'

function redirectWithError(path: string, message: string): never {
  const params = new URLSearchParams({ error: message })
  redirect(`${path}?${params.toString()}`)
}

function optionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function actionAttemptReference(prefix: string, bookingId: string, value: FormDataEntryValue | null) {
  const attemptId = optionalString(value)
  if (!attemptId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId)) {
    return null
  }

  return `${prefix}:${bookingId}:${attemptId}`
}

async function findPaymentByExternalReference(
  admin: ReturnType<typeof createAdminClient>,
  externalReference: string
) {
  const { data } = await admin
    .from('payments')
    .select('id')
    .eq('external_reference', externalReference)
    .maybeSingle()

  return data?.id ?? null
}

function isBookingStatus(value: string): value is BookingStatus {
  return ['inquiry', 'confirmed', 'completed', 'cancelled'].includes(value)
}

function isBookingLifecycleStatus(value: string): value is BookingLifecycleStatus {
  return BOOKING_LIFECYCLE_STATUSES.includes(value as BookingLifecycleStatus)
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

function addCalendarDay(dateValue: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue)
  if (!match) return null

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (Number.isNaN(date.getTime())) return null
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
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

function isPortalRequestStatus(value: string): value is PortalRequestStatus {
  return ['new', 'reviewed', 'resolved'].includes(value)
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

function listMissingFields(fields: Array<{ label: string; present: boolean }>) {
  return fields.filter((field) => !field.present).map((field) => field.label)
}

function formatMissingFieldsMessage(actionLabel: string, missingFields: string[]) {
  if (missingFields.length === 0) return null
  return `${actionLabel} is blocked. Missing: ${missingFields.join(', ')}.`
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

async function getBookingPostEventFollowUpSource(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
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
    console.error('[booking-follow-up] unable to load booking:', error)
    return null
  }

  return data as BookingPostEventFollowUpSource
}

async function getBookingReviewRequestSource(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      status,
      event_name,
      event_date,
      event_timezone,
      clients(first_name, last_name, email)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error('[booking-review-request] unable to load booking:', error)
    return null
  }

  return data as BookingReviewRequestSource
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
    clients: {
      first_name: string | null
      last_name: string | null
      email: string | null
    } | Array<{
      first_name: string | null
      last_name: string | null
      email: string | null
    }> | null
  }
}

async function syncInvoicePaymentState(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const [{ data: booking, error: bookingError }, { data: invoice, error: invoiceLookupError }] = await Promise.all([
    admin
      .from('bookings')
      .select('quote, payments(amount, status)')
      .eq('id', bookingId)
      .maybeSingle(),
    admin
      .from('invoices')
      .select('status, sent_at, total_amount')
      .eq('booking_id', bookingId)
      .maybeSingle(),
  ])

  if (bookingError || !booking) {
    console.error('[invoice-payment-sync] unable to load booking payments:', bookingError)
    return { paymentStatus: 'unpaid' as const, updatedInvoice: false }
  }

  if (invoiceLookupError) {
    console.error('[invoice-payment-sync] unable to load invoice state:', invoiceLookupError)
  }

  const payments = (booking.payments as Array<{ amount: number; status: 'pending' | 'received' | 'refunded' }> | null) ?? null
  const paymentStatus = getBookingPaymentStatus(
    booking.quote as number | null,
    payments
  )

  if (!invoice) {
    return { paymentStatus, updatedInvoice: false }
  }

  const invoiceTotal = Number(invoice.total_amount ?? booking.quote ?? 0)
  const invoicePaymentStatus = getBookingPaymentStatus(invoiceTotal, payments)
  const invoiceBalance = getOutstandingBalance(invoiceTotal, payments)
  const currentStatus = invoice.status as 'draft' | 'sent' | 'paid' | 'void'
  const nextStatus =
    currentStatus === 'void'
      ? 'void'
      : invoicePaymentStatus === 'paid'
        ? 'paid'
        : currentStatus === 'sent'
          ? 'sent'
          : 'draft'

  const { error: invoiceError } = await admin
    .from('invoices')
    .update({
      status: nextStatus,
      balance_due: invoiceBalance,
      sent_at: invoice.sent_at ?? null,
    })
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
    .select('status, lifecycle_status, quote, deposit_amount, last_balance_reminder_sent_at, payments(amount, type, status, method)')
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
    quote: booking.quote as number | null | undefined,
    depositAmount: booking.deposit_amount as number | null | undefined,
    lifecycleStatus,
    payments: (booking.payments as Array<{
      amount: number
      type?: string | null
      status: 'pending' | 'received' | 'refunded'
      method?: string | null
    }> | null | undefined) ?? null,
    lastBalanceReminderSentAt: booking.last_balance_reminder_sent_at as string | null | undefined,
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
  const emailReference = actionAttemptReference('email-confirmation', bookingId, formData.get('email_attempt_id'))
  if (!emailReference) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Refresh the page and try sending the confirmation email again.')
  }
  const booking = await getBookingConfirmationSource(admin, bookingId)
  if (!booking) {
    redirectWithError('/admin/bookings', 'Could not find that booking.')
  }

  const bookingRecord = booking as BookingConfirmationSource

  if (bookingRecord.status !== 'confirmed' && bookingRecord.status !== 'completed') {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Only confirmed bookings can resend the confirmation email.')
  }

  const confirmationClient = getPrimaryBookingClient(bookingRecord.clients)
  const confirmationMissing = listMissingFields([
    { label: 'client email', present: Boolean(confirmationClient?.email?.trim()) },
    { label: 'event name', present: Boolean(bookingRecord.event_name?.trim()) },
    { label: 'timezone', present: Boolean(bookingRecord.event_timezone?.trim()) },
  ])
  const confirmationMissingMessage = formatMissingFieldsMessage('Confirmation email', confirmationMissing)
  if (confirmationMissingMessage) {
    redirectWithError(`/admin/bookings/${bookingId}`, confirmationMissingMessage)
  }

  const payload = getConfirmationPayloadFromBooking(bookingRecord)
  if (!payload) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Confirmation email could not be prepared from this booking record.')
  }

  const confirmationPayload = payload as NonNullable<typeof payload>
  const result = await sendBookingConfirmedNotification(confirmationPayload, {
    idempotencyKey: emailReference,
  })
  if (!result.ok) {
    redirectWithError(`/admin/bookings/${bookingId}`, result.detail || 'Unable to send confirmation email.')
  }

  await stampBookingEmailSentAt(admin, bookingId, 'confirmation_email_sent_at')

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
  const emailReference = actionAttemptReference('email-inquiry-receipt', bookingId, formData.get('email_attempt_id'))
  if (!emailReference) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Refresh the page and try sending the inquiry receipt again.')
  }
  const booking = await getBookingInquiryReceiptSource(admin, bookingId)
  if (!booking) {
    redirectWithError('/admin/bookings', 'Could not find that booking.')
  }

  const inquiryClient = getPrimaryBookingClient((booking as BookingInquiryReceiptSource).clients)
  const inquiryMissing = listMissingFields([
    { label: 'client email', present: Boolean(inquiryClient?.email?.trim()) },
    { label: 'event name', present: Boolean((booking as BookingInquiryReceiptSource).event_name?.trim()) },
    { label: 'timezone', present: Boolean((booking as BookingInquiryReceiptSource).event_timezone?.trim()) },
  ])
  const inquiryMissingMessage = formatMissingFieldsMessage('Inquiry receipt', inquiryMissing)
  if (inquiryMissingMessage) {
    redirectWithError(`/admin/bookings/${bookingId}`, inquiryMissingMessage)
  }

  const payload = getInquiryReceiptPayloadFromBooking(booking as BookingInquiryReceiptSource)
  if (!payload) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Inquiry receipt could not be prepared from this booking record.')
  }

  const inquiryPayload = payload as NonNullable<typeof payload>
  const result = await sendBookingInquiryReceipt(inquiryPayload, {
    idempotencyKey: emailReference,
  })
  if (!result.ok) {
    redirectWithError(`/admin/bookings/${bookingId}`, result.detail || 'Unable to send inquiry receipt email.')
  }

  await stampBookingEmailSentAt(admin, bookingId, 'inquiry_receipt_sent_at')

  await appendBookingTimelineNote(
    admin,
    bookingId,
    `Inquiry receipt email resent to ${inquiryPayload.email}.`
  )

  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent(`Inquiry receipt email sent to ${inquiryPayload.email}.`)}`)
}

export async function sendBookingBalanceReminderAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingIdRaw = optionalString(formData.get('booking_id'))

  if (!bookingIdRaw) {
    redirectWithError('/admin/bookings', 'Missing booking id for balance reminder email.')
  }

  const bookingId = bookingIdRaw as string
  const emailReference = actionAttemptReference('email-balance-reminder', bookingId, formData.get('email_attempt_id'))
  if (!emailReference) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Refresh the page and try sending the balance reminder again.')
  }
  const booking = await getBookingBalanceReminderSource(admin, bookingId)
  if (!booking) {
    redirectWithError('/admin/bookings', 'Could not find that booking.')
  }

  const payload = getBalanceReminderPayloadFromBooking(booking as BookingBalanceReminderSource)
  if (!payload) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'This booking does not currently have an outstanding balance reminder to send.')
  }

  const balancePayload = payload as NonNullable<typeof payload>
  const result = await sendBookingBalanceReminder(balancePayload, {
    idempotencyKey: emailReference,
  })
  if (!result.ok) {
    redirectWithError(`/admin/bookings/${bookingId}`, result.detail || 'Unable to send balance reminder email.')
  }

  await stampBookingEmailSentAt(admin, bookingId, 'last_balance_reminder_sent_at')

  await appendBookingTimelineNote(
    admin,
    bookingId,
    `Final payment reminder email sent to ${balancePayload.email} for ${balancePayload.balanceDue}.`
  )

  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent(`Final payment reminder email sent to ${balancePayload.email}.`)}`)
}

export async function resendBookingPostEventFollowUpAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingIdRaw = optionalString(formData.get('booking_id'))

  if (!bookingIdRaw) {
    redirectWithError('/admin/bookings', 'Missing booking id for post-event follow-up email.')
  }

  const bookingId = bookingIdRaw as string
  const emailReference = actionAttemptReference('email-post-event', bookingId, formData.get('email_attempt_id'))
  if (!emailReference) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Refresh the page and try sending the post-event follow-up again.')
  }
  const booking = await getBookingPostEventFollowUpSource(admin, bookingId)
  if (!booking) {
    redirectWithError('/admin/bookings', 'Could not find that booking.')
  }

  const payload = getPostEventFollowUpPayloadFromBooking(booking as BookingPostEventFollowUpSource)
  if (!payload) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Only completed bookings can send the post-event follow-up email.')
  }

  const result = await sendBookingPostEventFollowUpEmail(admin, bookingId, {
    force: true,
    mode: 'resend',
    idempotencyKey: emailReference,
  })
  if (result.status === 'failed') {
    redirectWithError(`/admin/bookings/${bookingId}`, result.detail)
  }
  if (result.status === 'sent') {
    redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent(`Post-event follow-up email sent to ${result.email}.`)}`)
  }

  redirectWithError(`/admin/bookings/${bookingId}`, 'This booking is not ready for the post-event follow-up email yet.')
}

export async function sendBookingReviewRequestAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingIdRaw = optionalString(formData.get('booking_id'))

  if (!bookingIdRaw) {
    redirectWithError('/admin/bookings', 'Missing booking id for review request email.')
  }

  const bookingId = bookingIdRaw as string
  const emailReference = actionAttemptReference('email-review-request', bookingId, formData.get('email_attempt_id'))
  if (!emailReference) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Refresh the page and try sending the review request again.')
  }
  const booking = await getBookingReviewRequestSource(admin, bookingId)
  if (!booking) {
    redirectWithError('/admin/bookings', 'Could not find that booking.')
  }

  const payload = getReviewRequestPayloadFromBooking(booking as BookingReviewRequestSource)
  if (!payload) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Only completed bookings can send the review request email.')
  }

  const result = await sendBookingReviewRequestEmail(admin, bookingId, {
    force: true,
    mode: 'resend',
    idempotencyKey: emailReference,
  })
  if (result.status === 'failed') {
    redirectWithError(`/admin/bookings/${bookingId}`, result.detail)
  }
  if (result.status === 'sent') {
    redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent(`Review request email sent to ${result.email}.`)}`)
  }

  redirectWithError(`/admin/bookings/${bookingId}`, 'This booking is not ready for the review request email yet.')
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

  const { error } = await admin
    .from('bookings')
    .update({
      status: nextStatus,
      lifecycle_status: lifecycleStatus,
    })
    .eq('id', bookingId)

  if (error) {
    redirectWithError('/admin/bookings', error.message || 'Unable to update booking status.')
  }

  const confirmationResult = await sendConfirmationIfPresent(confirmationPayload)
  if (confirmationPayload && confirmationResult?.ok) {
    await stampBookingEmailSentAt(admin, bookingId, 'confirmation_email_sent_at')
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

  if (lifecycleStatus === 'completed') {
    const followUpResult = await sendBookingPostEventFollowUpEmail(admin, bookingId)
    if (followUpResult.status === 'failed') {
      console.error('[booking-follow-up] email failed:', followUpResult.detail)
    }
  }

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/dashboard')
  redirect('/admin/bookings')
}

export async function createAdminBookingAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()

  const firstName = optionalString(formData.get('first_name'))
  const lastName = optionalString(formData.get('last_name'))
  const email = optionalString(formData.get('email'))?.toLowerCase() ?? null
  const phone = optionalString(formData.get('phone'))
  const eventName = optionalString(formData.get('event_name'))
  const eventType = optionalString(formData.get('event_type'))
  const eventDate = optionalString(formData.get('event_date'))
  const eventTime = optionalString(formData.get('event_time'))
  const eventEndTime = optionalString(formData.get('event_end_time'))
  const city = optionalString(formData.get('city'))
  const submittedTimeZone = optionalString(formData.get('event_timezone'))
  const eventTimeZone = submittedTimeZone || suggestEventTimeZone(city) || null
  const venue = optionalString(formData.get('venue'))
  const packageName = optionalString(formData.get('package'))
  const hours = parseOptionalNumber(formData.get('hours'))
  const quote = parseOptionalNumber(formData.get('quote'))
  const depositAmount = parseOptionalNumber(formData.get('deposit_amount'))
  const notes = optionalString(formData.get('notes'))

  const returnPath = '/admin/bookings/new'

  if (!firstName || !email || !eventName || !eventDate || !eventTime || !eventTimeZone) {
    redirectWithError(
      returnPath,
      'Client first name, email, event name, date, start time, and timezone are required.'
    )
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectWithError(returnPath, 'Enter a valid client email address.')
  }

  if (!isValidTimeZone(eventTimeZone)) {
    redirectWithError(returnPath, 'Choose a valid event timezone.')
  }

  const eventDateIso = toEventISO(eventDate, eventTimeZone, eventTime)
  if (!eventDateIso) {
    redirectWithError(returnPath, 'Enter a valid event date and start time.')
  }

  let eventEndIso = eventEndTime
    ? toEventISO(eventDate, eventTimeZone, eventEndTime)
    : null

  if (eventEndTime && !eventEndIso) {
    redirectWithError(returnPath, 'Enter a valid event end time.')
  }

  if (eventEndTime && eventEndIso && new Date(eventEndIso).getTime() <= new Date(eventDateIso).getTime()) {
    const nextDate = addCalendarDay(eventDate)
    eventEndIso = nextDate ? toEventISO(nextDate, eventTimeZone, eventEndTime) : null
  }

  if (eventEndTime && !eventEndIso) {
    redirectWithError(returnPath, 'Enter a valid event end time.')
  }

  if (hours !== null && hours <= 0) {
    redirectWithError(returnPath, 'Hours must be greater than 0.')
  }

  if (quote !== null && quote < 0) {
    redirectWithError(returnPath, 'Quote cannot be negative.')
  }

  if (depositAmount !== null && depositAmount < 0) {
    redirectWithError(returnPath, 'Deposit cannot be negative.')
  }

  if (depositAmount !== null && quote === null) {
    redirectWithError(returnPath, 'Add a quote before setting a deposit amount.')
  }

  if (quote !== null && depositAmount !== null && depositAmount > quote) {
    redirectWithError(returnPath, 'Deposit cannot be greater than the quote.')
  }

  const { data: existingClient, error: existingClientError } = await admin
    .from('clients')
    .select('id, first_name, last_name, phone')
    .eq('email', email)
    .maybeSingle()

  if (existingClientError) {
    redirectWithError(returnPath, existingClientError.message || 'Unable to check the client record.')
  }

  let clientId = existingClient?.id as string | undefined

  if (clientId) {
    const { error: clientUpdateError } = await admin
      .from('clients')
      .update({
        first_name: firstName,
        last_name: lastName ?? existingClient?.last_name ?? null,
        phone: phone ?? existingClient?.phone ?? null,
      })
      .eq('id', clientId)

    if (clientUpdateError) {
      redirectWithError(returnPath, clientUpdateError.message || 'Unable to update the client record.')
    }
  } else {
    const { data: createdClient, error: clientCreateError } = await admin
      .from('clients')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      })
      .select('id')
      .single()

    if (clientCreateError || !createdClient?.id) {
      redirectWithError(returnPath, clientCreateError?.message || 'Unable to create the client record.')
    }

    clientId = createdClient.id
  }

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .insert({
      client_id: clientId,
      event_name: eventName,
      event_type: eventType,
      event_date: eventDateIso,
      event_end_time: eventEndIso,
      event_timezone: eventTimeZone,
      venue,
      city,
      package: packageName,
      hours,
      quote,
      deposit_amount: depositAmount,
      notes,
      status: 'inquiry',
      lifecycle_status: 'new',
      payment_status: 'unpaid',
    })
    .select('id')
    .single()

  if (bookingError || !booking?.id) {
    redirectWithError(returnPath, bookingError?.message || 'Unable to create the booking.')
  }

  await appendBookingTimelineNote(
    admin,
    booking.id,
    'Booking created manually in Admin.'
  )

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/clients')
  revalidatePath(`/admin/bookings/${booking.id}`)

  redirect(
    `/admin/bookings/${booking.id}?success=${encodeURIComponent('Booking created. Review the details, then confirm it when you are ready.')}`
  )
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

  const eventDate = toEventISO(eventDateTime!.date, eventTimeZone!, eventDateTime!.time)
  const eventEndTime = eventEndDateTime
    ? toEventISO(eventEndDateTime.date, eventTimeZone!, eventEndDateTime.time)
    : null

  if (!eventDate || (eventEndDateTime && !eventEndTime)) {
    redirectWithError(`/admin/bookings/${id}`, 'Please use a valid event date, time, and timezone.')
  }

  const { data: currentBooking } = await admin
    .from('bookings')
    .select('lifecycle_status')
    .eq('id', bookingId)
    .maybeSingle()

  const confirmationPayload = await getConfirmationPayloadIfNeeded(admin, bookingId, nextStatus)
  const lifecycleStatus = lifecycleStatusRaw && isBookingLifecycleStatus(lifecycleStatusRaw)
    ? lifecycleStatusRaw
    : getBookingLifecycleStatus(undefined, nextStatus)

  const currentLifecycle = (currentBooking?.lifecycle_status ?? 'new') as BookingLifecycleStatus
  if (lifecycleStatus !== currentLifecycle) {
    try {
      assertValidLifecycleTransition(currentLifecycle, lifecycleStatus)
    } catch (err) {
      redirectWithError(`/admin/bookings/${bookingId}`, err instanceof Error ? err.message : 'Invalid lifecycle transition.')
    }
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
      status: nextStatus,
      lifecycle_status: lifecycleStatus,
    })
    .eq('id', bookingId)

  if (error) {
    redirectWithError('/admin/bookings', error.message || 'Unable to update booking.')
  }

  if (lifecycleStatus !== currentLifecycle) {
    void logBookingActivity({
      bookingId,
      type: 'status_changed',
      description: `Lifecycle status changed: ${currentLifecycle} → ${lifecycleStatus}`,
      metadata: { from: currentLifecycle, to: lifecycleStatus },
    })
  }

  const confirmationResult = await sendConfirmationIfPresent(confirmationPayload)
  if (confirmationPayload && confirmationResult?.ok) {
    await stampBookingEmailSentAt(admin, bookingId, 'confirmation_email_sent_at')
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

  if (lifecycleStatus === 'completed') {
    const followUpResult = await sendBookingPostEventFollowUpEmail(admin, bookingId)
    if (followUpResult.status === 'failed') {
      console.error('[booking-follow-up] email failed:', followUpResult.detail)
    }
  }

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
  event_timezone: string | null
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
    .select('id, event_name, event_date, event_timezone, venue, city, notes, status')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    redirectWithError('/admin/bookings', 'Could not find that booking.')
  }

  const source = booking as BookingEventSource

  if (source.status !== 'confirmed' && source.status !== 'completed') {
    redirectWithError('/admin/bookings', 'Only confirmed bookings can be turned into events.')
  }

  const { data: linkedEvent, error: linkedEventError } = await admin
    .from('events')
    .select('id')
    .eq('booking_id', source.id)
    .maybeSingle()

  if (linkedEventError) {
    redirectWithError('/admin/bookings', 'Could not verify whether this booking already has a linked event.')
  }

  if (linkedEvent?.id) {
    redirect(`/admin/events/${linkedEvent.id}`)
  }

  // Legacy fallback: only adopt an older event when it is currently unlinked.
  // Once booking_id exists, that relationship is authoritative.
  const { data: legacyEvent, error: legacyEventError } = await admin
    .from('events')
    .select('id')
    .is('booking_id', null)
    .eq('title', source.event_name)
    .eq('event_date', source.event_date)
    .limit(1)
    .maybeSingle()

  if (legacyEventError) {
    redirectWithError('/admin/bookings', 'Could not verify whether an older matching event can be linked.')
  }

  if (legacyEvent?.id) {
    const { error: linkError } = await admin
      .from('events')
      .update({ booking_id: source.id })
      .eq('id', legacyEvent.id)
      .is('booking_id', null)

    if (linkError) {
      redirectWithError('/admin/bookings', linkError.message || 'Unable to link the existing event to this booking.')
    }

    redirect(`/admin/events/${legacyEvent.id}`)
  }

  const { data: createdEvent, error: createError } = await admin
    .from('events')
    .insert({
      booking_id: source.id,
      title: source.event_name,
      event_date: source.event_date,
      event_timezone: source.event_timezone,
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
  const requestedReturnTo = optionalString(formData.get('return_to'))
  const paymentAttemptId = formData.get('payment_attempt_id')

  if (!bookingId || amount === null || amount <= 0 || !typeRaw || !statusRaw) {
    redirectWithError('/admin/payments', 'Booking, amount, payment type, and status are required.')
  }

  if (!isPaymentType(typeRaw!) || !isPaymentStatus(statusRaw!)) {
    redirectWithError('/admin/payments', 'Invalid payment details.')
  }

  if (methodRaw && !isPaymentMethod(methodRaw)) {
    const fallback = bookingId ? `/admin/bookings/${bookingId}` : '/admin/payments'
    redirectWithError(fallback, 'Invalid payment method.')
  }

  const finalBookingId = bookingId as string
  const finalAmount = amount as number
  const finalType = typeRaw as PaymentType
  const finalStatus = statusRaw as PaymentStatus
  const finalMethod = methodRaw as PaymentMethod | null
  const returnTo = requestedReturnTo &&
      requestedReturnTo.startsWith('/admin/') &&
      !requestedReturnTo.startsWith('//') &&
      !requestedReturnTo.includes('://')
    ? requestedReturnTo
    : `/admin/bookings/${finalBookingId}`
  const paymentReference = actionAttemptReference('admin-payment', finalBookingId, paymentAttemptId)

  if (!paymentReference) {
    redirectWithError(returnTo, 'Refresh the page and try recording the payment again.')
  }

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
      external_reference: paymentReference,
      notes,
  })

  if (error) {
    if (error.code === '23505' && await findPaymentByExternalReference(admin, paymentReference)) {
      await syncInvoicePaymentState(admin, finalBookingId)
      await syncBookingDepositState(admin, finalBookingId)
      await syncBookingWorkflowState(admin, finalBookingId)

      revalidatePath(`/admin/bookings/${finalBookingId}`)
      revalidatePath('/admin/bookings')
      revalidatePath('/admin/payments')
      revalidatePath('/admin/dashboard')
      revalidatePath(`/admin/bookings/${finalBookingId}/invoice`)
      revalidatePath('/admin/invoices')
      redirect(returnTo)
    }

    redirectWithError(returnTo, error.message || 'Unable to record payment.')
  }

  if (shouldAutoSendW9ForPayment(finalAmount, finalStatus)) {
    const booking = await getBookingW9Recipient(admin, finalBookingId)
    const client = getPrimaryBookingClient(booking?.clients)
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
  const workflowState = await syncBookingWorkflowState(admin, finalBookingId)
  if (workflowState?.lifecycleStatus === 'completed') {
    const followUpResult = await sendBookingPostEventFollowUpEmail(admin, finalBookingId)
    if (followUpResult.status === 'failed') {
      console.error('[booking-payment] post-event follow-up email failed:', followUpResult.detail)
    }
  }
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
  revalidatePath('/admin/invoices')
  redirect(returnTo)
}

export async function updateBookingPaymentAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const paymentId = optionalString(formData.get('payment_id'))
  const bookingId = optionalString(formData.get('booking_id'))
  const amount = parseOptionalNumber(formData.get('amount'))
  const typeRaw = optionalString(formData.get('type'))
  const methodRaw = optionalString(formData.get('method'))
  const statusRaw = optionalString(formData.get('status'))
  const paidAt = parseOptionalDate(formData.get('paid_at'))
  const notes = optionalString(formData.get('notes'))

  if (!paymentId || !bookingId || amount === null || amount <= 0 || !typeRaw || !statusRaw) {
    redirectWithError(bookingId ? `/admin/bookings/${bookingId}` : '/admin/payments', 'Payment id, booking, amount, type, and status are required.')
  }

  if (!isPaymentType(typeRaw) || !isPaymentStatus(statusRaw)) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Invalid payment correction details.')
  }

  if (methodRaw && !isPaymentMethod(methodRaw)) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Invalid payment method.')
  }

  if (statusRaw === 'received' && !paidAt) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Received payments need a paid date.')
  }

  const { data: current, error: lookupError } = await admin
    .from('payments')
    .select('id, booking_id, amount, type, method, status, paid_at')
    .eq('id', paymentId)
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (lookupError || !current) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Could not find that payment record.')
  }

  const finalMethod = methodRaw as PaymentMethod | null
  const finalStatus = statusRaw as PaymentStatus
  const finalType = typeRaw as PaymentType

  const { error } = await admin
    .from('payments')
    .update({
      amount,
      type: finalType,
      method: finalMethod,
      status: finalStatus,
      paid_at: finalStatus === 'pending' ? null : paidAt,
      notes,
    })
    .eq('id', paymentId)
    .eq('booking_id', bookingId)

  if (error) {
    redirectWithError(`/admin/bookings/${bookingId}`, error.message || 'Unable to correct payment record.')
  }

  await syncInvoicePaymentState(admin, bookingId)
  await syncBookingDepositState(admin, bookingId)
  await syncBookingWorkflowState(admin, bookingId)

  await appendBookingTimelineNote(
    admin,
    bookingId,
    `Payment ${paymentId.slice(0, 8).toUpperCase()} corrected: ${formatCurrency(amount)} ${finalType}, ${finalStatus}.`
  )

  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/payments')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/admin/bookings/${bookingId}/invoice`)
  revalidatePath('/admin/invoices')
  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent('Payment record corrected.')}`)
}


// ─── WORKFLOW TRANSITION ACTIONS ─────────────────────────────────────────────

export async function markBookingContactedAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))
  if (!bookingId) redirectWithError('/admin/bookings', 'Missing booking ID.')

  const { data: current } = await admin
    .from('bookings')
    .select('lifecycle_status')
    .eq('id', bookingId as string)
    .maybeSingle()

  const currentLifecycle = (current?.lifecycle_status ?? 'new') as BookingLifecycleStatus
  try {
    assertValidLifecycleTransition(currentLifecycle, 'contacted')
  } catch (err) {
    redirectWithError(`/admin/bookings/${bookingId}`, err instanceof Error ? err.message : 'Invalid transition.')
  }

  const { error } = await admin
    .from('bookings')
    .update({ lifecycle_status: 'contacted' })
    .eq('id', bookingId as string)

  if (error) redirectWithError(`/admin/bookings/${bookingId}`, error.message || 'Unable to update booking.')

  await appendBookingTimelineNote(admin, bookingId as string, 'Marked as contacted.')
  void logBookingActivity({
    bookingId: bookingId as string,
    type: 'status_changed',
    description: `Lifecycle status changed: ${currentLifecycle} → contacted`,
    metadata: { from: currentLifecycle, to: 'contacted' },
  })
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  redirect(`/admin/bookings/${bookingId}`)
}

export async function confirmBookingAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))
  if (!bookingId) redirectWithError('/admin/bookings', 'Missing booking ID.')

  const { data: current } = await admin
    .from('bookings')
    .select('lifecycle_status')
    .eq('id', bookingId as string)
    .maybeSingle()

  const currentLifecycle = (current?.lifecycle_status ?? 'new') as BookingLifecycleStatus
  try {
    assertValidLifecycleTransition(currentLifecycle, 'confirmed')
  } catch (err) {
    redirectWithError(`/admin/bookings/${bookingId}`, err instanceof Error ? err.message : 'Invalid transition.')
  }

  const { error } = await admin
    .from('bookings')
    .update({
      lifecycle_status: 'confirmed',
      status: 'confirmed',
    })
    .eq('id', bookingId as string)

  if (error) redirectWithError(`/admin/bookings/${bookingId}`, error.message || 'Unable to confirm booking.')

  await syncComputedBookingPaymentState(admin, bookingId as string)

  const invoiceDraftResult = await ensureInvoiceDraft(admin, bookingId as string)
  if (invoiceDraftResult.created) {
    await appendBookingTimelineNote(
      admin,
      bookingId as string,
      'Invoice draft created automatically when the booking was confirmed.'
    )
  } else if (invoiceDraftResult.updated) {
    await appendBookingTimelineNote(
      admin,
      bookingId as string,
      'Invoice draft refreshed when the booking was confirmed.'
    )
  }

  void logBookingActivity({
    bookingId: bookingId as string,
    type: 'status_changed',
    description: `Lifecycle status changed: ${currentLifecycle} → confirmed`,
    metadata: { from: currentLifecycle, to: 'confirmed' },
  })

  const booking = await getBookingConfirmationSource(admin, bookingId as string)
  if (booking) {
    const payload = getConfirmationPayloadFromBooking(booking)
    if (payload) {
      const result = await sendBookingConfirmedNotification(payload)
      const client = getPrimaryBookingClient(booking.clients)
      if (result.ok) {
        await stampBookingEmailSentAt(admin, bookingId as string, 'confirmation_email_sent_at')
        await appendBookingTimelineNote(admin, bookingId as string, `Booking confirmed. Confirmation and deposit request sent to ${client?.email ?? 'client'}.`)
      } else {
        await appendBookingTimelineNote(admin, bookingId as string, 'Booking confirmed. Confirmation email could not be sent.')
      }
    } else {
      await appendBookingTimelineNote(admin, bookingId as string, 'Booking confirmed. No client email on file — confirmation not sent.')
    }
  }

  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/bookings/${bookingId}/invoice`)
  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent('Booking confirmed.')}`)
}

export async function markDepositReceivedAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))
  if (!bookingId) redirectWithError('/admin/bookings', 'Missing booking ID.')
  const paymentReference = actionAttemptReference('quick-deposit', bookingId as string, formData.get('payment_attempt_id'))
  if (!paymentReference) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Refresh the page and try recording the deposit again.')
  }

  const { data: booking, error } = await admin
    .from('bookings')
    .select('deposit_amount, payments(amount, status)')
    .eq('id', bookingId as string)
    .maybeSingle()

  if (error || !booking) {
    redirectWithError(`/admin/bookings/${bookingId}`, error?.message || 'Unable to load booking payment state.')
  }

  const bookingRecord = booking as NonNullable<typeof booking>
  const outstandingDeposit = getOutstandingDeposit(
    bookingRecord.deposit_amount as number | null,
    (bookingRecord.payments as Array<{ amount: number; status: 'pending' | 'received' | 'refunded' }> | null) ?? null,
  )

  if (outstandingDeposit <= 0) {
    redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent('Deposit is already fully recorded.')}`)
  }

  const { error: paymentError } = await admin
    .from('payments')
    .insert({
      booking_id: bookingId as string,
      amount: outstandingDeposit,
      type: 'deposit',
      status: 'received',
      paid_at: new Date().toISOString(),
      external_reference: paymentReference,
      notes: 'Deposit marked received from booking workflow quick action.',
    })

  if (paymentError) {
    if (paymentError.code === '23505' && await findPaymentByExternalReference(admin, paymentReference)) {
      await syncBookingDepositState(admin, bookingId as string)
      await syncComputedBookingPaymentState(admin, bookingId as string)

      revalidatePath(`/admin/bookings/${bookingId}`)
      revalidatePath('/admin/bookings')
      revalidatePath('/admin/payments')
      revalidatePath('/admin/dashboard')
      redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent('Deposit was already recorded.')}`)
    }

    redirectWithError(`/admin/bookings/${bookingId}`, paymentError.message || 'Unable to record deposit payment.')
  }

  await syncBookingDepositState(admin, bookingId as string)
  await syncComputedBookingPaymentState(admin, bookingId as string)

  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/payments')
  revalidatePath('/admin/dashboard')
  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent('Deposit marked as received.')}`)
}

export async function requestFinalPaymentAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))
  if (!bookingId) redirectWithError('/admin/bookings', 'Missing booking ID.')
  const emailReference = actionAttemptReference('email-final-payment', bookingId as string, formData.get('email_attempt_id'))
  if (!emailReference) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Refresh the page and try sending the final payment reminder again.')
  }

  const source = await getBookingBalanceReminderSource(admin, bookingId as string)
  if (!source) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Could not load this booking for a final payment reminder.')
  }

  const payload = await getBalanceReminderPayloadFromBooking(source)
  if (!payload) {
    redirectWithError(
      `/admin/bookings/${bookingId}`,
      'Final payment reminder is blocked. Check the client email and outstanding balance first.'
    )
  }

  const result = await sendBookingBalanceReminder(payload, {
    idempotencyKey: emailReference,
  })
  if (!result.ok) {
    await appendBookingTimelineNote(
      admin,
      bookingId as string,
      'Final payment reminder could not be sent.'
    )
    redirectWithError(
      `/admin/bookings/${bookingId}`,
      result.detail || 'Final payment reminder could not be sent.'
    )
  }

  await stampBookingEmailSentAt(admin, bookingId as string, 'last_balance_reminder_sent_at')
  await appendBookingTimelineNote(
    admin,
    bookingId as string,
    `Final payment requested. Balance reminder sent to ${payload.email}.`
  )
  await syncComputedBookingPaymentState(admin, bookingId as string)

  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent(`Final payment reminder sent to ${payload.email}.`)}`)
}

export async function markFullyPaidAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))
  if (!bookingId) redirectWithError('/admin/bookings', 'Missing booking ID.')
  const paymentReference = actionAttemptReference('quick-balance', bookingId as string, formData.get('payment_attempt_id'))
  if (!paymentReference) {
    redirectWithError(`/admin/bookings/${bookingId}`, 'Refresh the page and try recording the final payment again.')
  }

  const { data: booking, error } = await admin
    .from('bookings')
    .select('quote, payments(amount, status)')
    .eq('id', bookingId as string)
    .maybeSingle()

  if (error || !booking) {
    redirectWithError(`/admin/bookings/${bookingId}`, error?.message || 'Unable to load booking payment state.')
  }

  const bookingRecord = booking as NonNullable<typeof booking>
  const remainingBalance = getOutstandingBalance(
    bookingRecord.quote as number | null,
    (bookingRecord.payments as Array<{ amount: number; status: 'pending' | 'received' | 'refunded' }> | null) ?? null,
  )

  if (remainingBalance <= 0) {
    redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent('Booking is already fully paid.')}`)
  }

  const { error: paymentError } = await admin
    .from('payments')
    .insert({
      booking_id: bookingId as string,
      amount: remainingBalance,
      type: 'balance',
      status: 'received',
      paid_at: new Date().toISOString(),
      external_reference: paymentReference,
      notes: 'Balance marked received from booking workflow quick action.',
    })

  if (paymentError) {
    if (paymentError.code === '23505' && await findPaymentByExternalReference(admin, paymentReference)) {
      await syncComputedBookingPaymentState(admin, bookingId as string)

      revalidatePath(`/admin/bookings/${bookingId}`)
      revalidatePath('/admin/bookings')
      revalidatePath('/admin/payments')
      revalidatePath('/admin/dashboard')
      redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent('Final payment was already recorded.')}`)
    }

    redirectWithError(`/admin/bookings/${bookingId}`, paymentError.message || 'Unable to record the final payment.')
  }

  await syncComputedBookingPaymentState(admin, bookingId as string)

  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/payments')
  revalidatePath('/admin/dashboard')
  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent('Booking marked as fully paid.')}`)
}

export async function markBookingCompleteAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))
  if (!bookingId) redirectWithError('/admin/bookings', 'Missing booking ID.')

  const { data: current } = await admin
    .from('bookings')
    .select('lifecycle_status')
    .eq('id', bookingId as string)
    .maybeSingle()

  const currentLifecycle = (current?.lifecycle_status ?? 'new') as BookingLifecycleStatus
  try {
    assertValidLifecycleTransition(currentLifecycle, 'completed')
  } catch (err) {
    redirectWithError(`/admin/bookings/${bookingId}`, err instanceof Error ? err.message : 'Invalid transition.')
  }

  const { error } = await admin
    .from('bookings')
    .update({
      lifecycle_status: 'completed',
      status: 'completed',
    })
    .eq('id', bookingId as string)

  if (error) redirectWithError(`/admin/bookings/${bookingId}`, error.message || 'Unable to mark booking as complete.')

  void logBookingActivity({
    bookingId: bookingId as string,
    type: 'status_changed',
    description: `Lifecycle status changed: ${currentLifecycle} → completed`,
    metadata: { from: currentLifecycle, to: 'completed' },
  })

  await sendBookingPostEventFollowUpEmail(admin, bookingId as string, { force: true })

  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent('Booking marked as complete.')}`)
}

export async function markBookingLostAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))
  if (!bookingId) redirectWithError('/admin/bookings', 'Missing booking ID.')

  const { data: current } = await admin
    .from('bookings')
    .select('lifecycle_status')
    .eq('id', bookingId as string)
    .maybeSingle()

  const currentLifecycle = (current?.lifecycle_status ?? 'new') as BookingLifecycleStatus
  try {
    assertValidLifecycleTransition(currentLifecycle, 'lost')
  } catch (err) {
    redirectWithError(`/admin/bookings/${bookingId}`, err instanceof Error ? err.message : 'Invalid transition.')
  }

  const { error } = await admin
    .from('bookings')
    .update({
      lifecycle_status: 'lost',
      status: 'cancelled',
    })
    .eq('id', bookingId as string)

  if (error) redirectWithError(`/admin/bookings/${bookingId}`, error.message || 'Unable to mark booking as lost.')

  await appendBookingTimelineNote(admin, bookingId as string, 'Marked as lost.')
  void logBookingActivity({
    bookingId: bookingId as string,
    type: 'status_changed',
    description: `Lifecycle status changed: ${currentLifecycle} → lost`,
    metadata: { from: currentLifecycle, to: 'lost' },
  })

  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  redirect(`/admin/bookings/${bookingId}`)
}

// ─────────────────────────────────────────────────────────────────────────────

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

export async function updatePortalRequestStatusAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const requestId = optionalString(formData.get('request_id'))
  const bookingId = optionalString(formData.get('booking_id'))
  const nextStatus = optionalString(formData.get('status'))

  if (!requestId || !bookingId || !nextStatus || !isPortalRequestStatus(nextStatus)) {
    redirectWithError('/admin/bookings', 'Unable to update that portal request.')
  }

  const resolvedBookingId = bookingId as string
  const status = nextStatus as PortalRequestStatus

  const updatePayload: {
    status: PortalRequestStatus
    resolved_at?: string | null
  } = {
    status,
  }

  if (status === 'resolved') {
    updatePayload.resolved_at = new Date().toISOString()
  } else {
    updatePayload.resolved_at = null
  }

  const { error } = await admin
    .from('booking_portal_requests')
    .update(updatePayload)
    .eq('id', requestId)
    .eq('booking_id', resolvedBookingId)

  if (error) {
    redirectWithError(`/admin/bookings/${resolvedBookingId}`, error.message || 'Unable to update portal request.')
  }

  const timelineMessage = status === 'resolved'
    ? 'Marked a client portal request as resolved.'
    : status === 'reviewed'
      ? 'Marked a client portal request as in review.'
      : 'Marked a client portal request as new.'

  await appendBookingTimelineNote(admin, resolvedBookingId, timelineMessage)

  revalidatePath(`/admin/bookings/${resolvedBookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  redirect(`/admin/bookings/${resolvedBookingId}?success=${encodeURIComponent('Portal request updated.')}`)
}

export async function deleteBookingAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))
  if (!bookingId) redirectWithError('/admin/bookings', 'Missing booking ID.')

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('id, status, lifecycle_status')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    redirectWithError('/admin/bookings', bookingError?.message || 'Could not find that booking.')
  }

  const lifecycleStatus = getBookingLifecycleStatus(
    booking.lifecycle_status as BookingLifecycleStatus | null | undefined,
    booking.status as BookingStatus | null | undefined,
  )

  if (lifecycleStatus === 'confirmed' || lifecycleStatus === 'completed') {
    redirectWithError(
      `/admin/bookings/${bookingId}`,
      'Confirmed and completed bookings are protected business records. Mark the booking lost/cancelled only when appropriate; do not hard-delete real work.'
    )
  }

  const [{ data: payments, error: paymentsError }, { data: invoices, error: invoicesError }] = await Promise.all([
    admin.from('payments').select('id, status').eq('booking_id', bookingId),
    admin.from('invoices').select('id, status').eq('booking_id', bookingId),
  ])

  if (paymentsError || invoicesError) {
    redirectWithError(
      `/admin/bookings/${bookingId}`,
      paymentsError?.message || invoicesError?.message || 'Could not verify related financial records.'
    )
  }

  if ((payments ?? []).some((payment) => payment.status === 'received' || payment.status === 'refunded')) {
    redirectWithError(
      `/admin/bookings/${bookingId}`,
      'This booking has received or refunded payment history and cannot be permanently deleted.'
    )
  }

  if ((invoices ?? []).some((invoice) => invoice.status === 'sent' || invoice.status === 'paid')) {
    redirectWithError(
      `/admin/bookings/${bookingId}`,
      'This booking has a sent or paid invoice and cannot be permanently deleted.'
    )
  }

  const { error: deleteError } = await admin
    .from('bookings')
    .delete()
    .eq('id', bookingId)

  if (deleteError) {
    redirectWithError(`/admin/bookings/${bookingId}`, deleteError.message || 'Could not delete the booking.')
  }

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/clients')
  revalidatePath('/admin/invoices')
  revalidatePath('/admin/payments')
  revalidatePath('/admin/events')
  revalidatePath('/admin/dashboard')
  redirect('/admin/bookings')
}
