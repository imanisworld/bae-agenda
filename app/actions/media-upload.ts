'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const MEDIA_BUCKET = 'site-media'

export type MediaUploadTarget = 'event' | 'portfolio'
export type UploadedMediaType = 'image' | 'video'

export interface RegisterUploadedMediaInput {
  target: MediaUploadTarget
  targetId: string
  storagePath: string
  mediaType: UploadedMediaType
  caption?: string | null
  public?: boolean
  makeCover?: boolean
}

export interface RegisterUploadedMediaResult {
  ok: boolean
  error?: string
  publicUrl?: string
}

function cleanCaption(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed.slice(0, 500) : null
}

function validStoragePath(target: MediaUploadTarget, targetId: string, path: string) {
  if (!targetId || !path || path.includes('..') || path.startsWith('/')) return false
  const prefix = target === 'event' ? `events/${targetId}/` : `portfolio/${targetId}/`
  return path.startsWith(prefix)
}

export async function registerUploadedMediaAction(
  input: RegisterUploadedMediaInput
): Promise<RegisterUploadedMediaResult> {
  await requireAdminUser()

  if (
    (input.target !== 'event' && input.target !== 'portfolio') ||
    (input.mediaType !== 'image' && input.mediaType !== 'video') ||
    !validStoragePath(input.target, input.targetId, input.storagePath)
  ) {
    return { ok: false, error: 'Invalid media upload.' }
  }

  const admin = createAdminClient()

  const parentTable = input.target === 'event' ? 'events' : 'portfolio_entries'
  const { data: parent, error: parentError } = await admin
    .from(parentTable)
    .select('id')
    .eq('id', input.targetId)
    .maybeSingle()

  if (parentError || !parent) {
    await admin.storage.from(MEDIA_BUCKET).remove([input.storagePath])
    return { ok: false, error: 'The event/archive entry could not be found.' }
  }

  const mediaTable = input.target === 'event' ? 'event_media' : 'portfolio_media'
  const foreignKey = input.target === 'event' ? 'event_id' : 'portfolio_entry_id'

  const { data: lastRow } = await admin
    .from(mediaTable)
    .select('sort_order')
    .eq(foreignKey, input.targetId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSortOrder = typeof lastRow?.sort_order === 'number' ? lastRow.sort_order + 1 : 0
  const { data: publicData } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(input.storagePath)
  const publicUrl = publicData.publicUrl

  const { error: insertError } = await admin.from(mediaTable).insert({
    [foreignKey]: input.targetId,
    media_type: input.mediaType,
    media_url: publicUrl,
    storage_path: input.storagePath,
    poster_url: null,
    caption: cleanCaption(input.caption),
    sort_order: nextSortOrder,
    public: input.public !== false,
  })

  if (insertError) {
    await admin.storage.from(MEDIA_BUCKET).remove([input.storagePath])
    return { ok: false, error: insertError.message || 'Unable to attach uploaded media.' }
  }

  if (input.target === 'portfolio' && input.makeCover && input.mediaType === 'image') {
    const { error: coverError } = await admin
      .from('portfolio_entries')
      .update({ photo_url: publicUrl })
      .eq('id', input.targetId)

    if (coverError) {
      return {
        ok: true,
        publicUrl,
        error: 'Media uploaded, but the cover photo could not be updated.',
      }
    }
  }

  if (input.target === 'event') {
    revalidatePath(`/admin/events/${input.targetId}`)
    revalidatePath('/events')
  } else {
    revalidatePath(`/admin/portfolio/${input.targetId}`)
    revalidatePath('/portfolio')
  }

  revalidatePath('/')
  return { ok: true, publicUrl }
}
