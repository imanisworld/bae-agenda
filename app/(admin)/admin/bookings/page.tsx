/**
 * ADMIN — BOOKINGS
 * Full bookings table with status badges. Data fetched server-side.
 */
import PageHeader      from '@/components/admin/PageHeader'
import Badge           from '@/components/admin/Badge'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import { createClient } from '@/lib/supabase/server'
import type { BookingStatus } from '@/types/index'

interface BookingRow {
  id:          string
  event_name:  string
  event_date:  string
  client_name: string | null
  package:     string | null
  status:      BookingStatus
  created_at:  string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/Chicago',
  })
}

async function getBookings(): Promise<BookingRow[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('bookings')
      .select('id, event_name, event_date, package, status, created_at, clients(first_name, last_name)')
      .order('created_at', { ascending: false })
    return (data ?? []).map((b: any) => ({
      id:          b.id,
      event_name:  b.event_name,
      event_date:  b.event_date,
      client_name: b.clients
        ? `${b.clients.first_name ?? ''} ${b.clients.last_name ?? ''}`.trim() || null
        : null,
      package:    b.package,
      status:     b.status as BookingStatus,
      created_at: b.created_at,
    }))
  } catch {
    return []
  }
}

export default async function BookingsPage() {
  const bookings = await getBookings()

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1120px' }}>
      <PageHeader
        title="Bookings"
        subtitle={bookings.length ? `${bookings.length} total` : undefined}
      />

      <div className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">All Bookings</span>
        </div>

        {bookings.length === 0 ? (
          <AdminEmptyState
            title="No bookings yet"
            desc="Booking requests submitted through the site will appear here."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Client</th>
                  <th>Event Date</th>
                  <th>Package</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 400 }}>{b.event_name}</td>
                    <td className="muted">{b.client_name ?? '—'}</td>
                    <td className="muted">{fmtDate(b.event_date)}</td>
                    <td className="muted">{b.package ?? '—'}</td>
                    <td><Badge variant={b.status} /></td>
                    <td className="muted">{fmtDate(b.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
