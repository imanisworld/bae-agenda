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

  revalidatePath('/admin/clients')
  revalidatePath(`/admin/clients/${id}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/invoices')
  redirect(`/admin/clients/${id}?success=${encodeURIComponent('Client details saved.')}`)
}
