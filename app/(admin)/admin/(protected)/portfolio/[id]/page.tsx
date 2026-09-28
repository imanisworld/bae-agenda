import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import AdminNotice from '@/components/admin/AdminNotice'
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import {
  addPortfolioMediaAction,
  deletePortfolioEntryAction,
  deletePortfolioMediaAction,
  updatePortfolioEntryAction,
  updatePortfolioMediaAction,
} from '@/app/actions/portfolio'

interface PortfolioEntry {
  id:         string
  event_name: string
  venue:      string | null
  city:       string
  state:      string | null
  year:       number
  date:       string | null
  tags:       string[]
  photo_url:  string | null
  featured:   boolean
  status:     string
  notes:      string | null
}

interface PortfolioMediaRow {
  id: string
  portfolio_entry_id: string
  media_type: 'image' | 'video'
  media_url: string
  poster_url: string | null
  caption: string | null
  sort_order: number
  public: boolean
  created_at: string
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

function getMessage(value: string | string[] | undefined) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

async function getEntry(id: string): Promise<PortfolioEntry | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('portfolio_entries')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message || 'Unable to load portfolio entry.')
  return (data as PortfolioEntry | null) ?? null
}

async function getEntryMedia(entryId: string): Promise<PortfolioMediaRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('portfolio_media')
    .select('id, portfolio_entry_id, media_type, media_url, poster_url, caption, sort_order, public, created_at')
    .eq('portfolio_entry_id', entryId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message || 'Unable to load portfolio media.')
  return (data ?? []) as PortfolioMediaRow[]
}

export default async function EditPortfolioEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ error?: string | string[]; success?: string | string[] }>
}) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const [entry, media] = await Promise.all([getEntry(id), getEntryMedia(id)])
  if (!entry) notFound()

  const errorMessage = getMessage(resolvedSearchParams?.error)
  const successMessage = getMessage(resolvedSearchParams?.success)

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Edit Entry"
        subtitle="Update gig details, featured status, and the media shown from the Full Archive."
        action={{ label: 'Back To Portfolio', href: '/admin/portfolio' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}
      {successMessage && (
        <div className="admin-preview-banner" style={{ marginBottom: '16px' }}>
          <span className="admin-preview-mark" aria-hidden="true">✓</span>
          <div className="admin-preview-title">{successMessage}</div>
        </div>
      )}

      <form
        action={updatePortfolioEntryAction}
        className="admin-section"
        style={{ padding: '24px', marginBottom: '16px' }}
      >
        <input type="hidden" name="id" value={entry.id} />
        <div className="admin-form-grid">
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Event Name *</span>
            <input name="event_name" required defaultValue={entry.event_name} style={inputStyle()} />
          </label>

          <div className="admin-form-grid-two">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Year *</span>
              <input name="year" type="number" required min="2000" max="2100" defaultValue={entry.year} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Date</span>
              <input name="date" type="date" defaultValue={entry.date ?? ''} style={inputStyle()} />
            </label>
          </div>

          <div className="admin-form-grid-two">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Venue</span>
              <input name="venue" defaultValue={entry.venue ?? ''} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">City *</span>
              <input name="city" required defaultValue={entry.city} style={inputStyle()} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">State</span>
            <input name="state" defaultValue={entry.state ?? ''} style={inputStyle()} placeholder="IN" />
          </label>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Tags (comma-separated)</span>
            <input name="tags" defaultValue={(entry.tags ?? []).join(', ')} style={inputStyle()} />
          </label>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Cover Photo URL</span>
            <input name="photo_url" type="url" defaultValue={entry.photo_url ?? ''} style={inputStyle()} />
            <span className="muted" style={{ fontSize: '11px', lineHeight: 1.5 }}>
              This remains the primary archive image and automatically becomes the first gallery photo unless it is already in the media list.
            </span>
          </label>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Notes</span>
            <textarea name="notes" rows={3} defaultValue={entry.notes ?? ''} style={inputStyle()} />
          </label>

          <div className="admin-inline-options">
            <label>
              <input type="checkbox" name="featured" defaultChecked={entry.featured} />
              Featured (shown in highlights grid)
            </label>
            <label>
              <input type="checkbox" name="status" value="draft" defaultChecked={entry.status === 'draft'} />
              Draft (hidden from public)
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn-primary">Save Changes</button>
            <Link href="/admin/portfolio" className="admin-btn-ghost">Cancel</Link>
          </div>
        </div>
      </form>

      <section className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ marginBottom: '20px' }}>
          <span className="admin-section-title">Full Archive Media</span>
          <p className="muted" style={{ margin: '7px 0 0', fontSize: '12px', lineHeight: 1.6 }}>
            Add the extra photos and video clips that should pop up when someone clicks this entry inside “See the full archive.”
          </p>
        </div>

        {media.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            {media.map((item, index) => (
              <div key={item.id} style={{ padding: '16px', border: '1px solid var(--border)', background: 'rgba(255,255,255,.015)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <div>
                    <strong style={{ color: 'var(--white)', fontSize: '13px' }}>
                      {index + 1}. {item.media_type === 'image' ? 'Photo' : 'Video'}
                    </strong>
                    <div className="muted" style={{ marginTop: '4px', fontSize: '11px', maxWidth: '560px', overflowWrap: 'anywhere' }}>
                      {item.media_url}
                    </div>
                  </div>
                  <span style={{ color: item.public ? '#34d399' : 'var(--muted)', fontSize: '10px', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                    {item.public ? 'Public' : 'Hidden'}
                  </span>
                </div>

                <form action={updatePortfolioMediaAction} className="admin-form-grid" style={{ gap: '12px' }}>
                  <input type="hidden" name="portfolio_entry_id" value={entry.id} />
                  <input type="hidden" name="media_id" value={item.id} />

                  <div className="admin-form-grid-two">
                    <label style={{ display: 'grid', gap: '7px' }}>
                      <span className="admin-field-label">Caption</span>
                      <input name="caption" defaultValue={item.caption ?? ''} style={inputStyle()} />
                    </label>
                    <label style={{ display: 'grid', gap: '7px' }}>
                      <span className="admin-field-label">Sort Order</span>
                      <input name="sort_order" type="number" defaultValue={item.sort_order} style={inputStyle()} />
                    </label>
                  </div>

                  <label style={{ display: 'grid', gap: '7px' }}>
                    <span className="admin-field-label">Video Poster URL</span>
                    <input name="poster_url" type="url" defaultValue={item.poster_url ?? ''} placeholder="Optional preview image" style={inputStyle()} />
                  </label>

                  <label style={{ display: 'flex', gap: '9px', alignItems: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                    <input type="checkbox" name="public" defaultChecked={item.public} />
                    Show this item in the public archive
                  </label>

                  <div className="admin-form-actions">
                    <button type="submit" className="admin-btn-ghost">Save Media</button>
                  </div>
                </form>

                <form action={deletePortfolioMediaAction} style={{ marginTop: '10px' }}>
                  <input type="hidden" name="portfolio_entry_id" value={entry.id} />
                  <input type="hidden" name="media_id" value={item.id} />
                  <ConfirmSubmitButton
                    message="Remove this photo/video from the Full Archive? The hosted file itself will not be deleted."
                    className="admin-btn-ghost"
                    style={{ color: '#e85d75', borderColor: 'rgba(232,93,117,.35)' }}
                  >
                    Remove Media
                  </ConfirmSubmitButton>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '18px', border: '1px dashed var(--border)', color: 'var(--muted)', fontSize: '12px', lineHeight: 1.6, marginBottom: '22px' }}>
            No extra media yet. If this entry already has a cover photo, that photo will still open from the Full Archive.
          </div>
        )}

        <form action={addPortfolioMediaAction} className="admin-form-grid">
          <input type="hidden" name="portfolio_entry_id" value={entry.id} />

          <div className="admin-form-grid-two">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-field-label">Media Type *</span>
              <select name="media_type" required defaultValue="image" style={inputStyle()}>
                <option value="image">Photo</option>
                <option value="video">Video</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-field-label">Sort Order</span>
              <input name="sort_order" type="number" defaultValue={media.length} style={inputStyle()} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-field-label">Media URL *</span>
            <input name="media_url" type="url" required placeholder="https://..." style={inputStyle()} />
            <span className="muted" style={{ fontSize: '11px', lineHeight: 1.5 }}>
              Photo URLs and direct playable video-file URLs work now. A phone upload flow can use Supabase Storage later without changing this archive.
            </span>
          </label>

          <div className="admin-form-grid-two">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-field-label">Caption</span>
              <input name="caption" placeholder="Optional caption or credit" style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-field-label">Video Poster URL</span>
              <input name="poster_url" type="url" placeholder="Optional preview image" style={inputStyle()} />
            </label>
          </div>

          <label style={{ display: 'flex', gap: '9px', alignItems: 'center', color: 'var(--muted)', fontSize: '12px' }}>
            <input type="checkbox" name="public" defaultChecked />
            Publish this media in the Full Archive
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn-primary">Add Media</button>
          </div>
        </form>
      </section>

      <form action={deletePortfolioEntryAction}>
        <input type="hidden" name="id" value={entry.id} />
        <ConfirmSubmitButton
          message="Delete this portfolio entry? This cannot be undone. Any Full Archive media records will also be removed."
          className="admin-btn-ghost"
          style={{ color: '#e85d75', borderColor: 'rgba(232,93,117,0.35)' }}
        >
          Delete Entry
        </ConfirmSubmitButton>
      </form>
    </div>
  )
}
