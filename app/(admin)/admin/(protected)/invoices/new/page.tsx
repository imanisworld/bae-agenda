import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminNotice from '@/components/admin/AdminNotice'
import { createInvoiceFromBookingAction } from '@/app/actions/invoices'
import { getPrimaryBookingClient } from '@/lib/booking-client'
import { createAdminClient } from '@/lib/supabase/admin'

interface BookingOption {
  id: string
  event_name: string
  event_date: string
  event_timezone: string | null
  quote: number | null
  deposit_amount: number | null
  status: 'inquiry' | 'confirmed' | 'completed' | 'cancelled'
  clients: Array<{
    first_name: string | null
    last_name: string | null
    email: string | null
  }> | null
}

function fmtCurrency(value: number | null) {
  return (value ?? 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function fmtDate(value: string, timeZone: string | null) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: timeZone || 'UTC',
  })
}

async function getAvailableBookings() {
  const admin = createAdminClient()

  const [{ data: bookingRows }, { data: invoiceRows }] = await Promise.all([
    admin
      .from('bookings')
      .select('id, event_name, event_date, event_timezone, quote, deposit_amount, status, clients(first_name, last_name, email)')
      .order('event_date', { ascending: false }),
    admin
      .from('invoices')
      .select('booking_id'),
  ])

  const alreadyInvoiced = new Set((invoiceRows ?? []).map((row) => row.booking_id))
  const bookings = (bookingRows ?? []) as BookingOption[]

  return bookings.filter((booking) =>
    !alreadyInvoiced.has(booking.id) &&
    booking.status !== 'cancelled'
  )
}

function getErrorMessage(errorParam: string | string[] | undefined) {
  if (!errorParam) return null
  return Array.isArray(errorParam) ? errorParam[0] ?? null : errorParam
}

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[] }>
}) {
  const bookings = await getAvailableBookings()
  const params = searchParams ? await searchParams : undefined
  const errorMessage = getErrorMessage(params?.error)

  const readyBookings = bookings.filter((booking) => (booking.quote ?? 0) > 0)
  const needsQuote = bookings.filter((booking) => (booking.quote ?? 0) <= 0)

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Create Invoice"
        subtitle="Choose a booking. The invoice will inherit its client, event, quote, deposit, and balance."
        action={{ label: 'Back to Invoices', href: '/admin/invoices' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}

      <div className="admin-section invoice-create-panel">
        <div className="admin-section-header">
          <span className="admin-section-title">Invoice Source</span>
        </div>

        {readyBookings.length === 0 ? (
          <AdminEmptyState
            title="No bookings ready to invoice"
            desc="A booking needs a quote greater than $0 and cannot already have an invoice."
            action={{ label: 'Review Bookings', href: '/admin/bookings' }}
          />
        ) : (
          <form action={createInvoiceFromBookingAction} className="invoice-create-form">
            <label className="invoice-create-label" htmlFor="booking_id">
              Booking
            </label>
            <select id="booking_id" name="booking_id" required defaultValue="">
              <option value="" disabled>Select a booking…</option>
              {readyBookings.map((booking) => {
                const client = getPrimaryBookingClient(booking.clients)
                const clientName = client
                  ? [client.first_name, client.last_name].filter(Boolean).join(' ') || 'Client'
                  : 'Client'

                return (
                  <option key={booking.id} value={booking.id}>
                    {booking.event_name} · {clientName} · {fmtDate(booking.event_date, booking.event_timezone)} · {fmtCurrency(booking.quote)}
                  </option>
                )
              })}
            </select>

            <div className="invoice-create-note">
              <strong>Before creating:</strong>
              <span>Edit the booking first if the event details, client, quote, or deposit need to change.</span>
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="admin-btn-primary">
                Create Invoice
              </button>
              <Link href="/admin/invoices" className="admin-btn-ghost">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>

      {needsQuote.length > 0 && (
        <div className="admin-section">
          <div className="admin-section-header">
            <span className="admin-section-title">Needs Quote First</span>
          </div>
          <div className="invoice-needs-quote-list">
            {needsQuote.map((booking) => (
              <div key={booking.id} className="invoice-needs-quote-row">
                <div>
                  <strong>{booking.event_name}</strong>
                  <span>{fmtDate(booking.event_date, booking.event_timezone)}</span>
                </div>
                <Link href={`/admin/bookings/${booking.id}`} className="admin-btn-ghost">
                  Edit Booking
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
