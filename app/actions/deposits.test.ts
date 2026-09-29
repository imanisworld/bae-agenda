import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdminUser: vi.fn(),
  createAdminClient: vi.fn(),
  syncBookingDepositState: vi.fn(),
  syncComputedBookingPaymentState: vi.fn(),
  getStripeClient: vi.fn(),
  getAppBaseUrl: vi.fn(),
  checkoutCreate: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}))

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}))

vi.mock('@/lib/admin-auth', () => ({
  requireAdminUser: mocks.requireAdminUser,
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

vi.mock('@/lib/stripe', () => ({
  getStripeClient: mocks.getStripeClient,
  getAppBaseUrl: mocks.getAppBaseUrl,
}))

import { confirmManualDepositAction, startStripeDepositCheckoutAction } from './deposits'

class RedirectSignal extends Error {
  constructor(public url: string) {
    super(url)
  }
}

function formData(overrides: Record<string, string> = {}) {
  const data = new FormData()
  const values = {
    booking_id: 'booking-1',
    method: 'zelle',
    notes: 'Transfer confirmed',
    confirmation_id: '123e4567-e89b-42d3-a456-426614174000',
    ...overrides,
  }

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value)
  }

  return data
}

function buildAdmin(options?: { duplicate?: boolean }) {
  const bookingMaybeSingle = vi.fn().mockResolvedValue({
    data: {
      id: 'booking-1',
      event_name: 'Birthday Party',
      event_date: '2026-10-03T23:00:00.000Z',
      status: 'confirmed',
      lifecycle_status: 'confirmed',
      quote: 1000,
      deposit_amount: 250,
      clients: {
        first_name: 'Imani',
        last_name: 'Crumble',
        email: 'imani@example.com',
      },
      payments: [],
    },
    error: null,
  })
  const bookingSelectEq = vi.fn(() => ({ maybeSingle: bookingMaybeSingle }))
  const bookingSelect = vi.fn(() => ({ eq: bookingSelectEq }))

  const bookingUpdateEq = vi.fn().mockResolvedValue({ error: null })
  const bookingUpdate = vi.fn(() => ({ eq: bookingUpdateEq }))

  const paymentInsert = vi.fn().mockResolvedValue(
    options?.duplicate
      ? { error: { code: '23505', message: 'duplicate key value violates unique constraint' } }
      : { error: null }
  )

  const existingMaybeSingle = vi.fn().mockResolvedValue({
    data: options?.duplicate ? { id: 'payment-existing' } : null,
    error: null,
  })
  const existingEq = vi.fn(() => ({ maybeSingle: existingMaybeSingle }))
  const paymentSelect = vi.fn(() => ({ eq: existingEq }))

  const noteInsert = vi.fn().mockResolvedValue({ error: null })

  const from = vi.fn((table: string) => {
    if (table === 'bookings') {
      return {
        select: bookingSelect,
        update: bookingUpdate,
      }
    }
    if (table === 'payments') {
      return {
        insert: paymentInsert,
        select: paymentSelect,
      }
    }
    if (table === 'notes') {
      return { insert: noteInsert }
    }
    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    admin: { from },
    paymentInsert,
    paymentSelect,
    noteInsert,
    bookingUpdate,
  }
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()

  mocks.requireAdminUser.mockResolvedValue({ id: 'admin-1' })
  mocks.syncBookingDepositState.mockResolvedValue({
    depositStatus: 'paid',
    depositPaidAt: '2026-09-28T18:00:00.000Z',
    depositConfirmedVia: 'zelle',
    updated: true,
  })
  mocks.syncComputedBookingPaymentState.mockResolvedValue({
    lifecycleStatus: 'confirmed',
    paymentStatus: 'deposit_paid',
  })
  mocks.redirect.mockImplementation((url: string) => {
    throw new RedirectSignal(url)
  })
  mocks.getAppBaseUrl.mockReturnValue('https://thebaeagenda.com')
  mocks.getStripeClient.mockReturnValue({
    checkout: {
      sessions: {
        create: mocks.checkoutCreate,
      },
    },
  })
  mocks.checkoutCreate.mockResolvedValue({
    id: 'cs_test_1',
    url: 'https://checkout.stripe.test/cs_test_1',
  })
})

describe('manual deposit confirmation', () => {
  it('stores a unique external reference for a confirmation attempt', async () => {
    const setup = buildAdmin()
    mocks.createAdminClient.mockReturnValue(setup.admin)

    await expect(confirmManualDepositAction(formData())).rejects.toMatchObject({
      url: expect.stringContaining('success='),
    })

    expect(setup.paymentInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        booking_id: 'booking-1',
        amount: 250,
        type: 'deposit',
        method: 'zelle',
        status: 'received',
        external_reference: 'manual-deposit:booking-1:123e4567-e89b-42d3-a456-426614174000',
      })
    )
    expect(setup.noteInsert).toHaveBeenCalledOnce()
  })

  it('treats a repeated confirmation attempt as success without a second note', async () => {
    const setup = buildAdmin({ duplicate: true })
    mocks.createAdminClient.mockReturnValue(setup.admin)

    await expect(confirmManualDepositAction(formData())).rejects.toMatchObject({
      url: expect.stringContaining('success='),
    })

    expect(setup.paymentSelect).toHaveBeenCalled()
    expect(setup.noteInsert).not.toHaveBeenCalled()
    expect(mocks.syncBookingDepositState).toHaveBeenCalledWith(setup.admin, 'booking-1')
    expect(mocks.syncComputedBookingPaymentState).toHaveBeenCalledWith(setup.admin, 'booking-1')
  })

  it('rejects a missing or invalid confirmation ID before payment work', async () => {
    const setup = buildAdmin()
    mocks.createAdminClient.mockReturnValue(setup.admin)

    await expect(
      confirmManualDepositAction(formData({ confirmation_id: 'bad-id' }))
    ).rejects.toBeInstanceOf(RedirectSignal)

    expect(setup.paymentInsert).not.toHaveBeenCalled()
    expect(setup.noteInsert).not.toHaveBeenCalled()
  })
})


function stripeFormData(overrides: Record<string, string> = {}) {
  const data = new FormData()
  const values = {
    booking_id: 'booking-1',
    checkout_attempt_id: '123e4567-e89b-42d3-a456-426614174001',
    ...overrides,
  }

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value)
  }

  return data
}

describe('Stripe deposit checkout', () => {
  it('uses a stable Stripe idempotency key and redirects to Checkout on success', async () => {
    const setup = buildAdmin()
    mocks.createAdminClient.mockReturnValue(setup.admin)
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      startStripeDepositCheckoutAction(stripeFormData())
    ).rejects.toMatchObject({
      url: 'https://checkout.stripe.test/cs_test_1',
    })

    expect(mocks.checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        customer_email: 'imani@example.com',
        metadata: {
          bookingId: 'booking-1',
          paymentType: 'deposit',
        },
      }),
      {
        idempotencyKey: 'deposit-checkout:booking-1:123e4567-e89b-42d3-a456-426614174001',
      }
    )
    expect(log).not.toHaveBeenCalled()
  })

  it('rejects an invalid checkout attempt ID before calling Stripe', async () => {
    const setup = buildAdmin()
    mocks.createAdminClient.mockReturnValue(setup.admin)

    await expect(
      startStripeDepositCheckoutAction(stripeFormData({ checkout_attempt_id: 'bad-id' }))
    ).rejects.toBeInstanceOf(RedirectSignal)

    expect(mocks.checkoutCreate).not.toHaveBeenCalled()
  })

  it('turns a real Stripe session creation failure into a payment-page error', async () => {
    const setup = buildAdmin()
    mocks.createAdminClient.mockReturnValue(setup.admin)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.checkoutCreate.mockRejectedValue(new Error('Stripe unavailable'))

    await expect(
      startStripeDepositCheckoutAction(stripeFormData())
    ).rejects.toMatchObject({
      url: expect.stringContaining('/pay/booking-1?error='),
    })
  })
})
