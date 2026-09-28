import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { formatEventDate, formatEventTimeRange } from '@/lib/date-time'
import { getPaymentInstructionTextLines } from '@/lib/payment-instructions'

export interface InvoiceBookingData {
  id: string
  event_name: string | null
  event_type: string | null
  event_date: string | null
  event_end_time: string | null
  event_timezone: string | null
  venue: string | null
  city: string | null
  package: string | null
  hours: number | null
  quote: number | null
  deposit_amount: number | null
  notes: string | null
  clients: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  } | null
}

export interface InvoiceSnapshotData {
  invoice_number: string
  pdf_filename: string
  event_name: string | null
  client_name: string | null
  client_email: string | null
  total_amount: number
  deposit_amount: number
  balance_due: number
}

export function applyInvoiceSnapshot(
  booking: InvoiceBookingData,
  invoice: InvoiceSnapshotData | null | undefined
): InvoiceBookingData {
  if (!invoice) return booking

  const originalClient = booking.clients
  const clientName = invoice.client_name?.trim()

  return {
    ...booking,
    event_name: invoice.event_name?.trim() || booking.event_name,
    quote: Number(invoice.total_amount ?? booking.quote ?? 0),
    deposit_amount: Number(invoice.deposit_amount ?? booking.deposit_amount ?? 0),
    clients: {
      first_name: clientName || originalClient?.first_name || null,
      last_name: clientName ? null : originalClient?.last_name || null,
      email: invoice.client_email?.trim() || originalClient?.email || null,
      phone: originalClient?.phone || null,
    },
  }
}

const PAGE = {
  width: 612,
  height: 792,
  marginX: 56,
  top: 736,
  bottom: 56,
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

function formatDate(value: string | null) {
  return formatEventDate(value, null, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function clientNameOf(booking: InvoiceBookingData) {
  return [booking.clients?.first_name, booking.clients?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Client'
}

export function invoiceFilename(booking: InvoiceBookingData) {
  return `invoice-${clientNameOf(booking).replace(/\s+/g, '-').toLowerCase()}-${booking.id.slice(0, 8)}.pdf`
}

export function invoiceNumberOf(booking: InvoiceBookingData) {
  return booking.id.slice(0, 8).toUpperCase()
}

export function balanceDueOf(booking: InvoiceBookingData) {
  return (booking.quote ?? 0) - (booking.deposit_amount ?? 0)
}

function wrapText(text: string, maxWidth: number, font: PDFFont, size: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function drawTextBlock(
  page: PDFPage,
  text: string,
  options: {
    x: number
    y: number
    width: number
    font: PDFFont
    size: number
    color?: ReturnType<typeof rgb>
    lineGap?: number
  }
) {
  const lines = wrapText(text, options.width, options.font, options.size)
  let y = options.y
  const step = options.size + (options.lineGap ?? 4)

  for (const line of lines) {
    page.drawText(line, {
      x: options.x,
      y,
      size: options.size,
      font: options.font,
      color: options.color ?? rgb(0.08, 0.08, 0.08),
    })
    y -= step
  }

  return y
}

function drawRule(page: PDFPage, y: number) {
  page.drawLine({
    start: { x: PAGE.marginX, y },
    end: { x: PAGE.width - PAGE.marginX, y },
    thickness: 1,
    color: rgb(0.87, 0.87, 0.9),
  })
}

function drawLabelValueRow(
  page: PDFPage,
  label: string,
  value: string,
  y: number,
  fontBold: PDFFont,
  fontRegular: PDFFont
) {
  page.drawText(label.toUpperCase(), {
    x: PAGE.marginX,
    y,
    size: 9,
    font: fontBold,
    color: rgb(0.42, 0.42, 0.48),
  })

  page.drawText(value || '-', {
    x: PAGE.marginX + 140,
    y,
    size: 11,
    font: fontRegular,
    color: rgb(0.08, 0.08, 0.08),
  })

  drawRule(page, y - 10)
  return y - 26
}

export async function generateInvoicePdf(booking: InvoiceBookingData) {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([PAGE.width, PAGE.height])
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const violet = rgb(0.52, 0.33, 0.87)
  const muted = rgb(0.42, 0.42, 0.48)
  const black = rgb(0.08, 0.08, 0.08)

  const clientName = clientNameOf(booking)
  const eventDate = formatEventDate(booking.event_date, booking.event_timezone, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const eventTime = formatEventTimeRange(booking.event_date, booking.event_end_time, booking.event_timezone)
  const total = booking.quote ?? 0
  const deposit = booking.deposit_amount ?? 0
  const balance = balanceDueOf(booking)
  const invoiceNumber = invoiceNumberOf(booking)

  page.drawText('DJ ', {
    x: PAGE.marginX,
    y: PAGE.top,
    size: 20,
    font: fontBold,
    color: black,
  })
  page.drawText('B.A.E.', {
    x: PAGE.marginX + 28,
    y: PAGE.top,
    size: 20,
    font: fontBold,
    color: violet,
  })

  drawTextBlock(page, 'Imani Crumble\nThe Bae Agenda\n8320 Berrybush Lane\nIndianapolis, IN 46345\nbaebookings@proton.me', {
    x: PAGE.marginX,
    y: PAGE.top - 24,
    width: 220,
    font: fontRegular,
    size: 11,
    color: muted,
    lineGap: 3,
  })

  page.drawText('EVENT INVOICE', {
    x: PAGE.width - 176,
    y: PAGE.top,
    size: 18,
    font: fontBold,
    color: violet,
  })

  drawTextBlock(page, `#${invoiceNumber}\n${formatDate(new Date().toISOString())}`, {
    x: PAGE.width - 176,
    y: PAGE.top - 24,
    width: 120,
    font: fontRegular,
    size: 11,
    color: muted,
    lineGap: 3,
  })

  drawRule(page, PAGE.top - 66)

  page.drawText('BILL TO', {
    x: PAGE.marginX,
    y: PAGE.top - 94,
    size: 9,
    font: fontBold,
    color: muted,
  })

  let billToY = PAGE.top - 114
  billToY = drawTextBlock(page, clientName, {
    x: PAGE.marginX,
    y: billToY,
    width: 240,
    font: fontBold,
    size: 13,
    color: black,
  })

  const billToDetails = [booking.clients?.email, booking.clients?.phone]
    .filter(Boolean)
    .join('\n')

  if (billToDetails) {
    drawTextBlock(page, billToDetails, {
      x: PAGE.marginX,
      y: billToY - 2,
      width: 240,
      font: fontRegular,
      size: 11,
      color: muted,
      lineGap: 3,
    })
  }

  let y = PAGE.top - 188
  y = drawLabelValueRow(page, 'Event', booking.event_name ?? '-', y, fontBold, fontRegular)
  y = drawLabelValueRow(page, 'Date', eventDate, y, fontBold, fontRegular)
  if (eventTime) y = drawLabelValueRow(page, 'Time', eventTime, y, fontBold, fontRegular)

  if (booking.venue) y = drawLabelValueRow(page, 'Venue', booking.venue, y, fontBold, fontRegular)
  if (booking.city) y = drawLabelValueRow(page, 'City', booking.city, y, fontBold, fontRegular)
  if (booking.package) y = drawLabelValueRow(page, 'Package', booking.package, y, fontBold, fontRegular)
  if (booking.hours !== null) {
    y = drawLabelValueRow(page, 'Hours', `${booking.hours} hr${booking.hours !== 1 ? 's' : ''}`, y, fontBold, fontRegular)
  }

  y -= 8
  page.drawText('CHARGES', {
    x: PAGE.marginX,
    y,
    size: 9,
    font: fontBold,
    color: muted,
  })
  y -= 20

  page.drawText(booking.event_name ?? 'DJ Services', {
    x: PAGE.marginX,
    y,
    size: 12,
    font: fontBold,
    color: black,
  })
  page.drawText(formatCurrency(total), {
    x: PAGE.width - PAGE.marginX - 82,
    y,
    size: 12,
    font: fontBold,
    color: black,
  })

  const description = [
    booking.package,
    booking.hours !== null ? `${booking.hours} hr${booking.hours !== 1 ? 's' : ''}` : null,
    eventDate !== '-' ? eventDate : null,
    eventTime,
    [booking.venue, booking.city].filter(Boolean).join(', ') || null,
  ].filter(Boolean).join(' | ')

  if (description) {
    y = drawTextBlock(page, description, {
      x: PAGE.marginX,
      y: y - 18,
      width: PAGE.width - PAGE.marginX * 2 - 100,
      font: fontRegular,
      size: 10,
      color: muted,
      lineGap: 2,
    }) - 4
  } else {
    y -= 22
  }

  drawRule(page, y)
  y -= 24

  page.drawText('Subtotal', {
    x: PAGE.width - PAGE.marginX - 160,
    y,
    size: 11,
    font: fontRegular,
    color: muted,
  })
  page.drawText(formatCurrency(total), {
    x: PAGE.width - PAGE.marginX - 82,
    y,
    size: 11,
    font: fontRegular,
    color: black,
  })

  if (deposit > 0) {
    y -= 20
    page.drawText('Deposit Paid', {
      x: PAGE.width - PAGE.marginX - 160,
      y,
      size: 11,
      font: fontRegular,
      color: muted,
    })
    page.drawText(`-${formatCurrency(deposit)}`, {
      x: PAGE.width - PAGE.marginX - 82,
      y,
      size: 11,
      font: fontRegular,
      color: muted,
    })
  }

  y -= 28
  drawRule(page, y + 12)
  page.drawText('Balance Due', {
    x: PAGE.width - PAGE.marginX - 160,
    y,
    size: 13,
    font: fontBold,
    color: muted,
  })
  page.drawText(formatCurrency(balance), {
    x: PAGE.width - PAGE.marginX - 82,
    y,
    size: 13,
    font: fontBold,
    color: violet,
  })

  if (booking.notes) {
    let notesY = Math.min(y - 54, 210)
    page.drawText('NOTES', {
      x: PAGE.marginX,
      y: notesY,
      size: 9,
      font: fontBold,
      color: muted,
    })
    notesY -= 18
    drawTextBlock(page, booking.notes, {
      x: PAGE.marginX,
      y: notesY,
      width: PAGE.width - PAGE.marginX * 2,
      font: fontRegular,
      size: 10,
      color: muted,
      lineGap: 3,
    })
  }

  const paymentInstructionLines = getPaymentInstructionTextLines()
  const invoiceFooter = [
    'Payment Methods:',
    ...paymentInstructionLines,
    '',
    'Deposit secures your booking.',
    'Remaining balance due before event date.',
    '',
    'Terms:',
    '- Deposit is non-refundable',
    '- Date is not secured until deposit is received',
    '- Final balance must be paid before event',
  ].join('\n')

  drawTextBlock(page, invoiceFooter, {
    x: PAGE.marginX,
    y: PAGE.bottom + 44,
    width: PAGE.width - PAGE.marginX * 2,
    font: fontRegular,
    size: 10,
    color: muted,
    lineGap: 3,
  })

  return pdf.save()
}
