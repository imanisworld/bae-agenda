'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const MEDIA_BUCKET = 'site-media'

export interface RegisterEventUploadInput {
  eventId: string
  storagePath: string
  mediaType: 'image' | 'video'
  public?: boolean
  rightsConfirmed: boolean
}

export interface RegisterEventUploadResult {
  ok: boolean
  error?: string
}

function validPath(eventId: string, path: string) {
  return Boolean(
    eventId &&
    path &&
    !path.includes('..') &&
    !path.startsWith('/') &&
    path.startsWith(`events/${eventId}/`)
  )
}

export async function registerEventUploadAction(
  input: RegisterEventUploadInput
): Promise<RegisterEventUploadResult> {
  await requireAdminUser()

  if (
    (input.mediaType !== 'image' && input.mediaType !== 'video') ||
    !input.rightsConfirmed ||
    !validPath(input.eventId, input.storagePath)
  ) {
    return { ok: false, error: 'Invalid media upload.' }
  }

  const admin = createAdminClient()
  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id')
    .eq('id', input.eventId)
    .maybeSingle()

  if (eventError || !event) {
    await admin.storage.from(MEDIA_BUCKET).remove([input.storagePath])
    return { ok: false, error: 'The event could not be found.' }
  }

  const { data: lastRow } = await admin
    .from('event_media')
    .select('sort_order')
    .eq('event_id', input.eventId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: publicData } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(input.storagePath)
  const { error } = await admin.from('event_media').insert({
    event_id: input.eventId,
    media_type: input.mediaType,
    media_url: publicData.publicUrl,
    storage_path: input.storagePath,
    poster_url: null,
    caption: null,
    sort_order: typeof lastRow?.sort_order === 'number' ? lastRow.sort_order + 1 : 0,
    public: input.public !== false,
  })

  if (error) {
    await admin.storage.from(MEDIA_BUCKET).remove([input.storagePath])
    return { ok: false, error: error.message || 'Unable to attach uploaded media.' }
  }

  revalidatePath(`/admin/events/${input.eventId}`)
  revalidatePath('/events')
  revalidatePath('/')
  return { ok: true }
}
