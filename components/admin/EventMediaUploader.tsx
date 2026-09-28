'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registerEventUploadAction } from '@/app/actions/event-media-upload'

const MEDIA_BUCKET = 'site-media'
const MAX_FILE_BYTES = 100 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
])

type UploadStatus = {
  name: string
  state: 'uploading' | 'done' | 'error'
  note?: string
}

function safeFilename(name: string) {
  const normalized = name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .toLowerCase()

  return normalized || 'media'
}

function mediaTypeFor(file: File): 'image' | 'video' | null {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return null
}

export default function EventMediaUploader({ eventId }: { eventId: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [publish, setPublish] = useState(true)
  const [rightsConfirmed, setRightsConfirmed] = useState(false)
  const [statuses, setStatuses] = useState<UploadStatus[]>([])

  async function upload(files: FileList | null) {
    if (!files?.length || busy || !rightsConfirmed) return

    const selected = Array.from(files)
    setBusy(true)
    setStatuses(selected.map((file) => ({ name: file.name, state: 'uploading' })))

    const supabase = createClient()

    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index]
      const mediaType = mediaTypeFor(file)

      if (!mediaType || !ALLOWED_TYPES.has(file.type)) {
        setStatuses((current) => current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, state: 'error', note: 'Unsupported file type.' } : item
        ))
        continue
      }

      if (file.size > MAX_FILE_BYTES) {
        setStatuses((current) => current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, state: 'error', note: 'File is larger than 100 MB.' } : item
        ))
        continue
      }

      const path = `events/${eventId}/${Date.now()}-${crypto.randomUUID()}-${safeFilename(file.name)}`
      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, {
          cacheControl: '31536000',
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        setStatuses((current) => current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, state: 'error', note: uploadError.message } : item
        ))
        continue
      }

      const result = await registerEventUploadAction({
        eventId,
        storagePath: path,
        mediaType,
        public: publish,
        rightsConfirmed,
      })

      setStatuses((current) => current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              state: result.ok ? 'done' : 'error',
              note: result.ok ? 'Uploaded' : result.error || 'Could not attach uploaded media.',
            }
          : item
      ))
    }

    if (inputRef.current) inputRef.current.value = ''
    setBusy(false)
    router.refresh()
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: '14px',
        padding: '18px',
        marginBottom: '22px',
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,.018)',
      }}
    >
      <div>
        <div className="admin-field-label" style={{ marginBottom: '6px' }}>Upload From Device</div>
        <div className="muted" style={{ fontSize: '12px', lineHeight: 1.6 }}>
          Select one or several photos/videos. They upload directly to site storage and attach to this event automatically.
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--muted)', fontSize: '12px', lineHeight: 1.5 }}>
        <input
          type="checkbox"
          checked={rightsConfirmed}
          onChange={(event) => setRightsConfirmed(event.target.checked)}
          disabled={busy}
          style={{ marginTop: '2px' }}
        />
        I own this media or have permission from the copyright owner to publish it on The Bae Agenda.
      </label>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
        disabled={busy || !rightsConfirmed}
        aria-describedby="event-media-rights-note"
        onChange={(event) => void upload(event.target.files)}
        style={{
          width: '100%',
          padding: '11px',
          border: '1px solid var(--border)',
          background: 'var(--off-black)',
          color: 'var(--white)',
          fontSize: '12px',
        }}
      />

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '12px' }}>
        <input
          type="checkbox"
          checked={publish}
          onChange={(event) => setPublish(event.target.checked)}
          disabled={busy}
        />
        Publish uploaded media
      </label>

      <div id="event-media-rights-note" className="muted" style={{ fontSize: '11px', lineHeight: 1.5 }}>
        Only upload media you own or are authorized to publish. Maximum 100 MB per file. JPEG, PNG, WebP, GIF, AVIF, HEIC/HEIF, MP4, MOV, and WebM are accepted.
      </div>

      {statuses.length > 0 ? (
        <div style={{ display: 'grid', gap: '7px' }} aria-live="polite">
          {statuses.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '8px 10px',
                border: '1px solid var(--border)',
                fontSize: '11px',
              }}
            >
              <span style={{ overflowWrap: 'anywhere' }}>{item.name}</span>
              <span
                style={{
                  flexShrink: 0,
                  color: item.state === 'error'
                    ? '#e85d75'
                    : item.state === 'done'
                      ? '#34d399'
                      : 'var(--gold)',
                }}
              >
                {item.state === 'uploading' ? 'Uploading…' : item.note || item.state}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
