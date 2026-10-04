import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import AdminNotice from '@/components/admin/AdminNotice'
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton'
import EventMediaUploader from '@/components/admin/EventMediaUploader'
import EventLocationFields from '@/components/admin/EventLocationFields'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import {
  addEventMediaAction,
  deleteEventAction,
  deleteEventMediaAction,
  updateEventAction,
  updateEventMediaAction,
} from '@/app/actions/events'
import { createInvoiceForEventAction } from '@/app/actions/invoices'
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
  booking_id: string | null
}

interface EventMediaRow {
  id: string
  event_id: string
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

async function getEvent(id: string): Promise<EventRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('id, title, event_date, event_timezone, venue, city, description, public, featured, show_description, booking_id')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message || 'Unable to load event.')

  return (data as EventRow | null) ?? null
}

async function getEventMedia(eventId: string): Promise<EventMediaRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_media')
    .select('id, event_id, media_type, media_url, poster_url, caption, sort_order, public, created_at')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    // The migration is additive. Keep the event editor usable before it is applied.
    if (error.code === '42P01' || error.code === 'PGRST205') return []
    throw new Error(error.message || 'Unable to load event media.')
  }

  return (data ?? []) as EventMediaRow[]
}

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ error?: string | string[]; success?: string | string[]; invoice?: string | string[] }>
}) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const [event, media] = await Promise.all([getEvent(id), getEventMedia(id)])
  if (!event) notFound()

  const errorMessage = getMessage(resolvedSearchParams?.error)
  const successMessage = getMessage(resolvedSearchParams?.success)
  const legacyTimeZone = !event.event_timezone
  const inputDateTime = getEventInputDateTime(event.event_date, event.event_timezone)
  const suggestedTimeZone = event.event_timezone ?? suggestEventTimeZone(event.city) ?? ''

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Edit Event"
        subtitle="Update event details, visibility, featured status, and the past-event media archive."
        action={{ label: 'Back To Events', href: '/admin/events' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}
      {successMessage && (
        <div className="admin-preview-banner" style={{ marginBottom: '16px' }}>
          <span className="admin-preview-mark" aria-hidden="true">✓</span>
          <div className="admin-preview-title">{successMessage}</div>
        </div>
      )}

      <div className="admin-section" style={{ padding: '16px 18px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div className="admin-section-title" style={{ marginBottom: '5px' }}>Booking Link</div>
            <div className="muted" style={{ fontSize: '12px' }}>
              {event.booking_id ? 'This event is linked to a booking record.' : 'This is a standalone event.'}
            </div>
          </div>
          {event.booking_id && (
            <div className="admin-form-actions">
              <Link href={`/admin/bookings/${event.booking_id}/invoice`} className="admin-btn-primary">
                Invoice
              </Link>
              <Link href={`/admin/bookings/${event.booking_id}`} className="admin-btn-ghost">
                View Booking
              </Link>
            </div>
          )}
        </div>

        {!event.booking_id && (
          <details id="invoice" open={Boolean(getMessage(resolvedSearchParams?.invoice))} style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            <summary className="admin-btn-ghost" style={{ display: 'inline-flex', cursor: 'pointer', listStyle: 'none' }}>
              Invoice this event
            </summary>
            <form action={createInvoiceForEventAction} className="admin-form-grid" style={{ marginTop: '16px' }}>
              <input type="hidden" name="event_id" value={event.id} />
              <p className="muted" style={{ margin: 0, fontSize: '12px', lineHeight: 1.6 }}>
                For a venue or promoter paying you. This adds them as a client, links a booking to this event,
                and opens an invoice draft you can edit before sending. Nothing is emailed until you send it,
                and automatic reminder and review emails stay off for this booking.
              </p>
              <div className="admin-form-grid-two">
                <label style={{ display: 'grid', gap: '7px' }}>
                  <span className="admin-field-label">Contact first name *</span>
                  <input name="first_name" required autoComplete="off" style={inputStyle()} />
                </label>
                <label style={{ display: 'grid', gap: '7px' }}>
                  <span className="admin-field-label">Last name or business</span>
                  <input name="last_name" autoComplete="off" style={inputStyle()} />
                </label>
              </div>
              <div className="admin-form-grid-two">
                <label style={{ display: 'grid', gap: '7px' }}>
                  <span className="admin-field-label">Email *</span>
                  <input name="email" type="email" required autoComplete="off" style={inputStyle()} />
                </label>
                <label style={{ display: 'grid', gap: '7px' }}>
                  <span className="admin-field-label">Amount (USD) *</span>
                  <input name="amount" type="number" min="0.01" step="0.01" required inputMode="decimal" style={inputStyle()} />
                </label>
              </div>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn-primary">Create invoice draft</button>
              </div>
            </form>
          </details>
        )}
      </div>

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

      <section className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ marginBottom: '20px' }}>
          <span className="admin-section-title">Event Media Archive</span>
          <p className="muted" style={{ margin: '7px 0 0', fontSize: '12px', lineHeight: 1.6 }}>
            Past events open this archive from the public Events page. Upload directly from your phone/computer, or paste an external media URL below.
          </p>
        </div>

        <EventMediaUploader eventId={event.id} />

        {media.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            {media.map((item, mediaIndex) => (
              <div
                key={item.id}
                style={{
                  padding: '16px',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,.015)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <div>
                    <strong style={{ color: 'var(--white)', fontSize: '13px' }}>
                      {mediaIndex + 1}. {item.media_type === 'image' ? 'Photo' : 'Video'}
                    </strong>
                    <div className="muted" style={{ marginTop: '4px', fontSize: '11px', maxWidth: '560px', overflowWrap: 'anywhere' }}>
                      {item.media_url}
                    </div>
                  </div>
                  <span style={{ color: item.public ? '#34d399' : 'var(--muted)', fontSize: '10px', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                    {item.public ? 'Public' : 'Hidden'}
                  </span>
                </div>

                <form action={updateEventMediaAction} className="admin-form-grid" style={{ gap: '12px' }}>
                  <input type="hidden" name="event_id" value={event.id} />
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
                    <input
                      name="poster_url"
                      type="url"
                      defaultValue={item.poster_url ?? ''}
                      placeholder="Optional image shown before video plays"
                      style={inputStyle()}
                    />
                  </label>

                  <label style={{ display: 'flex', gap: '9px', alignItems: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                    <input type="checkbox" name="public" defaultChecked={item.public} />
                    Show this item in the public archive
                  </label>

                  <div className="admin-form-actions">
                    <button type="submit" className="admin-btn-ghost">Save Media</button>
                  </div>
                </form>

                <form action={deleteEventMediaAction} style={{ marginTop: '10px' }}>
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="media_id" value={item.id} />
                  <ConfirmSubmitButton
                    message="Remove this photo/video from the event archive? The hosted file itself will not be deleted."
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
            No media yet. The public archive is already wired to show a clean “photos and video can be added later” state.
          </div>
        )}

        <form action={addEventMediaAction} className="admin-form-grid">
          <input type="hidden" name="event_id" value={event.id} />

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
            <input
              name="media_url"
              type="url"
              required
              placeholder="https://..."
              style={inputStyle()}
            />
            <span className="muted" style={{ fontSize: '11px', lineHeight: 1.5 }}>
              Use this only for media already hosted somewhere else. For normal uploads, use “Upload From Device” above.
            </span>
          </label>

          <div className="admin-form-grid-two">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-field-label">Caption</span>
              <input name="caption" placeholder="Optional context or photo credit" style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-field-label">Video Poster URL</span>
              <input name="poster_url" type="url" placeholder="Optional preview image" style={inputStyle()} />
            </label>
          </div>

          <label style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', color: 'var(--muted)', fontSize: '12px', lineHeight: 1.5 }}>
            <input type="checkbox" name="rights_confirmed" required style={{ marginTop: '2px' }} />
            I own this media or have permission from the copyright owner to publish it on The Bae Agenda.
          </label>

          <label style={{ display: 'flex', gap: '9px', alignItems: 'center', color: 'var(--muted)', fontSize: '12px' }}>
            <input type="checkbox" name="public" defaultChecked />
            Publish this media in the event archive
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn-primary">Add Media</button>
          </div>
        </form>
      </section>

      <form action={deleteEventAction}>
        <input type="hidden" name="id" value={event.id} />
        <ConfirmSubmitButton
          message="Delete this event? This cannot be undone. Any event media records will also be removed."
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
