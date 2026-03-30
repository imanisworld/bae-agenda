import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { deleteEventAction, updateEventAction } from '@/app/actions/events'
import { EVENT_CITY_OPTIONS, EVENT_TIME_OPTIONS } from '@/lib/event-form-options'

interface EventRow {
  id: string
  title: string
  event_date: string
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

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const offsetMs = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toDateInputValue(iso: string): string {
  return toDateTimeLocal(iso).slice(0, 10)
}

function toTimeInputValue(iso: string): string {
  return toDateTimeLocal(iso).slice(11, 16)
}

async function getEvent(id: string): Promise<EventRow | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('events')
    .select('id, title, event_date, venue, city, description, public, featured, show_description')
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
                defaultValue={toDateInputValue(event.event_date)}
                style={inputStyle()}
              />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Start Time *</span>
              <select
                name="event_time"
                required
                defaultValue={toTimeInputValue(event.event_date)}
                style={inputStyle()}
              >
                {EVENT_TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-form-grid-two">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Venue / Address</span>
              <input
                name="venue"
                defaultValue={event.venue ?? ''}
                placeholder="Venue name or street address"
                autoComplete="street-address"
                style={inputStyle()}
              />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">City</span>
              <input
                name="city"
                list="event-city-options"
                defaultValue={event.city ?? ''}
                placeholder="Choose or type any city"
                autoComplete="address-level2"
                style={inputStyle()}
              />
            </label>
          </div>

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

        <datalist id="event-city-options">
          {EVENT_CITY_OPTIONS.map((city) => <option key={city} value={city} />)}
        </datalist>
      </form>

      <form action={deleteEventAction}>
        <input type="hidden" name="id" value={event.id} />
        <button
          type="submit"
          className="admin-btn-ghost"
          style={{
            color: '#e85d75',
            borderColor: 'rgba(232,93,117,0.35)',
          }}
        >
          Delete Event
        </button>
      </form>
    </div>
  )
}
