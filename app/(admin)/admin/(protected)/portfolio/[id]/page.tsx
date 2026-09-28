import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { deletePortfolioEntryAction, updatePortfolioEntryAction } from '@/app/actions/portfolio'

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

export default async function EditPortfolioEntryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const entry = await getEntry(id)
  if (!entry) notFound()

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Edit Entry"
        subtitle="Update gig details, tags, and featured status."
        action={{ label: 'Back To Portfolio', href: '/admin/portfolio' }}
      />

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
              <input
                name="year"
                type="number"
                required
                min="2000"
                max="2100"
                defaultValue={entry.year}
                style={inputStyle()}
              />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Date</span>
              <input
                name="date"
                type="date"
                defaultValue={entry.date ?? ''}
                style={inputStyle()}
              />
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
            <input
              name="tags"
              defaultValue={(entry.tags ?? []).join(', ')}
              style={inputStyle()}
            />
          </label>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Photo URL</span>
            <input
              name="photo_url"
              type="url"
              defaultValue={entry.photo_url ?? ''}
              style={inputStyle()}
            />
          </label>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Notes</span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={entry.notes ?? ''}
              style={inputStyle()}
            />
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
            <button type="submit" className="admin-btn-primary">
              Save Changes
            </button>
            <Link href="/admin/portfolio" className="admin-btn-ghost">
              Cancel
            </Link>
          </div>
        </div>
      </form>

      <form action={deletePortfolioEntryAction}>
        <input type="hidden" name="id" value={entry.id} />
        <ConfirmSubmitButton
          message="Delete this portfolio entry? This cannot be undone."
          className="admin-btn-ghost"
          style={{ color: '#e85d75', borderColor: 'rgba(232,93,117,0.35)' }}
        >
          Delete Entry
        </ConfirmSubmitButton>
      </form>
    </div>
  )
}
