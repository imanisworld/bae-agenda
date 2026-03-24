import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import { createPortfolioEntryAction } from '@/app/actions/portfolio'

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

const currentYear = new Date().getFullYear()

export default function NewPortfolioEntryPage() {
  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="New Portfolio Entry"
        subtitle="Add a gig to the history. Tags are comma-separated."
        action={{ label: 'Back To Portfolio', href: '/admin/portfolio' }}
      />

      <form action={createPortfolioEntryAction} className="admin-section" style={{ padding: '24px' }}>
        <div className="admin-form-grid">

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Event Name *</span>
            <input name="event_name" required style={inputStyle()} placeholder="Chreece Music Festival" />
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
                defaultValue={currentYear}
                style={inputStyle()}
              />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Date</span>
              <input name="date" type="date" style={inputStyle()} />
            </label>
          </div>

          <div className="admin-form-grid-two">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Venue</span>
              <input name="venue" style={inputStyle()} placeholder="Club Plex" />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">City *</span>
              <input name="city" required style={inputStyle()} placeholder="Indianapolis, IN" />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">State</span>
            <input name="state" style={inputStyle()} placeholder="IN" />
          </label>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Tags</span>
            <input
              name="tags"
              style={inputStyle()}
              placeholder="Festival, Hip-Hop, Music (comma-separated)"
            />
          </label>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Photo URL</span>
            <input name="photo_url" type="url" style={inputStyle()} placeholder="https://..." />
          </label>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Notes</span>
            <textarea name="notes" rows={3} style={inputStyle()} />
          </label>

          <div className="admin-inline-options">
            <label>
              <input type="checkbox" name="featured" />
              Featured (shown in highlights grid)
            </label>
            <label>
              <input type="checkbox" name="status" value="draft" />
              Save as Draft (hidden from public)
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn-primary">
              Create Entry
            </button>
            <Link href="/admin/portfolio" className="admin-btn-ghost">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
