import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/admin/PageHeader'
import SendInvoiceButton from '@/components/admin/SendInvoiceButton'
import { createInvoiceFromBookingAction, restoreInvoiceDraftAction, voidInvoiceAction } from '@/app/actions/invoices'
import { formatEventDate, formatEventTimeRange } from '@/lib/date-time'

export const dynamic = 'force-dynamic'

interface InvoiceState {
  status: 'draft' | 'sent' | 'paid' | 'void'
  invoice_number: string
  sent_at: string | null
  created_at: string
}

interface BookingRow {
  id:             string
  event_name:     string | null
  event_type:     string | null
  event_date:     string | null
  event_end_time: string | null
  event_timezone: string | null
  venue:          string | null
  city:           string | null
  package:        string | null
  hours:          number | null
  quote:          number | null
  deposit_amount: number | null
  notes:          string | null
  clients: {
    first_name: string | null
    last_name:  string | null
    email:      string | null
    phone:      string | null
  } | null
}

async function getBooking(id: string): Promise<BookingRow | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('bookings')
    .select(`
      id, event_name, event_type, event_date, event_end_time, event_timezone, venue, city,
      package, hours, quote, deposit_amount, notes,
      clients(first_name, last_name, email, phone)
    `)
    .eq('id', id)
    .maybeSingle()
  return (data as BookingRow | null) ?? null
}

async function getInvoiceState(id: string): Promise<InvoiceState | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('invoices')
    .select('status, invoice_number, sent_at, created_at')
    .eq('booking_id', id)
    .maybeSingle()

  return (data as InvoiceState | null) ?? null
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(100px, 160px) 1fr',
      gap: '12px',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      fontSize: '13px',
    }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ color: 'var(--white)' }}>{value ?? '—'}</span>
    </div>
  )
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [booking, invoiceState] = await Promise.all([
    getBooking(id),
    getInvoiceState(id),
  ])
  if (!booking) notFound()

  const client = booking.clients as {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  } | null

  const clientName = client
    ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim()
    : '—'

  const eventDate = formatEventDate(booking.event_date, booking.event_timezone)
  const eventTime = formatEventTimeRange(booking.event_date, booking.event_end_time, booking.event_timezone)

  const total   = booking.quote         ?? 0
  const deposit = booking.deposit_amount ?? 0
  const balance = total - deposit

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Invoice Preview"
        subtitle={`${booking.event_name} · ${clientName}`}
        action={{ label: 'Invoice Register', href: '/admin/invoices' }}
      />

      <div className="invoice-preview-meta">
        <div>
          <span className="admin-section-title">Invoice State</span>
          {invoiceState ? (
            <span className={`invoice-status invoice-status--${invoiceState.status}`}>
              {invoiceState.status}
            </span>
          ) : (
            <span className="invoice-status">not created</span>
          )}
        </div>
        <div>
          <span className="admin-section-title">Created</span>
          <strong>
            {invoiceState
              ? new Date(invoiceState.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—'}
          </strong>
        </div>
        <div>
          <span className="admin-section-title">Last Sent</span>
          <strong>
            {invoiceState?.sent_at
              ? new Date(invoiceState.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—'}
          </strong>
        </div>
      </div>

      {/* Invoice card */}
      <div className="admin-section" style={{ padding: '32px', marginBottom: '24px' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: '18px',
              color: 'var(--white)',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}>
              DJ <span style={{ color: 'var(--gold)' }}>B.A.E.</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.7 }}>
              Imani Crumble<br />
              The Bae Agenda<br />
              8320 Berrybush Lane<br />
              Indianapolis, IN 46345<br />
              baebookings@proton.me
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: '22px',
              color: 'var(--gold)',
              letterSpacing: '0.06em',
              marginBottom: '4px',
            }}>
              INVOICE
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              #{id.slice(0, 8).toUpperCase()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Bill to */}
        <div style={{
          background: 'var(--bg-sunken)',
          border: '1px solid var(--border)',
          padding: '16px 20px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
            Bill To
          </div>
          <div style={{ fontSize: '14px', color: 'var(--white)', fontWeight: 500 }}>{clientName}</div>
          {client?.email && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{client.email}</div>}
          {client?.phone && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{client.phone}</div>}
        </div>

        {/* Event details */}
        <div style={{ marginBottom: '24px' }}>
          <Row label="Event" value={booking.event_name} />
          <Row label="Date" value={eventDate} />
          {eventTime && <Row label="Time" value={eventTime} />}
          {booking.venue && <Row label="Venue" value={booking.venue} />}
          {booking.city  && <Row label="City"  value={booking.city}  />}
          {booking.package && <Row label="Package" value={booking.package} />}
          {booking.hours   && <Row label="Hours"   value={`${booking.hours} hr${booking.hours !== 1 ? 's' : ''}`} />}
        </div>

        {/* Totals */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', gap: '48px', fontSize: '13px' }}>
            <span style={{ color: 'var(--muted)' }}>Subtotal</span>
            <span style={{ color: 'var(--white)' }}>{fmt(total)}</span>
          </div>
          {deposit > 0 && (
            <div style={{ display: 'flex', gap: '48px', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>Deposit Paid</span>
              <span style={{ color: 'var(--muted)' }}>−{fmt(deposit)}</span>
            </div>
          )}
          <div style={{
            display: 'flex', gap: '48px',
            fontSize: '16px', fontWeight: 600,
            borderTop: '1px solid var(--border)',
            paddingTop: '10px', marginTop: '4px',
          }}>
            <span style={{ color: 'var(--muted)' }}>Balance Due</span>
            <span style={{ color: 'var(--gold)', fontFamily: 'Conthrax, sans-serif' }}>{fmt(balance)}</span>
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div style={{
            marginTop: '24px',
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
            fontSize: '12px',
            color: 'var(--muted)',
            lineHeight: 1.7,
          }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '6px' }}>Notes</div>
            {booking.notes}
          </div>
        )}

        <div style={{
          marginTop: '24px',
          fontSize: '11px',
          color: 'rgba(250,248,243,0.3)',
          borderTop: '1px solid var(--border)',
          paddingTop: '14px',
        }}>
          Balance due on or before the event date. All sales final.
        </div>
      </div>

      {/* Actions */}
      <div className="admin-form-actions">
        {!invoiceState ? (
          <form action={createInvoiceFromBookingAction}>
            <input type="hidden" name="booking_id" value={id} />
            <button type="submit" className="admin-btn-primary" disabled={!booking.quote || booking.quote <= 0}>
              Create Invoice
            </button>
          </form>
        ) : (
          <>
            {invoiceState.status !== 'paid' && invoiceState.status !== 'void' && (
              <SendInvoiceButton
                bookingId={id}
                clientEmail={client?.email}
                className="admin-btn-primary"
                label={invoiceState.sent_at ? 'Resend Invoice' : 'Send Invoice Email'}
              />
            )}
            {invoiceState.status !== 'void' && (
              <a
                href={`/api/invoice/${id}`}
                download
                className="admin-btn-ghost"
              >
                Download PDF
              </a>
            )}
            {invoiceState.status !== 'paid' && invoiceState.status !== 'void' && (
              <form action={voidInvoiceAction}>
                <input type="hidden" name="booking_id" value={id} />
                <button type="submit" className="admin-btn-danger">
                  Void Invoice
                </button>
              </form>
            )}
            {invoiceState.status === 'void' && (
              <form action={restoreInvoiceDraftAction}>
                <input type="hidden" name="booking_id" value={id} />
                <button type="submit" className="admin-btn-primary">
                  Restore To Draft
                </button>
              </form>
            )}
          </>
        )}
        <Link href={`/admin/bookings/${id}`} className="admin-btn-ghost">
          Edit Booking
        </Link>
        <Link href="/admin/invoices" className="admin-btn-ghost">
          All Invoices
        </Link>
      </div>
    </div>
  )
}
