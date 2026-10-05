import { PDFDocument, degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { formatEventDate, formatEventTimeRange } from '@/lib/date-time'
import { getPaymentInstructionTextLines } from '@/lib/payment-instructions'
import { brand, drawBrandFooter, drawBrandHeader, loadBrand } from '@/lib/pdf-brand'
import { formatPaymentMethodLabel } from '@/lib/booking-deposit'

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

export const DEFAULT_INVOICE_PAYMENT_TERMS =
  'Balance due on or before the event date. Deposit is non-refundable. Final balance must be paid before the event.'

export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_amount: number
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
  due_date?: string | null
  payment_terms?: string | null
  line_items?: InvoiceLineItem[]
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function normalizeInvoiceLineItems(
  value: unknown,
  fallbackDescription = 'DJ Services',
  fallbackTotal = 0
): InvoiceLineItem[] {
  const rows = Array.isArray(value) ? value : []
  const normalized = rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return []

    const candidate = row as Record<string, unknown>
    const description = typeof candidate.description === 'string'
      ? candidate.description.trim()
      : ''
    const quantity = Number(candidate.quantity)
    const unitAmount = Number(candidate.unit_amount)

    if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitAmount) || unitAmount < 0) {
      return []
    }

    return [{
      description,
      quantity: roundCurrency(quantity),
      unit_amount: roundCurrency(unitAmount),
    }]
  })

  if (normalized.length) return normalized.slice(0, 8)

  if (fallbackTotal > 0) {
    return [{
      description: fallbackDescription.trim() || 'DJ Services',
      quantity: 1,
      unit_amount: roundCurrency(fallbackTotal),
    }]
  }

  return []
}

export function invoiceLineItemsTotal(items: InvoiceLineItem[]) {
  return roundCurrency(
    items.reduce((sum, item) => sum + item.quantity * item.unit_amount, 0)
  )
}

export function formatInvoiceDueDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
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

export interface InvoicePaidStamp {
  paidAt: string | null
  methods: string[]
}

type StampPayment = {
  amount: number | string | null
  status: string | null
  method?: string | null
  paid_at?: string | null
}

// Paid in full when received payments cover the invoice total. The stamp shows
// the last payment date and how it came in, so the PDF works as a receipt.
export function getInvoicePaidStamp(
  payments: StampPayment[] | null | undefined,
  total: number
): InvoicePaidStamp | null {
  const received = (payments ?? []).filter((payment) => payment.status === 'received')
  const paidTotal = received.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
  if (total <= 0 || paidTotal + 0.005 < total) return null

  const paidAt = received
    .map((payment) => payment.paid_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null
  const methods = [...new Set(received.map((payment) => payment.method).filter((value): value is string => Boolean(value)))]

  return { paidAt, methods }
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
    color: brand.rule,
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

function drawPaidStamp(
  page: PDFPage,
  stamp: InvoicePaidStamp,
  heading: PDFFont,
  bold: PDFFont,
  origin: { x: number; y: number }
) {
  const angle = 8
  const rad = (angle * Math.PI) / 180
  const width = 164
  const height = 74
  // Positions inside the stamp, turned with it.
  const at = (dx: number, dy: number) => ({
    x: origin.x + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: origin.y + dx * Math.sin(rad) + dy * Math.cos(rad),
  })
  const ink = brand.oxblood

  page.drawRectangle({ ...origin, width, height, rotate: degrees(angle), borderColor: ink, borderWidth: 3, opacity: 0, borderOpacity: 0.85 })
  page.drawRectangle({ ...at(5, 5), width: width - 10, height: height - 10, rotate: degrees(angle), borderColor: ink, borderWidth: 1, opacity: 0, borderOpacity: 0.85 })

  const word = 'PAID'
  const wordSize = 34
  page.drawText(word, {
    ...at((width - heading.widthOfTextAtSize(word, wordSize)) / 2, 30),
    size: wordSize,
    font: heading,
    color: ink,
    opacity: 0.85,
    rotate: degrees(angle),
  })

  const date = stamp.paidAt ? formatDate(stamp.paidAt) : null
  const method = stamp.methods.map((value) => formatPaymentMethodLabel(value)).join(' + ')
  const detail = [date, method].filter(Boolean).join(' · ').toUpperCase()
  if (detail) {
    const detailSize = detail.length > 30 ? 7 : 8
    page.drawText(detail, {
      ...at((width - bold.widthOfTextAtSize(detail, detailSize)) / 2, 14),
      size: detailSize,
      font: bold,
      color: ink,
      opacity: 0.85,
      rotate: degrees(angle),
    })
  }
}

export async function generateInvoicePdf(
  booking: InvoiceBookingData,
  invoice?: InvoiceSnapshotData | null,
  paidStamp?: InvoicePaidStamp | null
) {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([PAGE.width, PAGE.height])
  const brandAssets = await loadBrand(pdf)
  const { regular: fontRegular, bold: fontBold, heading: fontHeading } = brandAssets.fonts

  const violet = brand.oxblood
  const muted = brand.muted
  const black = brand.ink

  const clientName = clientNameOf(booking)
  const eventDate = formatEventDate(booking.event_date, booking.event_timezone, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const eventTime = formatEventTimeRange(booking.event_date, booking.event_end_time, booking.event_timezone)
  const total = invoice ? Number(invoice.total_amount ?? 0) : booking.quote ?? 0
  const deposit = invoice ? Number(invoice.deposit_amount ?? 0) : booking.deposit_amount ?? 0
  const balance = paidStamp
    ? 0
    : invoice ? Number(invoice.balance_due ?? Math.max(total - deposit, 0)) : balanceDueOf(booking)
  const invoiceNumber = invoice?.invoice_number || invoiceNumberOf(booking)
  const dueDate = formatInvoiceDueDate(invoice?.due_date)
  const paymentTerms = invoice?.payment_terms?.trim() || DEFAULT_INVOICE_PAYMENT_TERMS
  const lineItems = normalizeInvoiceLineItems(
    invoice?.line_items,
    booking.event_name ?? 'DJ Services',
    total
  )

  drawBrandHeader(page, brandAssets)

  const invoiceMeta = [`INVOICE #${invoiceNumber}`, formatDate(new Date().toISOString())]
  invoiceMeta.forEach((text, index) => {
    const font = index === 0 ? fontBold : fontRegular
    page.drawText(text, {
      x: PAGE.width - PAGE.marginX - font.widthOfTextAtSize(text, 10),
      y: PAGE.top - 94 - index * 15,
      size: 10,
      font,
      color: index === 0 ? violet : muted,
    })
  })

  page.drawText('BILL TO', {
    x: PAGE.marginX,
    y: PAGE.top - 94,
    size: 9,
    font: fontHeading,
    color: violet,
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

  const billToDetails = [booking.clients?.email, booking.clients?.phone].filter(Boolean) as string[]
  billToDetails.forEach((detail, index) => {
    page.drawText(detail, {
      x: PAGE.marginX,
      y: billToY - 2 - index * 14,
      size: 11,
      font: fontRegular,
      color: muted,
    })
  })

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
    font: fontHeading,
    color: violet,
  })
  y -= 20

  for (const item of lineItems) {
    const itemTotal = item.quantity * item.unit_amount
    page.drawText(item.description, {
      x: PAGE.marginX,
      y,
      size: 11,
      font: fontBold,
      color: black,
    })
    page.drawText(formatCurrency(itemTotal), {
      x: PAGE.width - PAGE.marginX - 82,
      y,
      size: 11,
      font: fontBold,
      color: black,
    })

    if (item.quantity !== 1) {
      y -= 14
      page.drawText(
        `${item.quantity} × ${formatCurrency(item.unit_amount)}`,
        {
          x: PAGE.marginX,
          y,
          size: 9,
          font: fontRegular,
          color: muted,
        }
      )
    }

    y -= 26
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

  const paidRow = paidStamp
    ? { label: 'Paid', amount: total }
    : deposit > 0
      ? { label: 'Deposit Paid', amount: deposit }
      : null
  if (paidRow) {
    y -= 20
    page.drawText(paidRow.label, {
      x: PAGE.width - PAGE.marginX - 160,
      y,
      size: 11,
      font: fontRegular,
      color: muted,
    })
    page.drawText(`-${formatCurrency(paidRow.amount)}`, {
      x: PAGE.width - PAGE.marginX - 82,
      y,
      size: 11,
      font: fontRegular,
      color: muted,
    })
  }

  y -= 28
  const balanceY = y
  drawRule(page, y + 12)
  page.drawRectangle({
    x: PAGE.width - PAGE.marginX - 214,
    y: y - 8,
    width: 214,
    height: 26,
    color: brand.cream,
  })
  page.drawText('BALANCE DUE', {
    x: PAGE.width - PAGE.marginX - 206,
    y,
    size: 10,
    font: fontHeading,
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
      font: fontHeading,
      color: violet,
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
    ...(dueDate ? [`Due Date: ${dueDate}`, ''] : []),
    'Payment Methods:',
    ...paymentInstructionLines,
    '',
    'Terms:',
    paymentTerms,
  ].join('\n')

  const footerWidth = PAGE.width - PAGE.marginX * 2
  const footerLines = invoiceFooter
    .split('\n')
    .flatMap((paragraph) => (paragraph ? wrapText(paragraph, footerWidth, fontRegular, 9) : ['']))
  let footerY = 54 + (footerLines.length - 1) * 12
  for (const footerLine of footerLines) {
    if (footerLine) {
      page.drawText(footerLine, { x: PAGE.marginX, y: footerY, size: 9, font: fontRegular, color: muted })
    }
    footerY -= 12
  }

  if (paidStamp) {
    // Sits in the open space left of the totals, wherever they land.
    drawPaidStamp(page, paidStamp, fontHeading, fontBold, { x: PAGE.marginX + 40, y: balanceY - 12 })
  }

  drawBrandFooter(page, brandAssets.fonts)

  return pdf.save()
}
