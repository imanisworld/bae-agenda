'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminUser } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildInvoiceDraftRecord, type InvoiceDraftSource } from '@/lib/invoice-drafts'
import { invoiceLineItemsTotal, type InvoiceLineItem } from '@/lib/invoices'
import { EVENT_INVOICE_EVENT_TYPE, eventInvoiceDueDate } from '@/lib/event-invoice'
import { suggestEventTimeZone } from '@/lib/event-form-options'

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function parseInvoiceLineItems(formData: FormData): InvoiceLineItem[] | null {
  const descriptions = formData.getAll('line_description')
  const quantities = formData.getAll('line_quantity')
  const unitAmounts = formData.getAll('line_unit_amount')

  if (
    descriptions.length === 0 ||
    descriptions.length > 8 ||
    descriptions.length !== quantities.length ||
    descriptions.length !== unitAmounts.length
  ) {
    return null
  }

  const items: InvoiceLineItem[] = []

  for (let index = 0; index < descriptions.length; index += 1) {
    const rawDescription = descriptions[index]
    const description = typeof rawDescription === 'string'
      ? rawDescription.trim()
      : ''
    const quantity = Number(quantities[index])
    const unitAmount = Number(unitAmounts[index])

    if (
      !description ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitAmount) ||
      unitAmount < 0
    ) {
      return null
    }

    items.push({
      description,
      quantity: Math.round((quantity + Number.EPSILON) * 100) / 100,
      unit_amount: Math.round((unitAmount + Number.EPSILON) * 100) / 100,
    })
  }

  return items
}

function redirectWithError(path: string, message: string): never {
  const params = new URLSearchParams({ error: message })
  redirect(`${path}?${params.toString()}`)
}

export async function createInvoiceFromBookingAction(formData: FormData) {
  await requireAdminUser()

  const bookingId = optionalString(formData.get('booking_id'))
  if (!bookingId) {
    redirectWithError('/admin/invoices/new', 'Choose a booking first.')
  }

  const admin = createAdminClient()

  const { data: booking, error: bookingError } = await admin
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
    .eq('id', bookingId as string)
    .maybeSingle()

  if (bookingError || !booking) {
    redirectWithError('/admin/invoices/new', 'Could not find that booking.')
  }

  const source = booking as unknown as InvoiceDraftSource

  if (source.status === 'cancelled') {
    redirectWithError('/admin/invoices/new', 'Cancelled bookings cannot be invoiced.')
  }

  if (!source.event_name?.trim()) {
    redirectWithError('/admin/invoices/new', 'Add an event name to the booking before creating an invoice.')
  }

  if (!source.quote || source.quote <= 0) {
    redirectWithError('/admin/invoices/new', 'Add a quote greater than $0 to the booking before creating an invoice.')
  }

  const { data: existing, error: existingError } = await admin
    .from('invoices')
    .select('id')
    .eq('booking_id', bookingId as string)
    .maybeSingle()

  if (existingError) {
    redirectWithError('/admin/invoices/new', existingError.message || 'Unable to check invoice status.')
  }

  if (existing?.id) {
    redirect(`/admin/bookings/${bookingId}/invoice`)
  }

  const draft = buildInvoiceDraftRecord(source)
  const { error: insertError } = await admin
    .from('invoices')
    .insert(draft)

  if (insertError) {
    redirectWithError('/admin/invoices/new', insertError.message || 'Unable to create invoice.')
  }

  await admin
    .from('notes')
    .insert({
      booking_id: bookingId as string,
      body: 'Invoice draft created manually from the admin Invoices workspace.',
    })

  revalidatePath('/admin/invoices')
  revalidatePath('/admin/invoices/new')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath(`/admin/bookings/${bookingId}/invoice`)

  redirect(`/admin/bookings/${bookingId}/invoice`)
}

/**
 * Bill a venue or promoter for a standalone event: creates the payer as a
 * client, a booking behind the event (linked to it), and an invoice draft.
 * An event that already has a booking goes straight to that booking's invoice.
 */
export async function createInvoiceForEventAction(formData: FormData) {
  await requireAdminUser()

  const eventId = optionalString(formData.get('event_id'))
  if (!eventId) {
    redirectWithError('/admin/events', 'Missing event id.')
  }

  const returnPath = `/admin/events/${eventId}`
  const firstName = optionalString(formData.get('first_name'))
  const lastName = optionalString(formData.get('last_name'))
  const email = optionalString(formData.get('email'))?.toLowerCase() ?? null
  const amount = parseOptionalNumber(formData.get('amount'))

  if (!firstName || !email || amount === null) {
    redirectWithError(returnPath, 'Who is paying (name and email) and the amount are required to invoice this event.')
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email as string)) {
    redirectWithError(returnPath, 'Enter a valid email address for who is paying.')
  }

  if ((amount as number) <= 0) {
    redirectWithError(returnPath, 'The invoice amount must be greater than $0.')
  }

  const admin = createAdminClient()

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id, title, event_date, event_timezone, venue, city, booking_id')
    .eq('id', eventId as string)
    .maybeSingle()

  if (eventError || !event) {
    redirectWithError('/admin/events', 'Could not find that event.')
  }

  if (event.booking_id) {
    redirect(`/admin/bookings/${event.booking_id}/invoice`)
  }

  const { data: existingClient, error: existingClientError } = await admin
    .from('clients')
    .select('id')
    .eq('email', email as string)
    .maybeSingle()

  if (existingClientError) {
    redirectWithError(returnPath, existingClientError.message || 'Unable to check the client record.')
  }

  // An existing client keeps their saved details; only new payers are added.
  let clientId = existingClient?.id as string | undefined
  if (!clientId) {
    const { data: createdClient, error: clientCreateError } = await admin
      .from('clients')
      .insert({ first_name: firstName, last_name: lastName, email })
      .select('id')
      .single()

    if (clientCreateError || !createdClient?.id) {
      redirectWithError(returnPath, clientCreateError?.message || 'Unable to create the client record.')
    }

    clientId = createdClient.id
  }

  const quote = Math.round(((amount as number) + Number.EPSILON) * 100) / 100
  const status = new Date(event.event_date).getTime() < Date.now() ? 'completed' : 'confirmed'
  const eventTimeZone = event.event_timezone || suggestEventTimeZone(event.city) || null

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .insert({
      client_id: clientId,
      event_name: event.title,
      event_type: EVENT_INVOICE_EVENT_TYPE,
      event_date: event.event_date,
      event_timezone: eventTimeZone,
      venue: event.venue,
      city: event.city,
      quote,
      status,
      lifecycle_status: status,
      payment_status: 'unpaid',
    })
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
    .single()

  if (bookingError || !booking?.id) {
    redirectWithError(returnPath, bookingError?.message || 'Unable to create the booking for this event.')
  }

  // Link only while the event is still unlinked, so a double submit can't
  // leave two bookings pointing at one event.
  const { data: linked, error: linkError } = await admin
    .from('events')
    .update({ booking_id: booking.id })
    .eq('id', event.id)
    .is('booking_id', null)
    .select('id')

  if (linkError || !linked?.length) {
    await admin.from('bookings').delete().eq('id', booking.id)
    redirectWithError(returnPath, linkError?.message || 'This event was just linked to another booking. Refresh and try again.')
  }

  const source = booking as unknown as InvoiceDraftSource
  const draft = buildInvoiceDraftRecord(source)
  const { error: insertError } = await admin
    .from('invoices')
    .insert({ ...draft, due_date: eventInvoiceDueDate(draft.due_date) })

  if (insertError) {
    redirectWithError(`/admin/bookings/${booking.id}/invoice`, insertError.message || 'Booking created, but the invoice draft failed. Use Create Invoice to retry.')
  }

  await admin
    .from('notes')
    .insert({
      booking_id: booking.id,
      body: `Created from the event "${event.title}" to invoice ${email}. Automatic reminder, follow-up and review emails are off for this booking.`,
    })

  revalidatePath('/admin/invoices')
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/events')
  revalidatePath(returnPath)
  revalidatePath(`/admin/bookings/${booking.id}`)

  redirect(`/admin/bookings/${booking.id}/invoice/edit`)
}

export async function voidInvoiceAction(formData: FormData) {
  await requireAdminUser()

  const bookingId = optionalString(formData.get('booking_id'))
  if (!bookingId) redirectWithError('/admin/invoices', 'Missing booking for invoice.')

  const admin = createAdminClient()
  const { data: invoice, error: lookupError } = await admin
    .from('invoices')
    .select('status, invoice_number')
    .eq('booking_id', bookingId as string)
    .maybeSingle()

  if (lookupError || !invoice) {
    redirectWithError('/admin/invoices', lookupError?.message || 'Invoice not found.')
  }

  if (invoice.status === 'paid') {
    redirectWithError('/admin/invoices', 'Paid invoices cannot be voided.')
  }

  const { error } = await admin
    .from('invoices')
    .update({ status: 'void' })
    .eq('booking_id', bookingId as string)

  if (error) {
    redirectWithError('/admin/invoices', error.message || 'Unable to void invoice.')
  }

  await admin.from('notes').insert({
    booking_id: bookingId as string,
    body: `Invoice #${invoice.invoice_number} marked void.`,
  })

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath(`/admin/bookings/${bookingId}/invoice`)
  redirect('/admin/invoices')
}

export async function restoreInvoiceDraftAction(formData: FormData) {
  await requireAdminUser()

  const bookingId = optionalString(formData.get('booking_id'))
  if (!bookingId) redirectWithError('/admin/invoices', 'Missing booking for invoice.')

  const admin = createAdminClient()
  const { data: invoice, error: lookupError } = await admin
    .from('invoices')
    .select('status, invoice_number')
    .eq('booking_id', bookingId as string)
    .maybeSingle()

  if (lookupError || !invoice) {
    redirectWithError('/admin/invoices', lookupError?.message || 'Invoice not found.')
  }

  if (invoice.status !== 'void') {
    redirectWithError('/admin/invoices', 'Only void invoices can be restored to draft.')
  }

  const { error } = await admin
    .from('invoices')
    .update({ status: 'draft', sent_at: null })
    .eq('booking_id', bookingId as string)

  if (error) {
    redirectWithError('/admin/invoices', error.message || 'Unable to restore invoice.')
  }

  await admin.from('notes').insert({
    booking_id: bookingId as string,
    body: `Invoice #${invoice.invoice_number} restored to draft.`,
  })

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath(`/admin/bookings/${bookingId}/invoice`)
  redirect(`/admin/bookings/${bookingId}/invoice`)
}

export async function updateInvoiceDetailsAction(formData: FormData) {
  await requireAdminUser()

  const bookingId = optionalString(formData.get('booking_id'))
  const eventName = optionalString(formData.get('event_name'))
  const clientName = optionalString(formData.get('client_name'))
  const clientEmail = optionalString(formData.get('client_email'))
  const depositAmount = parseOptionalNumber(formData.get('deposit_amount'))
  const dueDate = optionalString(formData.get('due_date'))
  const paymentTerms = optionalString(formData.get('payment_terms'))
  const lineItems = parseInvoiceLineItems(formData)
  const totalAmount = lineItems ? invoiceLineItemsTotal(lineItems) : null

  if (
    !bookingId ||
    !eventName ||
    !clientName ||
    !clientEmail ||
    depositAmount === null ||
    !paymentTerms ||
    !lineItems ||
    totalAmount === null
  ) {
    redirectWithError(
      bookingId ? `/admin/bookings/${bookingId}/invoice/edit` : '/admin/invoices',
      'Client, event, email, payment terms, deposit, and at least one valid line item are required.'
    )
  }

  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    redirectWithError(
      `/admin/bookings/${bookingId}/invoice/edit`,
      'Enter a valid invoice due date.'
    )
  }

  if (paymentTerms.length > 1000) {
    redirectWithError(
      `/admin/bookings/${bookingId}/invoice/edit`,
      'Payment terms must be 1,000 characters or fewer.'
    )
  }

  if (totalAmount <= 0 || depositAmount < 0 || depositAmount > totalAmount) {
    redirectWithError(
      `/admin/bookings/${bookingId}/invoice/edit`,
      'Line items must total more than $0, and the deposit cannot exceed the invoice total.'
    )
  }

  const admin = createAdminClient()
  const { data: invoice, error: lookupError } = await admin
    .from('invoices')
    .select('status, invoice_number')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (lookupError || !invoice) {
    redirectWithError('/admin/invoices', lookupError?.message || 'Invoice not found.')
  }

  if (invoice.status === 'paid' || invoice.status === 'void') {
    redirectWithError(
      `/admin/bookings/${bookingId}/invoice`,
      `${invoice.status === 'paid' ? 'Paid' : 'Void'} invoices cannot be edited.`
    )
  }

  const filenameClient = clientName
    .replace(/[^a-z0-9\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'client'

  const resetToDraft = invoice.status === 'sent'
  const updatePayload = {
    event_name: eventName,
    client_name: clientName,
    client_email: clientEmail,
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    balance_due: totalAmount - depositAmount,
    due_date: dueDate,
    payment_terms: paymentTerms,
    line_items: lineItems,
    pdf_filename: `invoice-${filenameClient}-${bookingId.slice(0, 8)}.pdf`,
    status: resetToDraft ? 'draft' as const : invoice.status,
    ...(resetToDraft ? { sent_at: null } : {}),
  }

  const { error } = await admin
    .from('invoices')
    .update(updatePayload)
    .eq('booking_id', bookingId)

  if (error) {
    redirectWithError(`/admin/bookings/${bookingId}/invoice/edit`, error.message || 'Unable to update invoice.')
  }

  await admin.from('notes').insert({
    booking_id: bookingId,
    body: resetToDraft
      ? `Invoice #${invoice.invoice_number} edited after sending and reset to draft for review.`
      : `Invoice #${invoice.invoice_number} details updated.`,
  })

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath(`/admin/bookings/${bookingId}/invoice`)
  revalidatePath(`/admin/bookings/${bookingId}/invoice/edit`)

  redirect(`/admin/bookings/${bookingId}/invoice`)
}

