import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/admin/PageHeader'
import AdminNotice from '@/components/admin/AdminNotice'
import Badge from '@/components/admin/Badge'
import { updateClientAction } from '@/app/actions/clients'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBookingLifecycleStatus } from '@/lib/booking-workflow'
import { BOOKING_LIFECYCLE_STATUS_LABELS } from '@/lib/constants'
import { isValidTimeZone } from '@/lib/date-time'
import type { BookingLifecycleStatus, BookingStatus } from '@/types/index'

type ClientDetail = {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
  bookings: Array<{
    id: string
    event_name: string
    event_date: string
    event_timezone: string
    status: BookingStatus
    lifecycle_status: BookingLifecycleStatus | null
  }> | null
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

function fmtDate(iso: string, timeZone?: string | null) {
  const zone = timeZone && isValidTimeZone(timeZone) ? timeZone : 'America/Indiana/Indianapolis'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: zone,
  })
}

function getMessage(value: string | string[] | undefined) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

async function getClient(id: string): Promise<ClientDetail | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('clients')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      notes,
      created_at,
      bookings(id, event_name, event_date, event_timezone, status, lifecycle_status)
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message || 'Unable to load client.')

  return (data as ClientDetail | null) ?? null
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ error?: string | string[]; success?: string | string[] }>
}) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const client = await getClient(id)
  if (!client) notFound()

  const errorMessage = getMessage(resolvedSearchParams?.error)
  const successMessage = getMessage(resolvedSearchParams?.success)
  const bookings = (client.bookings ?? []).slice().sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  )

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Edit Client"
        subtitle="Correct the client record used by bookings, email, and portal access. Existing invoice snapshots are edited separately."
        action={{ label: 'Back To Clients', href: '/admin/clients' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}
      {successMessage && (
        <div className="admin-preview-banner" style={{ marginBottom: '16px' }}>
          <span className="admin-preview-mark" aria-hidden="true">✓</span>
          <div>
            <div className="admin-preview-title">{successMessage}</div>
          </div>
        </div>
      )}

      <form action={updateClientAction} className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <input type="hidden" name="id" value={client.id} />

        <div className="admin-form-grid-two" style={{ marginBottom: '14px' }}>
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">First Name *</span>
            <input name="first_name" required defaultValue={client.first_name} style={inputStyle()} />
          </label>
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Last Name</span>
            <input name="last_name" defaultValue={client.last_name ?? ''} style={inputStyle()} />
          </label>
        </div>

        <div className="admin-form-grid-two" style={{ marginBottom: '14px' }}>
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Email</span>
            <input name="email" type="email" defaultValue={client.email ?? ''} style={inputStyle()} />
          </label>
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Phone</span>
            <input name="phone" type="tel" defaultValue={client.phone ?? ''} style={inputStyle()} />
          </label>
        </div>

        <label style={{ display: 'grid', gap: '7px', marginBottom: '18px' }}>
          <span className="admin-section-title">Internal Notes</span>
          <textarea name="notes" rows={4} defaultValue={client.notes ?? ''} style={inputStyle()} />
        </label>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-primary">Save Client</button>
          <Link href="/admin/clients" className="admin-btn-ghost">Cancel</Link>
        </div>
      </form>

      <section className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Bookings</span>
          <span className="muted">{bookings.length} total</span>
        </div>

        {bookings.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--muted)', fontSize: '13px' }}>
            No bookings linked to this client.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stack">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const lifecycle = getBookingLifecycleStatus(booking.lifecycle_status, booking.status)
                  return (
                    <tr key={booking.id}>
                      <td data-label="Event">{booking.event_name}</td>
                      <td data-label="Date" className="muted">{fmtDate(booking.event_date, booking.event_timezone)}</td>
                      <td data-label="Status">
                        <Badge variant={lifecycle} label={BOOKING_LIFECYCLE_STATUS_LABELS[lifecycle]} />
                      </td>
                      <td data-label="Action">
                        <Link href={`/admin/bookings/${booking.id}`} className="admin-view-all">Open →</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
