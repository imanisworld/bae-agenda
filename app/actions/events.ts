'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'

async function requireAuthedUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/admin/login')
}

function redirectWithError(path: string, message: string) {
  const params = new URLSearchParams({ error: message })
  redirect(`${path}?${params.toString()}`)
}

async function generateUniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  title: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(title) || 'event'

  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`
    let query = admin.from('events').select('id').eq('slug', candidate).limit(1)
    if (excludeId) query = query.neq('id', excludeId)
    const { data, error } = await query
    if (!error && (!data || data.length === 0)) {
      return candidate
    }
  }

  return `${base}-${Date.now()}`
}

function parseDateTimeLocal(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function optionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export async function createEventAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()

  const titleRaw = formData.get('title')
  const title = typeof titleRaw === 'string' ? titleRaw.trim() : ''
  const eventDate = parseDateTimeLocal(formData.get('event_date'))
  if (!title || !eventDate) {
    redirectWithError('/admin/events', 'Title and date are required to create an event.')
  }

  const slug = await generateUniqueSlug(admin, title)

  const { error } = await admin.from('events').insert({
    title,
    slug,
    event_date: eventDate,
    venue: optionalString(formData.get('venue')),
    city: optionalString(formData.get('city')),
    description: optionalString(formData.get('description')),
    public: formData.get('public') === 'on',
    featured: formData.get('featured') === 'on',
  })
  if (error) {
    redirectWithError('/admin/events', error.message || 'Unable to create event.')
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath('/')
  redirect('/admin/events')
}

export async function updateEventAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()

  const id = optionalString(formData.get('id'))
  const titleRaw = formData.get('title')
  const title = typeof titleRaw === 'string' ? titleRaw.trim() : ''
  const eventDate = parseDateTimeLocal(formData.get('event_date'))
  if (!id || !title || !eventDate) {
    redirectWithError('/admin/events', 'Title and date are required to update an event.')
  }

  const slug = await generateUniqueSlug(admin, title, id ?? undefined)

  const { error } = await admin
    .from('events')
    .update({
      title,
      slug,
      event_date: eventDate,
      venue: optionalString(formData.get('venue')),
      city: optionalString(formData.get('city')),
      description: optionalString(formData.get('description')),
      public: formData.get('public') === 'on',
      featured: formData.get('featured') === 'on',
    })
    .eq('id', id)
  if (error) {
    redirectWithError('/admin/events', error.message || 'Unable to update event.')
  }

  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${id}`)
  revalidatePath('/events')
  revalidatePath('/')
  redirect('/admin/events')
}

export async function deleteEventAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  if (!id) redirectWithError('/admin/events', 'Missing event id.')

  const { error } = await admin.from('events').delete().eq('id', id)
  if (error) {
    redirectWithError('/admin/events', error.message || 'Unable to delete event.')
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath('/')
  redirect('/admin/events')
}

export async function toggleEventPublicAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  if (!id) redirectWithError('/admin/events', 'Missing event id.')

  const nextValue = formData.get('next_public') === 'true'
  const { error } = await admin.from('events').update({ public: nextValue }).eq('id', id)
  if (error) {
    redirectWithError('/admin/events', error.message || 'Unable to update event visibility.')
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath('/')
  redirect('/admin/events')
}

export async function toggleEventFeaturedAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  if (!id) redirectWithError('/admin/events', 'Missing event id.')

  const nextValue = formData.get('next_featured') === 'true'
  const { error } = await admin.from('events').update({ featured: nextValue }).eq('id', id)
  if (error) {
    redirectWithError('/admin/events', error.message || 'Unable to update featured state.')
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath('/')
  redirect('/admin/events')
}
