'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Public submit ─────────────────────────────────────────────────────────────

export async function submitReview(formData: FormData) {
  const name       = (formData.get('name')       as string | null)?.trim()
  const event_type = (formData.get('event_type') as string | null)?.trim()
  const rating     = Number(formData.get('rating'))
  const message    = (formData.get('message')    as string | null)?.trim()

  if (!name || !message || !rating || rating < 1 || rating > 5) {
    return { error: 'Please fill in all required fields.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('reviews').insert({
    name,
    event_type: event_type || null,
    rating,
    message,
    approved: false,
  })

  if (error) {
    console.error('Review insert error:', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}

// ── Admin: approve / reject ───────────────────────────────────────────────────

export async function approveReview(id: string) {
  const supabase = createAdminClient()
  await supabase.from('reviews').update({ approved: true }).eq('id', id)
  revalidatePath('/admin/reviews')
  revalidatePath('/')
}

export async function rejectReview(id: string) {
  const supabase = createAdminClient()
  await supabase.from('reviews').delete().eq('id', id)
  revalidatePath('/admin/reviews')
  revalidatePath('/')
}
