import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import { createEventAction } from '@/app/actions/events'

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

export default function NewEventPage() {
  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="New Event"
        subtitle="Create an event and choose whether it is public and featured."
        action={{ label: 'Back To Events', href: '/admin/events' }}
      />

      <form action={createEventAction} className="admin-section" style={{ padding: '24px' }}>
        <div className="admin-form-grid">
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Title *</span>
            <input name="title" required style={inputStyle()} />
          </label>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Date & Time *</span>
            <input name="event_date" type="datetime-local" required style={inputStyle()} />
          </label>

          <div className="admin-form-grid-two">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Venue</span>
              <input name="venue" style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">City</span>
              <input name="city" style={inputStyle()} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Description</span>
            <textarea name="description" rows={4} style={inputStyle()} />
          </label>

          <div className="admin-inline-options">
            <label>
              <input type="checkbox" name="public" defaultChecked />
              Public Event
            </label>
            <label>
              <input type="checkbox" name="featured" />
              Featured On Homepage
            </label>
            <label>
              <input type="checkbox" name="show_description" />
              Show Description Publicly
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn-primary">
              Create Event
            </button>
            <Link href="/admin/events" className="admin-btn-ghost">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
