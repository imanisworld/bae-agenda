/**
 * ADMIN — PAYMENTS
 * Full payments table grouped by status. Data fetched server-side.
 */
import PageHeader      from '@/components/admin/PageHeader'
import Badge           from '@/components/admin/Badge'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import { createClient } from '@/lib/supabase/server'
import type { PaymentStatus } from '@/types/index'

interface PaymentRow {
  id:           string
  booking_name: string
  amount:       number
  type:         string
  method:       string | null
  status:       PaymentStatus
  paid_at:      string | null
  created_at:   string
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/Chicago',
  })
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

async function getPayments(): Promise<PaymentRow[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('payments')
      .select('id, amount, type, method, status, paid_at, created_at, bookings(event_name)')
      .order('created_at', { ascending: false })
    return (data ?? []).map((p: any) => ({
      id:           p.id,
      booking_name: p.bookings?.event_name ?? 'Unknown',
      amount:       p.amount,
      type:         p.type,
      method:       p.method,
      status:       p.status as PaymentStatus,
      paid_at:      p.paid_at,
      created_at:   p.created_at,
    }))
  } catch {
    return []
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
    <div style={{ padding: '40px 48px', maxWidth: '1120px' }}>
      <PageHeader title="Payments" />

      {/* Summary row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px', marginBottom: '36px',
      }}>
        {[
          { label: 'Received',  value: fmtCurrency(totalReceived), color: '#34d399' },
          { label: 'Pending',   value: fmtCurrency(totalPending),  color: 'var(--gold)'   },
          { label: 'Refunded',  value: `${refunded.length} items`, color: 'var(--muted)'  },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px 24px',
          }}>
            <div style={{
              fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--muted)', marginBottom: '8px',
            }}>
              {label}
            </div>
            <div style={{
              fontFamily: 'Conthrax, sans-serif', fontSize: '22px',
              fontWeight: 600, color, lineHeight: 1,
            }}>
              {value}
            </div>
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
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 400 }}>{p.booking_name}</td>
                    <td className="muted" style={{ textTransform: 'capitalize' }}>{p.type}</td>
                    <td style={{
                      fontFamily: 'Conthrax, sans-serif', fontSize: '13px',
                      color: p.status === 'received' ? '#34d399'
                        : p.status === 'refunded' ? '#e85d75'
                        : 'var(--gold)',
                    }}>
                      {fmtCurrency(p.amount)}
                    </td>
                    <td className="muted" style={{ textTransform: 'capitalize' }}>
                      {p.method ?? '—'}
                    </td>
                    <td><Badge variant={p.status} /></td>
                    <td className="muted">{fmtDate(p.paid_at)}</td>
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
