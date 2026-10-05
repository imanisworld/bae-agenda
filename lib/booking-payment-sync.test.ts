import { afterEach, describe, expect, it, vi } from 'vitest'
import { syncComputedBookingPaymentState } from './booking-payment-sync'

function buildAdmin(args: {
  booking: unknown
  loadError?: { message: string } | null
  updateError?: { message: string } | null
}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: args.booking,
    error: args.loadError ?? null,
  })
  const selectEq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq: selectEq }))

  // Awaitable filter chain: update(...).eq(...).in(...) / .eq(...).eq(...)
  const filters: Array<[string, string, unknown]> = []
  const chain: Record<string, unknown> = {
    eq: vi.fn((column: string, value: unknown) => { filters.push(['eq', column, value]); return chain }),
    in: vi.fn((column: string, value: unknown) => { filters.push(['in', column, value]); return chain }),
    then: (resolve: (value: unknown) => void) => resolve({ error: args.updateError ?? null }),
  }
  const update = vi.fn(() => chain)

  const from = vi.fn(() => ({ select, update }))

  return {
    admin: { from },
    from,
    update,
    filters,
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('booking payment state sync', () => {
  it('writes paid state and balance paid timestamp when received payments cover the quote', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-28T18:30:00.000Z'))

    const setup = buildAdmin({
      booking: {
        status: 'confirmed',
        lifecycle_status: 'confirmed',
        quote: 1200,
        deposit_amount: 300,
        last_balance_reminder_sent_at: null,
        payments: [
          { amount: 300, type: 'deposit', status: 'received' },
          { amount: 900, type: 'balance', status: 'received' },
        ],
      },
    })

    const result = await syncComputedBookingPaymentState(setup.admin, 'booking-1')

    expect(result).toEqual({
      lifecycleStatus: 'confirmed',
      paymentStatus: 'paid',
    })
    expect(setup.update).toHaveBeenCalledWith({
      payment_status: 'paid',
      balance_paid_at: '2026-09-28T18:30:00.000Z',
    })
    expect(setup.from).toHaveBeenCalledWith('invoices')
    expect(setup.update).toHaveBeenCalledWith({ status: 'paid' })
    expect(setup.filters).toContainEqual(['in', 'status', ['draft', 'sent']])
  })

  it('clears balance paid timestamp when the booking is not fully paid', async () => {
    const setup = buildAdmin({
      booking: {
        status: 'confirmed',
        lifecycle_status: 'confirmed',
        quote: 1200,
        deposit_amount: 300,
        last_balance_reminder_sent_at: null,
        payments: [
          { amount: 300, type: 'deposit', status: 'received' },
        ],
      },
    })

    const result = await syncComputedBookingPaymentState(setup.admin, 'booking-1')

    expect(result).toEqual({
      lifecycleStatus: 'confirmed',
      paymentStatus: 'deposit_paid',
    })
    expect(setup.update).toHaveBeenCalledWith({
      payment_status: 'deposit_paid',
      balance_paid_at: null,
    })
    expect(setup.update).toHaveBeenCalledWith({ status: 'sent' })
    expect(setup.filters).toContainEqual(['eq', 'status', 'paid'])
  })

  it('returns null without writing when the booking cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const setup = buildAdmin({
      booking: null,
      loadError: { message: 'database unavailable' },
    })

    await expect(syncComputedBookingPaymentState(setup.admin, 'booking-1')).resolves.toBeNull()
    expect(setup.update).not.toHaveBeenCalled()
  })
})
