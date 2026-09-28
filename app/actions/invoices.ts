'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminUser } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildInvoiceDraftRecord, type InvoiceDraftSource } from '@/lib/invoice-drafts'

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
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

