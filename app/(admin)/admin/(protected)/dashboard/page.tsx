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
import AdminEmptyState from '@/components/admin/AdminEmptyState'
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
  event_timezone?: string | null
}

interface PaymentReminder {
  id:           string
  bookingId:    string
  booking_name: string
  amount:       number
  status:       PaymentStatus
  type:         string
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
  booking_id: string
  amount: number
  status: PaymentStatus
  type: string
  bookings: { event_name: string | null }[] | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string, timeZone = 'America/Indiana/Indianapolis') {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone,
  })
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
  }).format(n)
}

// ── Data ──────────────────────────────────────────────────────────────────────

async function getDashboardData() {
  try {
    const supabase = createClient()
    const now = new Date().toISOString()

    const [
      { count: upcomingEvents, error: upcomingEventsError   },
      { count: activeBookings, error: activeBookingsError   },
      { count: pendingInquiries, error: pendingInquiriesError },
      { count: totalClients, error: totalClientsError     },
      { data: bookingRows, error: bookingRowsError       },
      { data: eventRows, error: eventRowsError         },
      { data: paymentRows, error: paymentRowsError       },
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
        .select('id, title, event_date, event_timezone, venue, featured')
        .eq('public', true).gte('event_date', now)
        .order('event_date', { ascending: true }).limit(4),
      supabase.from('payments')
        .select('id, booking_id, amount, status, type, bookings(event_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }).limit(5),
    ])

    const loadError =
      upcomingEventsError ||
      activeBookingsError ||
      pendingInquiriesError ||
      totalClientsError ||
      bookingRowsError ||
      eventRowsError ||
      paymentRowsError

    if (loadError) {
      throw new Error(loadError.message || 'Unable to load dashboard data.')
    }

    return {
      connected: true,
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
          bookingId:    p.booking_id,
          booking_name: booking?.event_name ?? 'Unknown',
          amount:       p.amount,
          status:       p.status as PaymentStatus,
          type:         p.type,
        }
      }) as PaymentReminder[],
    }
  } catch {
    return {
      connected: false,
      stats: { upcomingEvents: 0, activeBookings: 0, pendingInquiries: 0, totalClients: 0 },
      recentBookings: [] as RecentBooking[],
      upcomingEvents: [] as UpcomingEvent[],
      paymentReminders: [] as PaymentReminder[],
    }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const raw = await getDashboardData()

  const stats = raw.stats
  const recentBookings = raw.recentBookings
  const upcomingEvents = raw.upcomingEvents
  const paymentReminders = raw.paymentReminders
  const deploymentEnvironment =
    process.env.NEXT_PUBLIC_DEPLOYMENT_ENV ?? process.env.VERCEL_ENV ?? 'local'
  const deploymentCommit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Indiana/Indianapolis',
  })

  return (
    <div className="admin-page">

      <PageHeader title="Dashboard" subtitle={today} />

      {/* ── Status Banner ───────────────────────────────────────── */}
      {!raw.connected && (
        <div className="admin-preview-banner">
          <span className="admin-preview-mark" aria-hidden="true">◈</span>
          <div>
            <div className="admin-preview-title">Live Data Unavailable</div>
            <p>The dashboard could not load the database. No sample bookings, events, or payments are being substituted.</p>
          </div>
        </div>
      )}

      <div className="admin-section" style={{ marginBottom: 24 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">System Health</span>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>Live check</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 1,
          background: 'var(--border)',
        }}>
          {[
            ['App', 'Online'],
            ['Database', raw.connected ? 'Connected' : 'Unavailable'],
            ['Environment', deploymentEnvironment],
            ['Build', deploymentCommit],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '14px 16px', background: 'var(--surface)' }}>
              <div style={{
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 5,
              }}>
                {label}
              </div>
              <div style={{
                fontSize: 12,
                color: label === 'Database' && !raw.connected ? 'var(--gold)' : 'var(--white)',
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

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
          href="/admin/events"
        />
        <StatCard
          label="Active Bookings"
          value={stats.activeBookings}
          sub="Confirmed"
          accent="violet"
          href="/admin/bookings?filter=confirmed"
        />
        <StatCard
          label="New Inquiries"
          value={stats.pendingInquiries}
          sub="Needs response"
          accent="gold"
          href="/admin/bookings"
        />
        <StatCard
          label="Total Clients"
          value={stats.totalClients}
          sub="All time"
          href="/admin/clients"
        />
      </div>

      {/* ── Recent Bookings ─────────────────────────────────────── */}
      <div className="admin-section">
        <div className="admin-section-header">
          <span className="admin-section-title">Recent Bookings</span>
          <Link href="/admin/bookings" className="admin-view-all">View All →</Link>
        </div>

        {recentBookings.length === 0 ? (
          <AdminEmptyState
            title="No bookings yet"
            desc="New booking inquiries will appear here."
            action={{ label: 'Open Bookings', href: '/admin/bookings' }}
          />
        ) : (
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
                  <td data-label="Event" style={{ fontWeight: 400 }}>
                    <Link href={`/admin/bookings/${b.id}`} className="admin-record-link">{b.event_name}</Link>
                  </td>
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
        )}
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

          {upcomingEvents.length === 0 ? (
            <AdminEmptyState
              title="No upcoming public events"
              desc="Create or publish an event when you have a date to show."
              action={{ label: 'Open Events', href: '/admin/events' }}
            />
          ) : (
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
                    <Link href={`/admin/events/${ev.id}`} className="admin-record-link">{ev.title}</Link>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {fmtDate(ev.event_date, ev.event_timezone ?? 'America/Indiana/Indianapolis')}{ev.venue ? ` · ${ev.venue}` : ''}
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
          )}
        </div>

        {/* Payment Reminders */}
        <div className="admin-section" style={{ marginBottom: 0 }}>
          <div className="admin-section-header">
            <span className="admin-section-title">Payment Reminders</span>
            <Link href="/admin/payments" className="admin-view-all">View All →</Link>
          </div>

          {paymentReminders.length === 0 ? (
            <AdminEmptyState
              title="No pending payments"
              desc="Pending deposits and balances will appear here."
              action={{ label: 'Open Payments', href: '/admin/payments' }}
            />
          ) : (
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
                    <Link href={`/admin/bookings/${p.bookingId}`} className="admin-record-link">{p.booking_name}</Link>
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
          )}
        </div>

      </div>
    </div>
  )
}
