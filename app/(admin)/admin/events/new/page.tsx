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
    <div style={{ padding: '40px 48px', maxWidth: '900px' }}>
      <PageHeader
        title="New Event"
        subtitle="Create an event and choose whether it is public and featured."
        action={{ label: 'Back To Events', href: '/admin/events' }}
      />

      <form action={createEventAction} className="admin-section" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Title *</span>
            <input name="title" required style={inputStyle()} />
          </label>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Date & Time *</span>
            <input name="event_date" type="datetime-local" required style={inputStyle()} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--white)' }}>
              <input type="checkbox" name="public" defaultChecked />
              Public Event
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--white)' }}>
              <input type="checkbox" name="featured" />
              Featured On Homepage
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
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
