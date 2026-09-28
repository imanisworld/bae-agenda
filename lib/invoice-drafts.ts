import {
  DEFAULT_INVOICE_PAYMENT_TERMS,
  invoiceFilename,
  invoiceNumberOf,
  type InvoiceBookingData,
} from '@/lib/invoices'

export interface InvoiceDraftSource extends InvoiceBookingData {
  status: 'inquiry' | 'confirmed' | 'completed' | 'cancelled'
}

function invoiceDueDate(booking: InvoiceDraftSource) {
  if (!booking.event_date) return null

  const date = new Date(booking.event_date)
  if (Number.isNaN(date.getTime())) return null

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: booking.event_timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)

    const year = parts.find((part) => part.type === 'year')?.value
    const month = parts.find((part) => part.type === 'month')?.value
    const day = parts.find((part) => part.type === 'day')?.value

    return year && month && day ? `${year}-${month}-${day}` : null
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

export function buildInvoiceDraftRecord(booking: InvoiceDraftSource) {
  const clientName = [booking.clients?.first_name, booking.clients?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Client'

  const totalAmount = booking.quote ?? 0
  const depositAmount = booking.deposit_amount ?? 0
  const balanceDue = totalAmount - depositAmount

  return {
    booking_id: booking.id,
    status: 'draft' as const,
    invoice_number: invoiceNumberOf(booking),
    pdf_filename: invoiceFilename(booking),
    event_name: booking.event_name,
    client_name: clientName,
    client_email: booking.clients?.email?.trim() || null,
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    balance_due: balanceDue,
    due_date: invoiceDueDate(booking),
    payment_terms: DEFAULT_INVOICE_PAYMENT_TERMS,
    line_items: [
      {
        description: booking.event_name?.trim() || 'DJ Services',
        quantity: 1,
        unit_amount: totalAmount,
      },
    ],
  }
}
