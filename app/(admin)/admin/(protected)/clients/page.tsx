/**
 * ADMIN — CLIENTS
 * Full client list with booking count. Data fetched server-side.
 */
import Link from 'next/link'
import PageHeader      from '@/components/admin/PageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import { createAdminClient as createClient } from '@/lib/supabase/admin'

interface ClientRow {
  id:             string
  first_name:     string
  last_name:      string | null
  email:          string | null
  phone:          string | null
  booking_count:  number
  created_at:     string
}

interface ClientQueryRow {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  created_at: string
  bookings: Array<{ id: string }> | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/Indiana/Indianapolis',
  })
}

async function getClients(): Promise<ClientRow[]> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, created_at, bookings(id)')
      .order('created_at', { ascending: false })
    const rows = (data ?? []) as ClientQueryRow[]
    return rows.map((c) => ({
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
    <div className="admin-page">
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
            <table className="admin-table admin-table-stack">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Bookings</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Name" style={{ fontWeight: 400 }}>
                      {c.first_name}{c.last_name ? ` ${c.last_name}` : ''}
                    </td>
                    <td data-label="Email" className="muted">{c.email ?? '—'}</td>
                    <td data-label="Phone" className="muted">{c.phone ?? '—'}</td>
                    <td data-label="Bookings" className="muted">{c.booking_count}</td>
                    <td data-label="Added" className="muted">{fmtDate(c.created_at)}</td>
                    <td data-label="Actions">
                      <Link href={`/admin/clients/${c.id}`} className="admin-view-all">
                        Edit →
                      </Link>
                    </td>
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
