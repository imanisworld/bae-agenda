import { afterEach, describe, expect, it, vi } from 'vitest'
import { syncBookingDepositState } from './booking-deposit-sync'

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

  const updateEq = vi.fn().mockResolvedValue({
    error: args.updateError ?? null,
  })
  const update = vi.fn(() => ({ eq: updateEq }))

  const from = vi.fn(() => ({ select, update }))

  return {
    admin: { from },
    update,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('booking deposit state sync', () => {
  it('writes paid deposit snapshot fields derived from received payments', async () => {
    const setup = buildAdmin({
      booking: {
        deposit_amount: 300,
        payments: [
          {
            amount: 150,
            type: 'deposit',
            status: 'received',
            method: 'zelle',
            paid_at: '2026-09-28T16:00:00.000Z',
          },
          {
            amount: 150,
            type: 'deposit',
            status: 'received',
            method: 'stripe',
            paid_at: '2026-09-28T17:00:00.000Z',
          },
        ],
      },
    })

    const result = await syncBookingDepositState(setup.admin, 'booking-1')

    expect(result).toEqual({
      depositStatus: 'paid',
      depositPaidAt: '2026-09-28T17:00:00.000Z',
      depositConfirmedVia: 'stripe',
      updated: true,
    })
    expect(setup.update).toHaveBeenCalledWith({
      deposit_status: 'paid',
      deposit_paid_at: '2026-09-28T17:00:00.000Z',
      deposit_confirmed_via: 'stripe',
    })
  })

  it('preserves the computed state when an older schema lacks deposit snapshot columns', async () => {
    const setup = buildAdmin({
      booking: {
        deposit_amount: 300,
        payments: [
          {
            amount: 300,
            type: 'deposit',
            status: 'received',
            method: 'stripe',
            paid_at: '2026-09-28T17:00:00.000Z',
          },
        ],
      },
      updateError: {
        message: 'column bookings.deposit_status does not exist',
      },
    })

    await expect(syncBookingDepositState(setup.admin, 'booking-1')).resolves.toEqual({
      depositStatus: 'paid',
      depositPaidAt: '2026-09-28T17:00:00.000Z',
      depositConfirmedVia: 'stripe',
      updated: false,
    })
  })

  it('fails safely when the booking cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const setup = buildAdmin({
      booking: null,
      loadError: { message: 'database unavailable' },
    })

    const result = await syncBookingDepositState(setup.admin, 'booking-1')

    expect(result).toEqual({
      depositStatus: 'unpaid',
      depositPaidAt: null,
      depositConfirmedVia: null,
      updated: false,
    })
    expect(setup.update).not.toHaveBeenCalled()
  })
})
