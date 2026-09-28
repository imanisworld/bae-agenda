/**
 * ADMIN — PAYMENTS
 * Full payments table grouped by status. Data fetched server-side.
 */
import type { CSSProperties } from 'react'
import Link from 'next/link'
import PageHeader      from '@/components/admin/PageHeader'
import Badge           from '@/components/admin/Badge'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import { formatPaymentMethodLabel } from '@/lib/booking-deposit'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import type { PaymentStatus } from '@/types/index'

interface PaymentRow {
  id:           string
  booking_id:   string | null
  booking_name: string
  amount:       number
  type:         string
  method:       string | null
  status:       PaymentStatus
  paid_at:      string | null
  created_at:   string
}

interface PaymentQueryRow {
  id: string
  amount: number
  type: string
  method: string | null
  status: PaymentStatus
  paid_at: string | null
  created_at: string
  bookings:
    | { id: string; event_name: string | null }
    | { id: string; event_name: string | null }[]
    | null
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/Indiana/Indianapolis',
  })
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
  }).format(n)
}

function getBookingName(
  bookingRelation: PaymentQueryRow['bookings'],
) {
  const booking = Array.isArray(bookingRelation)
    ? bookingRelation[0] ?? null
    : bookingRelation

  const name = booking?.event_name?.trim()
  return name && name.length > 0 ? name : 'Unknown'
}

async function getPayments(): Promise<PaymentRow[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('payments')
      .select('id, amount, type, method, status, paid_at, created_at, bookings(id, event_name)')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message || 'Unable to load payments.')
    const rows = (data ?? []) as PaymentQueryRow[]
    return rows.map((p) => {
      return {
        id:           p.id,
        booking_id:   Array.isArray(p.bookings) ? p.bookings[0]?.id ?? null : p.bookings?.id ?? null,
        booking_name: getBookingName(p.bookings),
        amount:       p.amount,
        type:         p.type,
        method:       p.method,
        status:       p.status as PaymentStatus,
        paid_at:      p.paid_at,
        created_at:   p.created_at,
      }
    })
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to load payments.')
  }
}

export default async function PaymentsPage() {
  const payments = await getPayments()

  const pending  = payments.filter((p) => p.status === 'pending')
  const received = payments.filter((p) => p.status === 'received')
  const refunded = payments.filter((p) => p.status === 'refunded')

  const totalReceived = received.reduce((sum, p) => sum + p.amount, 0)
  const totalPending  = pending.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="admin-page">
      <PageHeader title="Payments" />

      {/* Summary row */}
      <div className="admin-summary-grid">
        {[
          { label: 'Received',  value: fmtCurrency(totalReceived), color: '#34d399' },
          { label: 'Pending',   value: fmtCurrency(totalPending),  color: 'var(--gold)'   },
          { label: 'Refunded',  value: `${refunded.length} items`, color: 'var(--muted)'  },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="admin-money-card"
            style={{ '--admin-money-color': color } as CSSProperties}
          >
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">All Payments</span>
        </div>

        {payments.length === 0 ? (
          <AdminEmptyState
            title="No payments yet"
            desc="Deposits and balances logged against bookings will appear here."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stack">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Paid</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Booking" style={{ fontWeight: 400 }}>{p.booking_name}</td>
                    <td data-label="Type" className="muted" style={{ textTransform: 'capitalize' }}>{p.type}</td>
                    <td data-label="Amount" style={{
                      fontFamily: 'Conthrax, sans-serif', fontSize: '13px',
                      color: p.status === 'received' ? '#34d399'
                        : p.status === 'refunded' ? '#e85d75'
                        : 'var(--gold)',
                    }}>
                      {fmtCurrency(p.amount)}
                    </td>
                    <td data-label="Method" className="muted" style={{ textTransform: 'capitalize' }}>
                      {formatPaymentMethodLabel(p.method)}
                    </td>
                    <td data-label="Status"><Badge variant={p.status} /></td>
                    <td data-label="Paid" className="muted">
                      {p.status === 'received' && !p.paid_at
                        ? <span style={{ color: 'var(--gold)' }}>Missing date</span>
                        : fmtDate(p.paid_at)}
                    </td>
                    <td data-label="Actions">
                      {p.booking_id ? (
                        <Link href={`/admin/bookings/${p.booking_id}`} className="admin-view-all">
                          Open / Correct →
                        </Link>
                      ) : '—'}
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
