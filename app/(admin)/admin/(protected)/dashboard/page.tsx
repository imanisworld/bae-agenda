/**
 * ADMIN DASHBOARD
 * Control room overview: stat cards, recent bookings, upcoming events, payment reminders.
 * Server Component — data fetched server-side.
 * Falls back to realistic mock data when Supabase is not yet connected.
 */
import Link            from 'next/link'
import StatCard        from '@/components/admin/StatCard'
import Badge           from '@/components/admin/Badge'
import PageHeader      from '@/components/admin/PageHeader'
import { getPrimaryBookingClient } from '@/lib/booking-client'
import { getDepositStatus } from '@/lib/booking-deposit'
import { getBookingLifecycleStatus, getBookingWorkflowPaymentStatus, type BookingLifecycleStatus, type BookingWorkflowPaymentStatus } from '@/lib/booking-workflow'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { BOOKING_LIFECYCLE_STATUS_LABELS, BOOKING_WORKFLOW_PAYMENT_STATUS_LABELS } from '@/lib/constants'
import type { BookingStatus, PaymentStatus } from '@/types/index'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecentBooking {
  id:          string
  event_name:  string
  event_date:  string
  event_timezone: string
  client_name: string | null
  status:      BookingLifecycleStatus
  payment_status: BookingWorkflowPaymentStatus
  deposit_status: 'unpaid' | 'pending' | 'paid'
}

interface UpcomingEvent {
  id:         string
  title:      string
  event_date: string
  venue:      string | null
  featured:   boolean
}

interface PaymentReminder {
  id:           string
  booking_name: string
  amount:       number
  status:       PaymentStatus
  type:         string
}

interface DashboardStats {
  upcomingEvents:   number
  activeBookings:   number
  pendingInquiries: number
  totalClients:     number
}

interface BookingQueryRow {
  id: string
  event_name: string
  event_date: string
  event_timezone: string
  status: BookingStatus
  lifecycle_status: BookingLifecycleStatus | null
  payment_status: BookingWorkflowPaymentStatus | null
  quote: number | null
  deposit_amount: number | null
  clients: { first_name: string | null; last_name: string | null; email: string | null }[] | null
  payments: { amount: number; type: string; status: 'pending' | 'received' | 'refunded' }[] | null
}

interface PaymentQueryRow {
  id: string
  amount: number
  status: PaymentStatus
  type: string
  bookings: { event_name: string | null }[] | null
}

// ── Mock Data (shown when DB not connected) ───────────────────────────────────

const MOCK_STATS: DashboardStats = {
  upcomingEvents:   4,
  activeBookings:   7,
  pendingInquiries: 3,
  totalClients:     22,
}

const MOCK_BOOKINGS: RecentBooking[] = [
  { id: 'm1', event_name: 'Birthday Celebration',    event_date: '2026-03-22', event_timezone: 'America/Indiana/Indianapolis', client_name: 'Marcus Webb',    status: 'new',       payment_status: 'unpaid',             deposit_status: 'unpaid' },
  { id: 'm2', event_name: 'House Music Brunch',      event_date: '2026-03-15', event_timezone: 'America/Chicago',               client_name: 'Nadia Thomas',   status: 'confirmed', payment_status: 'deposit_requested',  deposit_status: 'pending' },
  { id: 'm3', event_name: 'Corporate After-Party',   event_date: '2026-04-05', event_timezone: 'America/Chicago',               client_name: 'Priya Sharma',   status: 'confirmed', payment_status: 'unpaid',  deposit_status: 'unpaid' },
  { id: 'm4', event_name: 'Club Night at Spybar',    event_date: '2026-04-12', event_timezone: 'America/Chicago',               client_name: 'Jordan Lee',     status: 'new',       payment_status: 'unpaid',  deposit_status: 'unpaid' },
  { id: 'm5', event_name: 'Wedding Reception',       event_date: '2026-02-28', event_timezone: 'America/Indiana/Indianapolis', client_name: 'Destiny Brown',  status: 'completed', payment_status: 'paid',    deposit_status: 'paid' },
]

const MOCK_EVENTS: UpcomingEvent[] = [
  { id: 'e1', title: 'The Agenda: Monthly Residency', event_date: '2026-03-21', venue: 'Spybar Chicago',        featured: true  },
  { id: 'e2', title: 'Day Party Series Vol. 3',        event_date: '2026-04-04', venue: 'The Promontory',        featured: false },
  { id: 'e3', title: 'Corporate After-Party',          event_date: '2026-04-17', venue: 'Ace Hotel Chicago',     featured: false },
  { id: 'e4', title: 'Summer Kickoff Rooftop',         event_date: '2026-05-25', venue: 'Soho House Chicago',    featured: true  },
]

const MOCK_PAYMENTS: PaymentReminder[] = [
  { id: 'p1', booking_name: 'Birthday Celebration',  amount: 300, status: 'pending', type: 'deposit' },
  { id: 'p2', booking_name: 'House Music Brunch',    amount: 150, status: 'pending', type: 'balance' },
  { id: 'p3', booking_name: 'Corporate After-Party', amount: 300, status: 'pending', type: 'deposit' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string, timeZone = 'America/Indiana/Indianapolis') {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone,
  })
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

// ── Data ──────────────────────────────────────────────────────────────────────

async function getDashboardData() {
  try {
    const supabase = createClient()
    const now = new Date().toISOString()

    const [
      { count: upcomingEvents   },
      { count: activeBookings   },
      { count: pendingInquiries },
      { count: totalClients     },
      { data: bookingRows       },
      { data: eventRows         },
      { data: paymentRows       },
    ] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true })
        .eq('public', true).gte('event_date', now),
      supabase.from('bookings').select('*', { count: 'exact', head: true })
        .eq('lifecycle_status', 'confirmed'),
      supabase.from('bookings').select('*', { count: 'exact', head: true })
        .in('lifecycle_status', ['new', 'contacted', 'negotiating']),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('bookings')
        .select('id, event_name, event_date, event_timezone, status, lifecycle_status, payment_status, quote, deposit_amount, clients(first_name, last_name, email), payments(amount, type, status)')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('events')
        .select('id, title, event_date, venue, featured')
        .eq('public', true).gte('event_date', now)
        .order('event_date', { ascending: true }).limit(4),
      supabase.from('payments')
        .select('id, amount, status, type, bookings(event_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }).limit(5),
    ])

    return {
      connected: true,
      mock: false,
      stats: {
        upcomingEvents:   upcomingEvents   ?? 0,
        activeBookings:   activeBookings   ?? 0,
        pendingInquiries: pendingInquiries ?? 0,
        totalClients:     totalClients     ?? 0,
      },
      recentBookings: ((bookingRows ?? []) as BookingQueryRow[]).map((b) => {
        const client = getPrimaryBookingClient(b.clients)
        const lifecycleStatus = getBookingLifecycleStatus(b.lifecycle_status, b.status)
        return {
          id:          b.id,
          event_name:  b.event_name,
          event_date:  b.event_date,
          event_timezone: b.event_timezone,
          client_name: client
            ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() || null
            : null,
          status: lifecycleStatus,
          payment_status: getBookingWorkflowPaymentStatus({
            currentStatus: b.payment_status,
            quote: b.quote,
            depositAmount: b.deposit_amount,
            lifecycleStatus,
            payments: b.payments,
          }),
          deposit_status: getDepositStatus(b.deposit_amount, b.payments),
        }
      }) as RecentBooking[],
      upcomingEvents:   (eventRows   ?? []) as UpcomingEvent[],
      paymentReminders: ((paymentRows ?? []) as PaymentQueryRow[]).map((p) => {
        const booking = p.bookings?.[0] ?? null
        return {
          id:           p.id,
          booking_name: booking?.event_name ?? 'Unknown',
          amount:       p.amount,
          status:       p.status as PaymentStatus,
          type:         p.type,
        }
      }) as PaymentReminder[],
    }
  } catch {
    // DB not connected — return mock data so the dashboard feels operational
    return {
      connected: false,
      mock: true,
      stats:           MOCK_STATS,
      recentBookings:  MOCK_BOOKINGS,
      upcomingEvents:  MOCK_EVENTS,
      paymentReminders: MOCK_PAYMENTS,
    }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const raw = await getDashboardData()

  // Use sample data whenever there's nothing real to show yet —
  // either DB isn't connected, or connected but tables are still empty.
  const isEmpty =
    raw.recentBookings.length === 0 &&
    raw.upcomingEvents.length  === 0 &&
    raw.paymentReminders.length === 0

  const usingSample = !raw.connected || isEmpty

  const stats           = usingSample ? MOCK_STATS    : raw.stats
  const recentBookings  = usingSample ? MOCK_BOOKINGS : raw.recentBookings
  const upcomingEvents  = usingSample ? MOCK_EVENTS   : raw.upcomingEvents
  const paymentReminders = usingSample ? MOCK_PAYMENTS : raw.paymentReminders

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="admin-page">

      <PageHeader title="Dashboard" subtitle={today} />

      {/* ── Status Banner ───────────────────────────────────────── */}
      {usingSample && (
        <div style={{
          background: 'rgba(155,93,229,0.06)',
          border: '1px solid rgba(155,93,229,0.18)',
          padding: '14px 20px', marginBottom: '36px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}>
          <span style={{ fontSize: '13px', marginTop: '1px', flexShrink: 0, color: 'var(--violet)' }}>◈</span>
          <div>
            <div style={{
              fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--violet)', marginBottom: '4px', fontWeight: 500,
            }}>
              Preview Mode — Sample Data
            </div>
            <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
              {raw.connected
                ? <>Run the migration SQL in Supabase to load live data. Sample data is shown until your first records are added.</>
                : <>Add your Supabase credentials to <code style={{ color: 'var(--white)', fontSize: '11px' }}>.env.local</code> to activate live data.</>
              }
            </p>
          </div>
        </div>
      )}

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '16px', marginBottom: '40px',
      }}>
        <StatCard
          label="Upcoming Events"
          value={stats.upcomingEvents}
          sub="Scheduled"
          accent="violet"
        />
        <StatCard
          label="Active Bookings"
          value={stats.activeBookings}
          sub="Confirmed"
          accent="violet"
        />
        <StatCard
          label="New Inquiries"
          value={stats.pendingInquiries}
          sub="Needs response"
          accent="gold"
        />
        <StatCard
          label="Total Clients"
          value={stats.totalClients}
          sub="All time"
        />
      </div>

      {/* ── Recent Bookings ─────────────────────────────────────── */}
      <div className="admin-section">
        <div className="admin-section-header">
          <span className="admin-section-title">Recent Bookings</span>
          <Link href="/admin/bookings" className="admin-view-all">View All →</Link>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table-stack">
            <thead>
              <tr>
                <th>Event</th>
                <th>Client</th>
                <th>Date</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Deposit</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id}>
                  <td data-label="Event" style={{ fontWeight: 400 }}>{b.event_name}</td>
                  <td data-label="Client" className="muted">{b.client_name ?? '—'}</td>
                  <td data-label="Date" className="muted">{fmtDate(b.event_date, b.event_timezone)}</td>
                  <td data-label="Status"><Badge variant={b.status} label={BOOKING_LIFECYCLE_STATUS_LABELS[b.status]} /></td>
                  <td data-label="Payment"><Badge variant={b.payment_status} label={BOOKING_WORKFLOW_PAYMENT_STATUS_LABELS[b.payment_status]} /></td>
                  <td data-label="Deposit">
                    <Badge variant={b.deposit_status === 'paid' ? 'paid' : b.deposit_status === 'pending' ? 'pending' : 'unpaid'} label={`Deposit ${b.deposit_status}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Two-column lower row ─────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
      }}>

        {/* Upcoming Events */}
        <div className="admin-section" style={{ marginBottom: 0 }}>
          <div className="admin-section-header">
            <span className="admin-section-title">Upcoming Events</span>
            <Link href="/admin/events" className="admin-view-all">View All →</Link>
          </div>

          <div>
            {upcomingEvents.map((ev, i) => (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '12px',
                padding: '14px 20px',
                borderBottom: i < upcomingEvents.length - 1
                  ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--white)', marginBottom: '4px' }}>
                    {ev.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {fmtDate(ev.event_date)}{ev.venue ? ` · ${ev.venue}` : ''}
                  </div>
                </div>
                {ev.featured && (
                  <span style={{
                    fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: 'var(--violet)', border: '1px solid rgba(155,93,229,0.3)',
                    padding: '2px 7px', flexShrink: 0,
                  }}>
                    Featured
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Reminders */}
        <div className="admin-section" style={{ marginBottom: 0 }}>
          <div className="admin-section-header">
            <span className="admin-section-title">Payment Reminders</span>
            <Link href="/admin/payments" className="admin-view-all">View All →</Link>
          </div>

          <div>
            {paymentReminders.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '12px',
                padding: '14px 20px',
                borderBottom: i < paymentReminders.length - 1
                  ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--white)', marginBottom: '4px' }}>
                    {p.booking_name}
                  </div>
                  <div style={{
                    fontSize: '11px', color: 'var(--muted)', textTransform: 'capitalize',
                  }}>
                    {p.type}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: 'Conthrax, sans-serif',
                    fontSize: '13px', color: 'var(--gold)', marginBottom: '5px',
                  }}>
                    {fmtCurrency(p.amount)}
                  </div>
                  <Badge variant={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
