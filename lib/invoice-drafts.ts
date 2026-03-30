import { invoiceFilename, invoiceNumberOf, type InvoiceBookingData } from '@/lib/invoices'

export interface InvoiceDraftSource extends InvoiceBookingData {
  status: 'inquiry' | 'confirmed' | 'completed' | 'cancelled'
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
  }
}
