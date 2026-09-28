'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  registerUploadedMediaAction,
  type MediaUploadTarget,
} from '@/app/actions/media-upload'

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

export default function MediaUploader({
  target,
  targetId,
}: {
  target: MediaUploadTarget
  targetId: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [publish, setPublish] = useState(true)
  const [makeCover, setMakeCover] = useState(target === 'portfolio')
  const [statuses, setStatuses] = useState<UploadStatus[]>([])

  async function upload(files: FileList | null) {
    if (!files?.length || busy) return

    const selected = Array.from(files)
    setBusy(true)
    setStatuses(selected.map((file) => ({ name: file.name, state: 'uploading' })))

    const supabase = createClient()
    let firstImageCanBeCover = makeCover

    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index]
      const mediaType = mediaTypeFor(file)

      if (!mediaType || !ALLOWED_TYPES.has(file.type)) {
        setStatuses((current) => current.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, state: 'error', note: 'Unsupported file type.' }
            : item
        ))
        continue
      }

      if (file.size > MAX_FILE_BYTES) {
        setStatuses((current) => current.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, state: 'error', note: 'File is larger than 100 MB.' }
            : item
        ))
        continue
      }

      const folder = target === 'event' ? 'events' : 'portfolio'
      const path = `${folder}/${targetId}/${Date.now()}-${crypto.randomUUID()}-${safeFilename(file.name)}`

      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, {
          cacheControl: '31536000',
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        setStatuses((current) => current.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, state: 'error', note: uploadError.message }
            : item
        ))
        continue
      }

      const useAsCover = target === 'portfolio' && firstImageCanBeCover && mediaType === 'image'
      const result = await registerUploadedMediaAction({
        target,
        targetId,
        storagePath: path,
        mediaType,
        public: publish,
        makeCover: useAsCover,
      })

      if (!result.ok) {
        setStatuses((current) => current.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, state: 'error', note: result.error || 'Could not attach uploaded media.' }
            : item
        ))
        continue
      }

      if (useAsCover) firstImageCanBeCover = false

      setStatuses((current) => current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              state: 'done',
              note: result.error || (useAsCover ? 'Uploaded · set as cover' : 'Uploaded'),
            }
          : item
      ))
    }

    if (inputRef.current) inputRef.current.value = ''
    setBusy(false)
    router.refresh()
  }

  return (
    <div style={{
      display: 'grid',
      gap: '14px',
      padding: '18px',
      marginBottom: '22px',
      border: '1px solid var(--border)',
      background: 'rgba(255,255,255,.018)',
    }}>
      <div>
        <div className="admin-field-label" style={{ marginBottom: '6px' }}>
          Upload From Device
        </div>
        <div className="muted" style={{ fontSize: '12px', lineHeight: 1.6 }}>
          Select one or several photos/videos. They upload directly to site storage and are attached to this {target === 'event' ? 'event' : 'archive entry'} automatically.
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
        disabled={busy}
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

      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '12px' }}>
          <input
            type="checkbox"
            checked={publish}
            onChange={(event) => setPublish(event.target.checked)}
            disabled={busy}
          />
          Publish uploaded media
        </label>

        {target === 'portfolio' ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={makeCover}
              onChange={(event) => setMakeCover(event.target.checked)}
              disabled={busy}
            />
            Use first uploaded photo as cover
          </label>
        ) : null}
      </div>

      <div className="muted" style={{ fontSize: '11px', lineHeight: 1.5 }}>
        Maximum 100 MB per file. JPEG, PNG, WebP, GIF, AVIF, HEIC/HEIF, MP4, MOV, and WebM are accepted.
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
              <span style={{
                flexShrink: 0,
                color: item.state === 'error'
                  ? '#e85d75'
                  : item.state === 'done'
                    ? '#34d399'
                    : 'var(--gold)',
              }}>
                {item.state === 'uploading' ? 'Uploading…' : item.note || item.state}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
