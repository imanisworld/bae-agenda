import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton'
import EventLocationFields from '@/components/admin/EventLocationFields'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { deleteEventAction, updateEventAction } from '@/app/actions/events'
import { getEventInputDateTime } from '@/lib/date-time'
import { suggestEventTimeZone } from '@/lib/event-form-options'

interface EventRow {
  id: string
  title: string
  event_date: string
  event_timezone: string | null
  venue: string | null
  city: string | null
  description: string | null
  public: boolean
  featured: boolean
  show_description: boolean
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

async function getEvent(id: string): Promise<EventRow | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('events')
    .select('id, title, event_date, event_timezone, venue, city, description, public, featured, show_description')
    .eq('id', id)
    .maybeSingle()

  return (data as EventRow | null) ?? null
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) notFound()

  const legacyTimeZone = !event.event_timezone
  const inputDateTime = getEventInputDateTime(event.event_date, event.event_timezone)
  const suggestedTimeZone = event.event_timezone ?? suggestEventTimeZone(event.city) ?? ''

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Edit Event"
        subtitle="Update event details, visibility, and featured status."
        action={{ label: 'Back To Events', href: '/admin/events' }}
      />

      <form action={updateEventAction} className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <input type="hidden" name="id" value={event.id} />
        <div className="admin-form-grid">
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Title *</span>
            <input name="title" required defaultValue={event.title} style={inputStyle()} />
          </label>

          <div className="admin-form-grid-two">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Event Date *</span>
              <input
                name="event_date"
                type="date"
                required
                defaultValue={inputDateTime?.date ?? ''}
                style={inputStyle()}
              />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Start Time *</span>
              <input
                name="event_time"
                type="time"
                step={1800}
                required
                defaultValue={legacyTimeZone ? '' : inputDateTime?.time ?? ''}
                style={inputStyle()}
              />
              {legacyTimeZone && (
                <span style={{ color: 'var(--gold)', fontSize: '11px', lineHeight: 1.5 }}>
                  Start time must be reviewed before this legacy event can be saved.
                </span>
              )}
            </label>
          </div>

          <EventLocationFields
            initialVenue={event.venue ?? ''}
            initialCity={event.city ?? ''}
            initialTimeZone={suggestedTimeZone}
            legacyTimeZone={legacyTimeZone}
          />

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Description</span>
            <textarea name="description" rows={4} defaultValue={event.description ?? ''} style={inputStyle()} />
          </label>

          <div className="admin-inline-options">
            <label>
              <input type="checkbox" name="public" defaultChecked={event.public} />
              Public Event
            </label>
            <label>
              <input type="checkbox" name="featured" defaultChecked={event.featured} />
              Featured On Homepage
            </label>
            <label>
              <input type="checkbox" name="show_description" defaultChecked={event.show_description} />
              Show Description Publicly
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn-primary">
              Save Changes
            </button>
            <Link href="/admin/events" className="admin-btn-ghost">
              Cancel
            </Link>
          </div>
        </div>
      </form>

      <form action={deleteEventAction}>
        <input type="hidden" name="id" value={event.id} />
        <ConfirmSubmitButton
          message="Delete this event? This cannot be undone."
          className="admin-btn-ghost"
          style={{
            color: '#e85d75',
            borderColor: 'rgba(232,93,117,0.35)',
          }}
        >
          Delete Event
        </ConfirmSubmitButton>
      </form>
    </div>
  )
}
