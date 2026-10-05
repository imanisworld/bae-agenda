import { randomUUID } from 'node:crypto'
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton'
import { markFullyPaidAction } from '@/app/actions/bookings'
import { formatPaymentMethodLabel } from '@/lib/booking-deposit'
import { PAYMENT_METHODS } from '@/lib/constants'

// One-step "paid in full" for gigs paid at the door, in cash, or without a deposit.
// Records the remaining balance as received and never emails the client.
export default function MarkPaidForm({
  bookingId,
  balance,
  returnTo,
}: {
  bookingId: string
  balance: number
  returnTo?: string
}) {
  const amount = balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Indiana/Indianapolis' })
  const fieldStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-sunken)',
    border: '1px solid var(--border)',
    color: 'var(--white)',
    padding: '10px 12px',
    fontSize: '13px',
  }

  return (
    <form action={markFullyPaidAction} style={{ display: 'grid', gap: '12px' }}>
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="payment_attempt_id" value={randomUUID()} />
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <label style={{ display: 'grid', gap: '7px' }}>
          <span className="muted" style={{ fontSize: '12px' }}>Paid by</span>
          <select name="method" defaultValue="" style={fieldStyle}>
            <option value="">Not sure</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>{formatPaymentMethodLabel(method)}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: '7px' }}>
          <span className="muted" style={{ fontSize: '12px' }}>Paid on</span>
          <input type="date" name="paid_on" defaultValue={today} style={fieldStyle} />
        </label>
      </div>
      <div>
        <ConfirmSubmitButton
          message={`Record ${amount} as received and mark this paid in full? No email goes to the client.`}
          className="admin-btn-primary"
        >
          Mark paid in full · {amount}
        </ConfirmSubmitButton>
      </div>
    </form>
  )
}
