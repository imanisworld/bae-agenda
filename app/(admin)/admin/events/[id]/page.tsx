import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { deleteEventAction, updateEventAction } from '@/app/actions/events'

interface EventRow {
  id: string
  title: string
  event_date: string
  venue: string | null
  city: string | null
  description: string | null
  public: boolean
  featured: boolean
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

async function getEvent(id: string): Promise<EventRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('id, title, event_date, venue, city, description, public, featured')
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
    <div style={{ padding: '40px 48px', maxWidth: '900px' }}>
      <PageHeader
        title="Edit Event"
        subtitle="Update event details, visibility, and featured status."
        action={{ label: 'Back To Events', href: '/admin/events' }}
      />

      <form action={updateEventAction} className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <input type="hidden" name="id" value={event.id} />
        <div style={{ display: 'grid', gap: '16px' }}>
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Title *</span>
            <input name="title" required defaultValue={event.title} style={inputStyle()} />
          </label>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Date & Time *</span>
            <input
              name="event_date"
              type="datetime-local"
              required
              defaultValue={toDateTimeLocal(event.event_date)}
              style={inputStyle()}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Venue</span>
              <input name="venue" defaultValue={event.venue ?? ''} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">City</span>
              <input name="city" defaultValue={event.city ?? ''} style={inputStyle()} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Description</span>
            <textarea name="description" rows={4} defaultValue={event.description ?? ''} style={inputStyle()} />
          </label>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--white)' }}>
              <input type="checkbox" name="public" defaultChecked={event.public} />
              Public Event
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--white)' }}>
              <input type="checkbox" name="featured" defaultChecked={event.featured} />
              Featured On Homepage
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
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
