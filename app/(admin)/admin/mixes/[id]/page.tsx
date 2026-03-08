import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { deleteMixAction, updateMixAction } from '@/app/actions/mixes'

interface MixRow {
  id: string
  title: string
  description: string | null
  genre: string | null
  duration: number | null
  embed_url: string | null
  cover_url: string | null
  is_featured: boolean
  sort_order: number
  published_at: string | null
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    background: 'var(--off-black)',
    border: '1px solid var(--border)',
    color: 'var(--white)',
    padding: '11px 13px',
    fontSize: '13px',
    fontFamily: 'DM Sans, sans-serif',
  }
}

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const offsetMs = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}

async function getMix(id: string): Promise<MixRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('mixes')
    .select('id, title, description, genre, duration, embed_url, cover_url, is_featured, sort_order, published_at')
    .eq('id', id)
    .maybeSingle()

  return (data as MixRow | null) ?? null
}

export default async function EditMixPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const mix = await getMix(id)
  if (!mix) notFound()

  return (
    <div style={{ padding: '40px 48px', maxWidth: '900px' }}>
      <PageHeader
        title="Edit Mix"
        subtitle="Update metadata, publishing, and featured settings."
        action={{ label: 'Back To Mixes', href: '/admin/mixes' }}
      />

      <form action={updateMixAction} className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <input type="hidden" name="id" value={mix.id} />
        <div style={{ display: 'grid', gap: '16px' }}>
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Title *</span>
            <input name="title" required defaultValue={mix.title} style={inputStyle()} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Genre</span>
              <input name="genre" defaultValue={mix.genre ?? ''} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Duration (seconds)</span>
              <input name="duration" type="number" min={0} defaultValue={mix.duration ?? undefined} style={inputStyle()} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Embed URL</span>
              <input name="embed_url" type="url" defaultValue={mix.embed_url ?? ''} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Cover URL</span>
              <input name="cover_url" type="url" defaultValue={mix.cover_url ?? ''} style={inputStyle()} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Description</span>
            <textarea name="description" rows={4} defaultValue={mix.description ?? ''} style={inputStyle()} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Sort Order</span>
              <input name="sort_order" type="number" min={0} defaultValue={mix.sort_order} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Published At</span>
              <input name="published_at" type="datetime-local" defaultValue={toDateTimeLocal(mix.published_at)} style={inputStyle()} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--white)' }}>
              <input type="checkbox" name="published" defaultChecked={Boolean(mix.published_at)} />
              Published
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--white)' }}>
              <input type="checkbox" name="is_featured" defaultChecked={mix.is_featured} />
              Featured On Homepage
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <button type="submit" className="admin-btn-primary">
              Save Changes
            </button>
            <Link href="/admin/mixes" className="admin-btn-ghost">
              Cancel
            </Link>
          </div>
        </div>
      </form>

      <form action={deleteMixAction}>
        <input type="hidden" name="id" value={mix.id} />
        <button
          type="submit"
          className="admin-btn-ghost"
          style={{
            color: '#e85d75',
            borderColor: 'rgba(232,93,117,0.35)',
          }}
        >
          Delete Mix
        </button>
      </form>
    </div>
  )
}
