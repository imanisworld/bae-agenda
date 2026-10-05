import type { createAdminClient } from '@/lib/supabase/admin'

// Invoices count up: BAE-1001, BAE-1002, … A number is set once when the
// invoice is created and never changes after that.
export const INVOICE_NUMBER_PREFIX = 'BAE-'
export const FIRST_INVOICE_NUMBER = 1001

export function nextInvoiceNumberFrom(existing: Array<string | null | undefined>) {
  const pattern = new RegExp(`^${INVOICE_NUMBER_PREFIX}(\\d+)$`)
  const highest = existing.reduce((max, value) => {
    const match = value?.trim().match(pattern)
    return match ? Math.max(max, Number(match[1])) : max
  }, FIRST_INVOICE_NUMBER - 1)

  return `${INVOICE_NUMBER_PREFIX}${highest + 1}`
}

export async function getNextInvoiceNumber(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${INVOICE_NUMBER_PREFIX}%`)

  if (error) {
    // Don't block an invoice over numbering; the draft falls back to its booking-based number.
    console.error('[invoice-numbers] unable to load invoice numbers:', error.message ?? error)
    return undefined
  }
  return nextInvoiceNumberFrom((data ?? []).map((row) => row.invoice_number as string | null))
}
