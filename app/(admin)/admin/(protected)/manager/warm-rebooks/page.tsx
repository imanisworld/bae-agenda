import Link from 'next/link'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import ManagerStatusBadge from '@/components/admin/ManagerStatusBadge'
import PageHeader from '@/components/admin/PageHeader'
import { isManagerOpportunityStatus, type ManagerOpportunityStatus } from '@/lib/manager'
import { createAdminClient } from '@/lib/supabase/admin'

interface WarmOpportunity {
  id: string
  title: string
  organization: string | null
  status: ManagerOpportunityStatus
  source_url: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  next_action: string | null
  next_action_at: string | null
  source_payload: Record<string, unknown> | null
}

interface PriorBooking {
  id: string
  client_id: string | null
  event_name: string
  event_date: string
  venue: string | null
  city: string | null
  hours: number | null
  quote: number | null
  total_amount: number | null
}

interface PriorEvent {
  id: string
  title: string
  event_date: string
  venue: string | null
  city: string | null
}

interface Client {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
}

function fmtDate(value: string | null) {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : `${value}T12:00:00Z`
  return new Date(normalized).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function fmtMoney(value: number | null) {
  if (value === null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function payloadString(payload: Record<string, unknown> | null, key: string) {
  const value = payload?.[key]
  return typeof value === 'string' ? value : null
}

function payloadNumber(payload: Record<string, unknown> | null, key: string) {
  const value = payload?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function recurrenceLabel(payload: Record<string, unknown> | null) {
  const verified = payload?.recurrence_verified
  const clue = payloadString(payload, 'recurrence_clue')

  if (clue) return clue
  if (verified === true) return 'Recurrence verified'
  if (typeof verified === 'string') return verified.replaceAll('_', ' ')
  return 'Recurrence evidence recorded'
}

async function getWarmRebooks() {
  const admin = createAdminClient()
  const { data: raw, error } = await admin
    .from('manager_opportunities')
    .select('id, title, organization, status, source_url, contact_name, contact_email, contact_phone, next_action, next_action_at, source_payload')
    .order('next_action_at', { ascending: true, nullsFirst: false })
    .limit(1000)

  if (error) throw new Error(error.message)

  const opportunities = (raw ?? [])
    .filter((row: Record<string, unknown>) =>
      (row.source_payload as Record<string, unknown> | null)?.lead_origin === 'warm_rebook'
    )
    .map((row: Record<string, unknown>) => ({
      ...row,
      status: isManagerOpportunityStatus(row.status) ? row.status : 'review',
    })) as WarmOpportunity[]

  const bookingIds = Array.from(new Set(opportunities
    .map((row) => payloadString(row.source_payload, 'prior_booking_id'))
    .filter((value): value is string => Boolean(value))))

  const eventIds = Array.from(new Set(opportunities
    .map((row) => payloadString(row.source_payload, 'prior_event_id'))
    .filter((value): value is string => Boolean(value))))

  const priorClientIds = Array.from(new Set(opportunities
    .map((row) => payloadString(row.source_payload, 'prior_client_id'))
    .filter((value): value is string => Boolean(value))))

  let bookings: PriorBooking[] = []
  let events: PriorEvent[] = []

  if (bookingIds.length > 0) {
    const result = await admin
      .from('bookings')
      .select('id, client_id, event_name, event_date, venue, city, hours, quote, total_amount')
      .in('id', bookingIds)
    if (result.error) throw new Error(result.error.message)
    bookings = (result.data ?? []) as PriorBooking[]
  }

  if (eventIds.length > 0) {
    const result = await admin
      .from('events')
      .select('id, title, event_date, venue, city')
      .in('id', eventIds)
    if (result.error) throw new Error(result.error.message)
    events = (result.data ?? []) as PriorEvent[]
  }

  const bookingClientIds = bookings
    .map((booking) => booking.client_id)
    .filter((value): value is string => Boolean(value))
  const clientIds = Array.from(new Set([...priorClientIds, ...bookingClientIds]))
  let clients: Client[] = []

  if (clientIds.length > 0) {
    const result = await admin
      .from('clients')
      .select('id, first_name, last_name, email, phone')
      .in('id', clientIds)
    if (result.error) throw new Error(result.error.message)
    clients = (result.data ?? []) as Client[]
  }

  return {
    opportunities,
    bookings: new Map(bookings.map((row) => [row.id, row])),
    events: new Map(events.map((row) => [row.id, row])),
    clients: new Map(clients.map((row) => [row.id, row])),
  }
}

export default async function WarmRebooksPage() {
  const data = await getWarmRebooks()
  const active = data.opportunities.filter((row) => !['booked', 'passed', 'lost'].includes(row.status))

  return (
    <div className="admin-page">
      <PageHeader
        title="Warm Rebooks"
        subtitle="Prior-client and recurring-event follow-ups. Follow-up dates are internal research/outreach targets, never assumed event dates."
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        <Link href="/admin/manager" className="admin-btn-ghost">Manager</Link>
        <Link href="/admin/manager/relationships" className="admin-btn-ghost">Relationships</Link>
        <Link href="/admin/manager/sources" className="admin-btn-ghost">Sources / Watchlist</Link>
      </div>

      <section className="admin-section">
        <div className="admin-section-header">
          <span className="admin-section-title">Rebook Queue</span>
          <span className="muted">{active.length} active · {data.opportunities.length} total</span>
        </div>

        {data.opportunities.length === 0 ? (
          <AdminEmptyState
            title="No warm rebooks"
            desc="Verified recurring events and prior-client rebook candidates will appear here."
          />
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {data.opportunities.map((row) => {
              const bookingId = payloadString(row.source_payload, 'prior_booking_id')
              const eventId = payloadString(row.source_payload, 'prior_event_id')
              const priorBooking = bookingId ? data.bookings.get(bookingId) : undefined
              const priorEvent = eventId ? data.events.get(eventId) : undefined
              const clientId =
                priorBooking?.client_id ??
                payloadString(row.source_payload, 'prior_client_id')
              const client = clientId ? data.clients.get(clientId) : undefined

              const priorName =
                priorBooking?.event_name ??
                priorEvent?.title ??
                payloadString(row.source_payload, 'prior_event_name') ??
                'Prior event'
              const priorDate =
                priorBooking?.event_date ??
                priorEvent?.event_date ??
                payloadString(row.source_payload, 'prior_event_date')
              const priorVenue = priorBooking?.venue ?? priorEvent?.venue ?? null
              const priorCity = priorBooking?.city ?? priorEvent?.city ?? null
              const priorFee =
                priorBooking?.total_amount ??
                priorBooking?.quote ??
                payloadNumber(row.source_payload, 'prior_fee')
              const priorHours =
                priorBooking?.hours ??
                payloadNumber(row.source_payload, 'prior_hours')
              const contactName =
                row.contact_name ??
                (client ? [client.first_name, client.last_name].filter(Boolean).join(' ') : null)
              const contactEmail = row.contact_email ?? client?.email ?? null
              const contactPhone = row.contact_phone ?? client?.phone ?? null
              const contactKnown = Boolean(contactEmail || contactPhone)

              return (
                <article
                  key={row.id}
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 16,
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <Link href={`/admin/manager/opportunities/${row.id}`}>
                        <strong>{row.title}</strong>
                      </Link>
                      <div className="muted" style={{ marginTop: 4, fontSize: 10 }}>
                        {row.organization ?? 'No organization'} · {recurrenceLabel(row.source_payload)}
                      </div>
                    </div>
                    <ManagerStatusBadge status={row.status} />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 14,
                      marginTop: 18,
                    }}
                  >
                    <div>
                      <div className="muted" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em' }}>Prior event</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>{priorName}</div>
                      <div className="muted" style={{ marginTop: 2, fontSize: 10 }}>
                        {fmtDate(priorDate)}{priorVenue ? ` · ${priorVenue}` : ''}{priorCity ? ` · ${priorCity}` : ''}
                      </div>
                    </div>

                    <div>
                      <div className="muted" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em' }}>Prior economics</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>{fmtMoney(priorFee)}</div>
                      <div className="muted" style={{ marginTop: 2, fontSize: 10 }}>
                        {priorHours !== null ? `${priorHours} prior hour${priorHours === 1 ? '' : 's'}` : 'Hours not recorded'}
                      </div>
                    </div>

                    <div>
                      <div className="muted" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em' }}>Contact route</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>{contactName ?? 'Contact not identified'}</div>
                      <div className="muted" style={{ marginTop: 2, fontSize: 10 }}>
                        {contactEmail ?? contactPhone ?? 'Contact discovery required'}
                      </div>
                    </div>

                    <div>
                      <div className="muted" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em' }}>Internal follow-up</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>{fmtDate(row.next_action_at)}</div>
                      <div className="muted" style={{ marginTop: 2, fontSize: 10 }}>
                        Not a claimed event date
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, fontSize: 11, lineHeight: 1.55 }}>
                    <strong>Next:</strong> {row.next_action ?? (contactKnown ? 'Review for rebook outreach.' : 'Find the correct contact route.')}
                  </div>

                  {row.source_url ? (
                    <div style={{ marginTop: 10 }}>
                      <a href={row.source_url} target="_blank" rel="noreferrer" className="muted" style={{ fontSize: 10 }}>
                        Recurrence evidence source ↗
                      </a>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
