import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  isAllowedAdminUser: vi.fn(),
  limitInvoiceSend: vi.fn(),
  sendInvoiceNotification: vi.fn(),
  generateInvoicePdf: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('@/lib/admin-auth', () => ({
  isAllowedAdminUser: mocks.isAllowedAdminUser,
}))

vi.mock('@/lib/ratelimit', () => ({
  limitInvoiceSend: mocks.limitInvoiceSend,
}))

vi.mock('@/lib/notifications', () => ({
  sendInvoiceNotification: mocks.sendInvoiceNotification,
}))

vi.mock('@/lib/invoices', () => ({
  DEFAULT_INVOICE_PAYMENT_TERMS: 'Due before event',
  applyInvoiceSnapshot: (booking: unknown) => booking,
  balanceDueOf: () => 800,
  formatInvoiceDueDate: () => null,
  generateInvoicePdf: mocks.generateInvoicePdf,
  invoiceFilename: () => 'invoice.pdf',
  invoiceNumberOf: () => 'BAE-1001',
  normalizeInvoiceLineItems: () => [],
}))

import { POST } from './route'

const attemptId = '123e4567-e89b-42d3-a456-426614174000'
const booking = {
  id: 'booking-1',
  event_name: 'Birthday Party',
  event_type: 'Birthday',
  event_date: '2026-10-03T23:00:00.000Z',
  event_end_time: '2026-10-04T03:00:00.000Z',
  event_timezone: 'America/Indiana/Indianapolis',
  venue: 'Venue',
  city: 'Indianapolis, IN',
  package: 'The Agenda',
  hours: 4,
  quote: 1000,
  deposit_amount: 200,
  notes: null,
  clients: {
    first_name: 'Imani',
    last_name: 'Crumble',
    email: 'imani@example.com',
    phone: '3175551212',
  },
}

function requestWith(
  payload: unknown,
  headers: Record<string, string> = {}
) {
  return new NextRequest('https://thebaeagenda.com/api/invoice/booking-1/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://thebaeagenda.com',
      host: 'thebaeagenda.com',
      ...headers,
    },
    body: JSON.stringify(payload),
  })
}

function queryResult(data: unknown) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
      })),
    })),
  }
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()

  mocks.isAllowedAdminUser.mockReturnValue(true)
  mocks.limitInvoiceSend.mockResolvedValue({
    success: true,
    limit: 5,
    remaining: 4,
    reset: Date.now() + 900_000,
    retryAfter: 0,
  })
  mocks.sendInvoiceNotification.mockResolvedValue({ ok: true })
  mocks.generateInvoicePdf.mockResolvedValue(new Uint8Array([1, 2, 3]))

  const from = vi.fn((table: string) => {
    if (table === 'bookings') return queryResult(booking)
    if (table === 'invoices') return queryResult(null)
    throw new Error(`Unexpected table: ${table}`)
  })

  mocks.createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
      }),
    },
    from,
  })

  mocks.createAdminClient.mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === 'invoices') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      if (table === 'notes') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      throw new Error(`Unexpected admin table: ${table}`)
    }),
  })
})

describe('invoice send endpoint', () => {
  it('rejects cross-origin submissions before auth or email work', async () => {
    const response = await POST(
      requestWith({ mode: 'invoice' }, {
        origin: 'https://attacker.example',
      }),
      { params: Promise.resolve({ id: 'booking-1' }) }
    )

    expect(response.status).toBe(403)
    expect(mocks.createClient).not.toHaveBeenCalled()
    expect(mocks.sendInvoiceNotification).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated invoice sends', async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
      from: vi.fn(),
    })

    const response = await POST(
      requestWith({ mode: 'invoice' }),
      { params: Promise.resolve({ id: 'booking-1' }) }
    )

    expect(response.status).toBe(401)
    expect(mocks.sendInvoiceNotification).not.toHaveBeenCalled()
  })

  it('passes the browser attempt ID through as the Resend idempotency key', async () => {
    const response = await POST(
      requestWith({ mode: 'invoice', attemptId }),
      { params: Promise.resolve({ id: 'booking-1' }) }
    )

    expect(response.status).toBe(200)
    expect(mocks.sendInvoiceNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'imani@example.com',
        invoiceNumber: 'BAE-1001',
        mode: 'invoice',
      }),
      {
        idempotencyKey: `invoice-invoice-booking-1-${attemptId}`,
      }
    )
  })
})
