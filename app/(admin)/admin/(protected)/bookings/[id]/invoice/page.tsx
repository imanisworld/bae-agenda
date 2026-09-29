import { randomUUID } from 'node:crypto'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/admin/PageHeader'
import SendInvoiceButton from '@/components/admin/SendInvoiceButton'
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton'
import { createInvoiceFromBookingAction, restoreInvoiceDraftAction, voidInvoiceAction } from '@/app/actions/invoices'
import { createBookingPaymentAction } from '@/app/actions/bookings'
import { formatEventDate, formatEventTimeRange } from '@/lib/date-time'
import {
  DEFAULT_INVOICE_PAYMENT_TERMS,
  applyInvoiceSnapshot,
  formatInvoiceDueDate,
  normalizeInvoiceLineItems,
  type InvoiceSnapshotData,
} from '@/lib/invoices'
import { PAYMENT_METHODS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface InvoiceState extends InvoiceSnapshotData {
  status: 'draft' | 'sent' | 'paid' | 'void'
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
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, event_name, event_type, event_date, event_end_time, event_timezone, venue, city,
      package, hours, quote, deposit_amount, notes,
      clients(first_name, last_name, email, phone)
    `)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message || 'Unable to load booking.')
  return (data as BookingRow | null) ?? null
}

async function getInvoiceState(id: string): Promise<InvoiceState | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('status, invoice_number, pdf_filename, event_name, client_name, client_email, total_amount, deposit_amount, balance_due, due_date, payment_terms, line_items, sent_at, created_at')
    .eq('booking_id', id)
    .maybeSingle()

  if (error) throw new Error(error.message || 'Unable to load invoice.')
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

  const effectiveBooking = applyInvoiceSnapshot(booking, invoiceState)
  const client = effectiveBooking.clients as {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  } | null

  const clientName = client
    ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim()
    : '—'

  const eventDate = formatEventDate(effectiveBooking.event_date, effectiveBooking.event_timezone)
  const eventTime = formatEventTimeRange(effectiveBooking.event_date, effectiveBooking.event_end_time, effectiveBooking.event_timezone)

  const total = effectiveBooking.quote ?? 0
  const deposit = effectiveBooking.deposit_amount ?? 0
  const balance = invoiceState ? Number(invoiceState.balance_due ?? total - deposit) : total - deposit
  const paymentAttemptId = randomUUID()
  const lineItems = normalizeInvoiceLineItems(
    invoiceState?.line_items,
    effectiveBooking.event_name ?? 'DJ Services',
    total
  )
  const dueDate = formatInvoiceDueDate(invoiceState?.due_date)
  const paymentTerms =
    invoiceState?.payment_terms?.trim() || DEFAULT_INVOICE_PAYMENT_TERMS

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Invoice Preview"
        subtitle={`${effectiveBooking.event_name} · ${clientName}`}
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
        <div>
          <span className="admin-section-title">Due</span>
          <strong>{dueDate ?? '—'}</strong>
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
              #{invoiceState?.invoice_number ?? id.slice(0, 8).toUpperCase()}
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
          <Row label="Event" value={effectiveBooking.event_name} />
          <Row label="Date" value={eventDate} />
          {eventTime && <Row label="Time" value={eventTime} />}
          {effectiveBooking.venue && <Row label="Venue" value={effectiveBooking.venue} />}
          {effectiveBooking.city  && <Row label="City"  value={effectiveBooking.city}  />}
          {effectiveBooking.package && <Row label="Package" value={effectiveBooking.package} />}
          {effectiveBooking.hours   && <Row label="Hours"   value={`${effectiveBooking.hours} hr${effectiveBooking.hours !== 1 ? 's' : ''}`} />}
        </div>

        {/* Line items */}
        <div className="invoice-preview-lines">
          <div className="invoice-preview-lines-head">
            <span>Description</span>
            <span>Qty</span>
            <span>Rate</span>
            <span>Amount</span>
          </div>
          {lineItems.map((item, index) => (
            <div key={`${item.description}-${index}`} className="invoice-preview-line">
              <strong>{item.description}</strong>
              <span>{item.quantity}</span>
              <span>{fmt(item.unit_amount)}</span>
              <span>{fmt(item.quantity * item.unit_amount)}</span>
            </div>
          ))}
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
        {effectiveBooking.notes && (
          <div style={{
            marginTop: '24px',
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
            fontSize: '12px',
            color: 'var(--muted)',
            lineHeight: 1.7,
          }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '6px' }}>Notes</div>
            {effectiveBooking.notes}
          </div>
        )}

        <div className="invoice-preview-terms">
          <span>Payment Terms</span>
          <p>{paymentTerms}</p>
          {dueDate && <strong>Due {dueDate}</strong>}
        </div>
      </div>

      {invoiceState && invoiceState.status !== 'paid' && invoiceState.status !== 'void' && balance > 0 && (
        <section className="admin-section invoice-payment-panel">
          <div className="admin-section-header">
            <span className="admin-section-title">Record Payment</span>
            <span className="invoice-balance-due">{fmt(balance)} remaining</span>
          </div>

          <form action={createBookingPaymentAction} className="invoice-payment-form">
            <input type="hidden" name="booking_id" value={id} />
            <input type="hidden" name="payment_attempt_id" value={paymentAttemptId} />
            <input type="hidden" name="type" value="balance" />
            <input type="hidden" name="status" value="received" />
            <input type="hidden" name="return_to" value={`/admin/bookings/${id}/invoice`} />

            <label>
              <span className="admin-field-label">Amount Received</span>
              <input
                name="amount"
                type="number"
                min="0.01"
                max={balance}
                step="0.01"
                defaultValue={balance.toFixed(2)}
                required
              />
            </label>

            <label>
              <span className="admin-field-label">Method</span>
              <select name="method" defaultValue="">
                <option value="">Not specified</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method === 'cash_app'
                      ? 'Cash App'
                      : method === 'ach'
                        ? 'ACH'
                        : method.charAt(0).toUpperCase() + method.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="invoice-payment-notes">
              <span className="admin-field-label">Internal Note</span>
              <input
                name="notes"
                placeholder="Optional payment note or reference"
              />
            </label>

            <div className="admin-form-actions">
              <button type="submit" className="admin-btn-primary">
                Record Payment
              </button>
            </div>
          </form>
        </section>
      )}

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
              <Link href={`/admin/bookings/${id}/invoice/edit`} className="admin-btn-ghost">
                Edit Invoice
              </Link>
            )}
            {invoiceState.status !== 'paid' && invoiceState.status !== 'void' && (
              <SendInvoiceButton
                bookingId={id}
                clientEmail={client?.email}
                className="admin-btn-primary"
                label={invoiceState.sent_at ? 'Resend Invoice' : 'Send Invoice Email'}
              />
            )}
            {invoiceState.status === 'sent' && balance > 0 && (
              <SendInvoiceButton
                bookingId={id}
                clientEmail={client?.email}
                className="admin-btn-ghost"
                label="Send Payment Reminder"
                mode="reminder"
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
                <ConfirmSubmitButton
                  message="Void this invoice? You can restore it later, but it will stop being active."
                  className="admin-btn-danger"
                >
                  Void Invoice
                </ConfirmSubmitButton>
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
