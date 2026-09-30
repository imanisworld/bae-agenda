'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const ClientUpdateSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().trim().min(1, 'First name is required.').max(120),
  last_name: z.string().trim().max(120).optional().default(''),
  email: z.string().trim().email('Enter a valid email address.').or(z.literal('')),
  phone: z.string().trim().max(40).optional().default(''),
  notes: z.string().trim().max(5000).optional().default(''),
})

function redirectWithError(id: string, message: string): never {
  redirect(`/admin/clients/${id}?error=${encodeURIComponent(message)}`)
}

export async function updateClientAction(formData: FormData) {
  await requireAdminUser()

  const parsed = ClientUpdateSchema.safeParse({
    id: formData.get('id'),
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) {
    const id = String(formData.get('id') ?? '')
    redirectWithError(id, parsed.error.issues[0]?.message ?? 'Invalid client details.')
  }

  const { id, first_name, last_name, email, phone, notes } = parsed.data
  const admin = createAdminClient()

  const { data: previousClient, error: previousClientError } = await admin
    .from('clients')
    .select('first_name, last_name, email')
    .eq('id', id)
    .maybeSingle()

  if (previousClientError || !previousClient) {
    redirectWithError(id, 'Could not load the current client record before saving changes.')
  }

  const { error } = await admin
    .from('clients')
    .update({
      first_name,
      last_name: last_name || null,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
    })
    .eq('id', id)

  if (error) {
    redirectWithError(id, error.code === '23505' ? 'That email is already assigned to another client.' : error.message)
  }

  const { data: clientBookings, error: bookingLookupError } = await admin
    .from('bookings')
    .select('id')
    .eq('client_id', id)

  if (bookingLookupError) {
    redirectWithError(id, 'Client details were saved, but linked bookings could not be checked for draft invoice updates.')
  }

  const bookingIds = (clientBookings ?? []).map((booking) => booking.id)
  if (bookingIds.length > 0) {
    const previousName = [previousClient.first_name, previousClient.last_name].filter(Boolean).join(' ')
    const nextName = [first_name, last_name].filter(Boolean).join(' ')
    const previousEmail = previousClient.email?.trim() || null
    const nextEmail = email || null

    const { data: draftInvoices, error: draftLookupError } = await admin
      .from('invoices')
      .select('id, client_name, client_email')
      .in('booking_id', bookingIds)
      .eq('status', 'draft')

    if (draftLookupError) {
      redirectWithError(id, 'Client details were saved, but draft invoices could not be checked. Review any draft invoice before sending.')
    }

    for (const invoice of draftInvoices ?? []) {
      const patch: { client_name?: string; client_email?: string | null } = {}

      if (!invoice.client_name || invoice.client_name === previousName) {
        patch.client_name = nextName
      }
      if (!invoice.client_email || invoice.client_email === previousEmail) {
        patch.client_email = nextEmail
      }

      if (Object.keys(patch).length === 0) continue

      const { error: invoiceSyncError } = await admin
        .from('invoices')
        .update(patch)
        .eq('id', invoice.id)
        .eq('status', 'draft')

      if (invoiceSyncError) {
        redirectWithError(id, 'Client details were saved, but one or more draft invoices could not be synced. Review draft invoices before sending.')
      }
    }
  }

  revalidatePath('/admin/clients')
  revalidatePath(`/admin/clients/${id}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/invoices')
  for (const bookingId of bookingIds) {
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath(`/admin/bookings/${bookingId}/invoice`)
  }
  redirect(`/admin/clients/${id}?success=${encodeURIComponent('Client details saved. Draft invoice recipients were synced; sent invoices were left unchanged.')}`)
}

export async function deleteClientAction(formData: FormData) {
  await requireAdminUser()

  const parsedId = z.string().uuid().safeParse(formData.get('id'))
  if (!parsedId.success) {
    redirect('/admin/clients')
  }

  const id = parsedId.data
  const admin = createAdminClient()

  const { data: bookings, error: bookingError } = await admin
    .from('bookings')
    .select('id')
    .eq('client_id', id)
    .limit(1)

  if (bookingError) {
    redirectWithError(id, bookingError.message || 'Could not verify linked bookings.')
  }

  if ((bookings ?? []).length > 0) {
    redirectWithError(id, 'Delete or preserve the linked bookings first. Clients with booking history cannot be permanently deleted.')
  }

  const cleanupResults = await Promise.all([
    admin.from('booking_portal_requests').delete().eq('client_id', id),
    admin.from('client_portal_codes').delete().eq('client_id', id),
    admin.from('client_portal_sessions').delete().eq('client_id', id),
    admin.from('notes').delete().eq('client_id', id),
  ])

  const cleanupError = cleanupResults.find((result) => result.error)?.error
  if (cleanupError) {
    redirectWithError(id, cleanupError.message || 'Could not remove related client records.')
  }

  const { error } = await admin
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) {
    redirectWithError(id, error.message || 'Could not delete the client.')
  }

  revalidatePath('/admin/clients')
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  redirect('/admin/clients')
}
