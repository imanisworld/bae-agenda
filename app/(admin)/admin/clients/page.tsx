/**
 * ADMIN — CLIENTS
 * Full client list with booking count. Data fetched server-side.
 */
import PageHeader      from '@/components/admin/PageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import { createClient } from '@/lib/supabase/server'

interface ClientRow {
  id:             string
  first_name:     string
  last_name:      string | null
  email:          string
  phone:          string | null
  booking_count:  number
  created_at:     string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/Chicago',
  })
}

async function getClients(): Promise<ClientRow[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, created_at, bookings(id)')
      .order('created_at', { ascending: false })
    return (data ?? []).map((c: any) => ({
      id:            c.id,
      first_name:    c.first_name,
      last_name:     c.last_name,
      email:         c.email,
      phone:         c.phone,
      booking_count: Array.isArray(c.bookings) ? c.bookings.length : 0,
      created_at:    c.created_at,
    }))
  } catch {
    return []
  }
}

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1120px' }}>
      <PageHeader
        title="Clients"
        subtitle={clients.length ? `${clients.length} total` : undefined}
      />

      <div className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">All Clients</span>
        </div>

        {clients.length === 0 ? (
          <AdminEmptyState
            title="No clients yet"
            desc="Clients are created automatically when a booking request comes in."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Bookings</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 400 }}>
                      {c.first_name}{c.last_name ? ` ${c.last_name}` : ''}
                    </td>
                    <td className="muted">{c.email}</td>
                    <td className="muted">{c.phone ?? '—'}</td>
                    <td className="muted">{c.booking_count}</td>
                    <td className="muted">{fmtDate(c.created_at)}</td>
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
