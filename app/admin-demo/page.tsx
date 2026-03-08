import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import StatCard from '@/components/admin/StatCard'
import Badge from '@/components/admin/Badge'

const DEMO_STATS = {
  upcomingEvents: 4,
  activeBookings: 7,
  pendingInquiries: 3,
  totalClients: 22,
}

const DEMO_BOOKINGS = [
  { id: 'b1', event_name: 'Birthday Celebration', event_date: '2026-03-22', client_name: 'Marcus Webb', status: 'inquiry' as const },
  { id: 'b2', event_name: 'House Music Brunch', event_date: '2026-03-15', client_name: 'Nadia Thomas', status: 'confirmed' as const },
  { id: 'b3', event_name: 'Corporate After-Party', event_date: '2026-04-05', client_name: 'Priya Sharma', status: 'confirmed' as const },
  { id: 'b4', event_name: 'Wedding Reception', event_date: '2026-02-28', client_name: 'Destiny Brown', status: 'completed' as const },
]

const DEMO_EVENTS = [
  { id: 'e1', title: 'The Agenda: Monthly Residency', event_date: '2026-03-21', venue: 'Spybar Chicago', featured: true },
  { id: 'e2', title: 'Day Party Series Vol. 3', event_date: '2026-04-04', venue: 'The Promontory', featured: false },
  { id: 'e3', title: 'Corporate After-Party', event_date: '2026-04-17', venue: 'Ace Hotel Chicago', featured: false },
]

const DEMO_PAYMENTS = [
  { id: 'p1', booking_name: 'Birthday Celebration', amount: '$300', status: 'pending' as const, type: 'deposit' },
  { id: 'p2', booking_name: 'House Music Brunch', amount: '$150', status: 'pending' as const, type: 'balance' },
  { id: 'p3', booking_name: 'Corporate After-Party', amount: '$300', status: 'pending' as const, type: 'deposit' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  })
}

export default function AdminDemoPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <PageHeader
          title="Admin Demo"
          subtitle="Read-only sample data for portfolio walkthroughs."
          action={{ label: 'Back To Site', href: '/' }}
        />

        <div
          style={{
            background: 'rgba(155,93,229,0.06)',
            border: '1px solid rgba(155,93,229,0.18)',
            padding: '14px 20px',
            marginBottom: '32px',
          }}
        >
          <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
            Demo environment with sample records. Real admin login and live client data are not shown here.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <StatCard label="Upcoming Events" value={DEMO_STATS.upcomingEvents} sub="Scheduled" accent="violet" />
          <StatCard label="Active Bookings" value={DEMO_STATS.activeBookings} sub="Confirmed" accent="violet" />
          <StatCard label="New Inquiries" value={DEMO_STATS.pendingInquiries} sub="Needs response" accent="gold" />
          <StatCard label="Total Clients" value={DEMO_STATS.totalClients} sub="All time" />
        </div>

        <div className="admin-section">
          <div className="admin-section-header">
            <span className="admin-section-title">Recent Bookings</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_BOOKINGS.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 400 }}>{b.event_name}</td>
                    <td className="muted">{b.client_name}</td>
                    <td className="muted">{fmtDate(b.event_date)}</td>
                    <td>
                      <Badge variant={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          <div className="admin-section" style={{ marginBottom: 0 }}>
            <div className="admin-section-header">
              <span className="admin-section-title">Upcoming Events</span>
            </div>
            <div>
              {DEMO_EVENTS.map((ev, i) => (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '14px 20px',
                    borderBottom: i < DEMO_EVENTS.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--white)', marginBottom: '4px' }}>{ev.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {fmtDate(ev.event_date)} · {ev.venue}
                    </div>
                  </div>
                  {ev.featured && (
                    <span
                      style={{
                        fontSize: '8px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--violet)',
                        border: '1px solid rgba(155,93,229,0.3)',
                        padding: '2px 7px',
                      }}
                    >
                      Featured
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section" style={{ marginBottom: 0 }}>
            <div className="admin-section-header">
              <span className="admin-section-title">Payment Reminders</span>
            </div>
            <div>
              {DEMO_PAYMENTS.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '14px 20px',
                    borderBottom: i < DEMO_PAYMENTS.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--white)', marginBottom: '4px' }}>{p.booking_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'capitalize' }}>{p.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '13px', color: 'var(--gold)', marginBottom: '5px' }}>
                      {p.amount}
                    </div>
                    <Badge variant={p.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '28px' }}>
          <Link href="/admin/login" className="admin-btn-ghost">
            Real Admin Login
          </Link>
        </div>
      </div>
    </div>
  )
}
