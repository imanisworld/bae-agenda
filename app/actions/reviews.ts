'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/admin-auth'
import { limitReviewSubmission } from '@/lib/ratelimit'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'https://thebaeagenda.com',
  'https://www.thebaeagenda.com',
])

const ReviewSchema = z.object({
  name: z.string().trim().min(1).max(80),
  event_type: z.string().trim().max(80).optional().default(''),
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().trim().min(10).max(1500),
  website: z.string().trim().max(200).optional().default(''),
  startedAt: z.string().trim().optional().default(''),
})

// ── Public submit ─────────────────────────────────────────────────────────────

export async function submitReview(formData: FormData) {
  const requestHeaders = await headers()
  const rateLimit = await limitReviewSubmission(requestHeaders)

  if (!rateLimit.success) {
    return {
      error: 'Too many review attempts. Please wait a few minutes and try again.',
    }
  }

  const origin = requestHeaders.get('origin') ?? ''
  const contentType = requestHeaders.get('content-type') ?? ''

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return { error: 'Forbidden submission.' }
  }

  if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
    return { error: 'Invalid submission.' }
  }

  const parsed = ReviewSchema.safeParse({
    name: formData.get('name'),
    event_type: formData.get('event_type'),
    rating: formData.get('rating'),
    message: formData.get('message'),
    website: formData.get('website'),
    startedAt: formData.get('startedAt'),
  })

  if (!parsed.success) {
    return { error: 'Please complete all required review fields.' }
  }

  const { name, event_type, rating, message, website, startedAt } = parsed.data

  if (website !== '') {
    return { success: true }
  }

  if (!startedAt || Number.isNaN(Number(startedAt))) {
    return { error: 'Invalid submission.' }
  }

  const elapsedMs = Date.now() - Number(startedAt)
  if (elapsedMs < 1500) {
    return { error: 'Please take a moment to complete the form before submitting.' }
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
  await requireAdminUser()
  const supabase = createAdminClient()
  await supabase.from('reviews').update({ approved: true }).eq('id', id)
  revalidatePath('/admin/reviews')
  revalidatePath('/')
  revalidatePath('/book')
}

export async function rejectReview(id: string) {
  await requireAdminUser()
  const supabase = createAdminClient()
  await supabase.from('reviews').delete().eq('id', id)
  revalidatePath('/admin/reviews')
  revalidatePath('/')
  revalidatePath('/book')
}
