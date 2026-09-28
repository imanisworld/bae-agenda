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


function requiredHttpUrl(value: FormDataEntryValue | null): string | null {
  const raw = optionalString(value)
  if (!raw) return null

  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function optionalHttpUrl(value: FormDataEntryValue | null): string | null {
  const raw = optionalString(value)
  if (!raw) return null
  return requiredHttpUrl(raw)
}

function parseSortOrder(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.trim()) return 0
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
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

  if (nextValue) {
    const { data: event, error: lookupError } = await admin
      .from('events')
      .select('event_timezone')
      .eq('id', id)
      .maybeSingle()

    if (lookupError || !event) {
      redirectWithError('/admin/events', 'Could not verify this event before publishing.')
    }

    if (!event.event_timezone || !isValidTimeZone(event.event_timezone)) {
      redirectWithError('/admin/events', 'Add a valid event time zone before publishing this event.')
    }
  }

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


export async function addEventMediaAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()

  const eventId = optionalString(formData.get('event_id'))
  const mediaType = optionalString(formData.get('media_type'))
  const mediaUrl = requiredHttpUrl(formData.get('media_url'))
  const posterUrl = optionalHttpUrl(formData.get('poster_url'))

  if (!eventId || (mediaType !== 'image' && mediaType !== 'video') || !mediaUrl) {
    redirectWithError(
      eventId ? `/admin/events/${eventId}` : '/admin/events',
      'Event, media type, and a valid http(s) media URL are required.'
    )
  }

  const { error } = await admin.from('event_media').insert({
    event_id: eventId,
    media_type: mediaType,
    media_url: mediaUrl,
    poster_url: posterUrl,
    caption: optionalString(formData.get('caption')),
    sort_order: parseSortOrder(formData.get('sort_order')),
    public: formData.get('public') === 'on',
  })

  if (error) {
    redirectWithError(`/admin/events/${eventId}`, error.message || 'Unable to add event media.')
  }

  revalidatePath(`/admin/events/${eventId}`)
  revalidatePath('/events')
  redirect(`/admin/events/${eventId}?success=Media%20added`)
}

export async function updateEventMediaAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()

  const eventId = optionalString(formData.get('event_id'))
  const mediaId = optionalString(formData.get('media_id'))
  const posterUrl = optionalHttpUrl(formData.get('poster_url'))

  if (!eventId || !mediaId) {
    redirectWithError('/admin/events', 'Missing event media id.')
  }

  const { error } = await admin
    .from('event_media')
    .update({
      poster_url: posterUrl,
      caption: optionalString(formData.get('caption')),
      sort_order: parseSortOrder(formData.get('sort_order')),
      public: formData.get('public') === 'on',
    })
    .eq('id', mediaId)
    .eq('event_id', eventId)

  if (error) {
    redirectWithError(`/admin/events/${eventId}`, error.message || 'Unable to update event media.')
  }

  revalidatePath(`/admin/events/${eventId}`)
  revalidatePath('/events')
  redirect(`/admin/events/${eventId}?success=Media%20updated`)
}

export async function deleteEventMediaAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()

  const eventId = optionalString(formData.get('event_id'))
  const mediaId = optionalString(formData.get('media_id'))
  if (!eventId || !mediaId) {
    redirectWithError('/admin/events', 'Missing event media id.')
  }

  const { error } = await admin
    .from('event_media')
    .delete()
    .eq('id', mediaId)
    .eq('event_id', eventId)

  if (error) {
    redirectWithError(`/admin/events/${eventId}`, error.message || 'Unable to delete event media.')
  }

  revalidatePath(`/admin/events/${eventId}`)
  revalidatePath('/events')
  redirect(`/admin/events/${eventId}?success=Media%20deleted`)
}
