'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin-auth'
import { isValidTimeZone, toEventISO } from '@/lib/date-time'
import { suggestEventTimeZone } from '@/lib/event-form-options'

function redirectWithError(path: string, message: string): never {
  const params = new URLSearchParams({ error: message })
  redirect(`${path}?${params.toString()}`)
}

function parseEventDateTime(formData: FormData): { iso: string; timeZone: string } | null {
  const eventDateRaw = formData.get('event_date')
  const eventTimeRaw = formData.get('event_time')
  const eventTimeZoneRaw = formData.get('event_timezone')

  const eventDate = typeof eventDateRaw === 'string' ? eventDateRaw.trim() : ''
  const eventTime = typeof eventTimeRaw === 'string' ? eventTimeRaw.trim() : ''
  const submittedTimeZone = typeof eventTimeZoneRaw === 'string' ? eventTimeZoneRaw.trim() : ''
  const cityRaw = formData.get('city')
  const city = typeof cityRaw === 'string' ? cityRaw.trim() : ''
  const timeZone = submittedTimeZone || suggestEventTimeZone(city) || ''

  if (!eventDate || !eventTime || !timeZone || !isValidTimeZone(timeZone)) return null

  const iso = toEventISO(eventDate, timeZone, eventTime)
  return iso ? { iso, timeZone } : null
}

function optionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export async function createEventAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()

  const titleRaw = formData.get('title')
  const title = typeof titleRaw === 'string' ? titleRaw.trim() : ''
  const eventDateTime = parseEventDateTime(formData)
  if (!title || !eventDateTime) {
    redirectWithError('/admin/events', 'Title, date, start time, and a valid event time zone are required.')
  }

  const { error } = await admin.from('events').insert({
    title,
    event_date: eventDateTime.iso,
    event_timezone: eventDateTime.timeZone,
    venue: optionalString(formData.get('venue')),
    city: optionalString(formData.get('city')),
    description: optionalString(formData.get('description')),
    public: formData.get('public') === 'on',
    featured: formData.get('featured') === 'on',
    show_description: formData.get('show_description') === 'on',
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
  await requireAdminUser()
  const admin = createAdminClient()

  const id = optionalString(formData.get('id'))
  const titleRaw = formData.get('title')
  const title = typeof titleRaw === 'string' ? titleRaw.trim() : ''
  const eventDateTime = parseEventDateTime(formData)
  if (!id || !title || !eventDateTime) {
    redirectWithError('/admin/events', 'Title, date, start time, and a valid event time zone are required.')
  }

  const { error } = await admin
    .from('events')
    .update({
      title,
      event_date: eventDateTime.iso,
      event_timezone: eventDateTime.timeZone,
      venue: optionalString(formData.get('venue')),
      city: optionalString(formData.get('city')),
      description: optionalString(formData.get('description')),
      public: formData.get('public') === 'on',
      featured: formData.get('featured') === 'on',
      show_description: formData.get('show_description') === 'on',
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
  await requireAdminUser()
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
  await requireAdminUser()
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
  await requireAdminUser()
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
