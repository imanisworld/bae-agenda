import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  createAdminClient: vi.fn(),
  syncBookingDepositState: vi.fn(),
  syncComputedBookingPaymentState: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}))

vi.mock('@/lib/stripe', () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent: mocks.constructEvent,
    },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('@/lib/booking-deposit-sync', () => ({
  syncBookingDepositState: mocks.syncBookingDepositState,
}))

vi.mock('@/lib/booking-payment-sync', () => ({
  syncComputedBookingPaymentState: mocks.syncComputedBookingPaymentState,
}))

import { POST } from './route'

function requestWith(signature = 'sig_test') {
  return new NextRequest('https://thebaeagenda.com/api/stripe/webhook', {
    method: 'POST',
    headers: signature ? { 'stripe-signature': signature } : undefined,
    body: JSON.stringify({}),
  })
}

function buildAdmin(existingPayment: null | {
  id: string
  status: 'pending' | 'received' | 'refunded'
  paid_at: string | null
}) {
  const existingMaybeSingle = vi.fn().mockResolvedValue({
    data: existingPayment,
    error: null,
  })
  const existingEq = vi.fn(() => ({ maybeSingle: existingMaybeSingle }))
  const paymentSelect = vi.fn(() => ({ eq: existingEq }))

  const paymentUpdateEq = vi.fn().mockResolvedValue({ error: null })
  const paymentUpdate = vi.fn(() => ({ eq: paymentUpdateEq }))
  const paymentInsert = vi.fn().mockResolvedValue({ error: null })

  const noteInsert = vi.fn().mockResolvedValue({ error: null })

  const bookingUpdateEq = vi.fn().mockResolvedValue({ error: null })
  const bookingUpdate = vi.fn(() => ({ eq: bookingUpdateEq }))

  const paymentsTable = {
    select: paymentSelect,
    update: paymentUpdate,
    insert: paymentInsert,
  }
  const notesTable = { insert: noteInsert }
  const bookingsTable = { update: bookingUpdate }

  const from = vi.fn((table: string) => {
    if (table === 'payments') return paymentsTable
    if (table === 'notes') return notesTable
    if (table === 'bookings') return bookingsTable
    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    admin: { from },
    paymentUpdate,
    paymentInsert,
    noteInsert,
    bookingUpdate,
  }
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test')
  mocks.syncBookingDepositState.mockResolvedValue({
    depositStatus: 'paid',
    depositPaidAt: '2026-09-28T18:00:00.000Z',
    depositConfirmedVia: 'stripe',
    updated: true,
  })
  mocks.syncComputedBookingPaymentState.mockResolvedValue({
    lifecycleStatus: 'confirmed',
    paymentStatus: 'deposit_paid',
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Stripe webhook endpoint', () => {
  it('rejects requests without a Stripe signature', async () => {
    const response = await POST(requestWith(''))

    expect(response.status).toBe(400)
    expect(mocks.constructEvent).not.toHaveBeenCalled()
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('rejects invalid Stripe signatures before database work', async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error('bad signature')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await POST(requestWith())

    expect(response.status).toBe(400)
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('records a new Stripe deposit once and uses the Stripe event time', async () => {
    const setup = buildAdmin(null)
    mocks.createAdminClient.mockReturnValue(setup.admin)
    mocks.constructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      created: 1790618400,
      data: {
        object: {
          id: 'cs_1',
          amount_total: 25000,
          metadata: { bookingId: 'booking-1' },
        },
      },
    })

    const response = await POST(requestWith())

    expect(response.status).toBe(200)
    expect(setup.paymentInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        booking_id: 'booking-1',
        amount: 250,
        type: 'deposit',
        method: 'stripe',
        status: 'received',
        paid_at: new Date(1790618400 * 1000).toISOString(),
        external_reference: 'cs_1',
      })
    )
    expect(setup.noteInsert).toHaveBeenCalledOnce()
    expect(mocks.syncBookingDepositState).toHaveBeenCalledWith(setup.admin, 'booking-1')
    expect(mocks.syncComputedBookingPaymentState).toHaveBeenCalledWith(setup.admin, 'booking-1')
  })

  it('does not rewrite paid_at or duplicate the timeline note on a webhook retry', async () => {
    const setup = buildAdmin({
      id: 'payment-1',
      status: 'received',
      paid_at: '2026-09-28T17:00:00.000Z',
    })
    mocks.createAdminClient.mockReturnValue(setup.admin)
    mocks.constructEvent.mockReturnValue({
      id: 'evt_retry',
      type: 'checkout.session.completed',
      created: 1790619000,
      data: {
        object: {
          id: 'cs_1',
          amount_total: 25000,
          metadata: { bookingId: 'booking-1' },
        },
      },
    })

    const response = await POST(requestWith())

    expect(response.status).toBe(200)
    expect(setup.paymentInsert).not.toHaveBeenCalled()
    expect(setup.paymentUpdate).toHaveBeenCalledWith({
      status: 'received',
      amount: 250,
      method: 'stripe',
    })
    expect(setup.noteInsert).not.toHaveBeenCalled()
  })

  it('promotes a pending matching payment without replacing an existing paid_at', async () => {
    const setup = buildAdmin({
      id: 'payment-1',
      status: 'pending',
      paid_at: '2026-09-28T16:00:00.000Z',
    })
    mocks.createAdminClient.mockReturnValue(setup.admin)
    mocks.constructEvent.mockReturnValue({
      id: 'evt_pending',
      type: 'checkout.session.completed',
      created: 1790619000,
      data: {
        object: {
          id: 'cs_1',
          amount_total: 25000,
          metadata: { bookingId: 'booking-1' },
        },
      },
    })

    const response = await POST(requestWith())

    expect(response.status).toBe(200)
    expect(setup.paymentUpdate).toHaveBeenCalledWith({
      status: 'received',
      amount: 250,
      method: 'stripe',
    })
    expect(setup.noteInsert).toHaveBeenCalledOnce()
  })
})
