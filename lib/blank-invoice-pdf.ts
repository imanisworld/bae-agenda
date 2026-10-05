import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFForm, type PDFPage } from 'pdf-lib'
import { DEFAULT_INVOICE_PAYMENT_TERMS } from '@/lib/invoices'
import { getPaymentInstructionTextLines } from '@/lib/payment-instructions'

// A blank invoice with fillable boxes. Fill it in Acrobat, Preview or a browser,
// or print it and write on the lines. Same letterhead as the generated invoices.

const PAGE = { width: 612, height: 792, marginX: 56, top: 736 }
const RIGHT = PAGE.width - PAGE.marginX
const violet = rgb(0.52, 0.33, 0.87)
const muted = rgb(0.42, 0.42, 0.48)
const black = rgb(0.08, 0.08, 0.08)
const line = rgb(0.8, 0.8, 0.84)
const LINE_ITEM_ROWS = 8

type Fonts = { regular: PDFFont; bold: PDFFont }

function label(page: PDFPage, text: string, x: number, y: number, fonts: Fonts) {
  page.drawText(text.toUpperCase(), { x, y, size: 8, font: fonts.bold, color: muted })
}

// A single-line box sitting on an underline, so it prints as a write-in line too.
function field(
  form: PDFForm,
  page: PDFPage,
  name: string,
  box: { x: number; y: number; width: number; height?: number },
  fonts: Fonts,
  options: { size?: number; value?: string; multiline?: boolean; alignRight?: boolean } = {}
) {
  const height = box.height ?? 18
  const textField = form.createTextField(name)
  if (options.multiline) textField.enableMultiline()
  if (options.alignRight) textField.setAlignment(2)
  if (options.value) textField.setText(options.value)
  textField.addToPage(page, {
    x: box.x,
    y: box.y,
    width: box.width,
    height,
    font: fonts.regular,
    textColor: black,
    borderWidth: 0,
  })
  textField.setFontSize(options.size ?? 10)
  if (!options.multiline) {
    page.drawLine({
      start: { x: box.x, y: box.y },
      end: { x: box.x + box.width, y: box.y },
      thickness: 0.6,
      color: line,
    })
  }
  return textField
}

function labeledField(
  form: PDFForm,
  page: PDFPage,
  name: string,
  text: string,
  x: number,
  y: number,
  width: number,
  fonts: Fonts
) {
  label(page, text, x, y + 22, fonts)
  field(form, page, name, { x, y, width }, fonts)
}

export async function generateBlankInvoicePdf() {
  const pdf = await PDFDocument.create()
  pdf.setTitle('DJ B.A.E. Invoice')
  pdf.setAuthor('DJ B.A.E. — The Bae Agenda')
  const page = pdf.addPage([PAGE.width, PAGE.height])
  const form = pdf.getForm()
  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  }

  // Letterhead
  page.drawText('DJ ', { x: PAGE.marginX, y: PAGE.top, size: 20, font: fonts.bold, color: black })
  page.drawText('B.A.E.', { x: PAGE.marginX + 28, y: PAGE.top, size: 20, font: fonts.bold, color: violet })
  const sender = ['Imani Crumble', 'The Bae Agenda', '8320 Berrybush Lane', 'Indianapolis, IN 46345', 'baebookings@proton.me']
  sender.forEach((text, index) => {
    page.drawText(text, { x: PAGE.marginX, y: PAGE.top - 22 - index * 13, size: 10, font: fonts.regular, color: muted })
  })

  page.drawText('EVENT INVOICE', { x: RIGHT - 150, y: PAGE.top, size: 18, font: fonts.bold, color: violet })
  const metaX = RIGHT - 190
  ;[
    ['invoice_number', 'Invoice #'],
    ['invoice_date', 'Date'],
    ['due_date', 'Due'],
  ].forEach(([name, text], index) => {
    const y = PAGE.top - 30 - index * 22
    page.drawText(text, { x: metaX, y: y + 5, size: 9, font: fonts.bold, color: muted })
    field(form, page, name, { x: metaX + 60, y, width: 130 }, fonts)
  })

  page.drawLine({ start: { x: PAGE.marginX, y: 650 }, end: { x: RIGHT, y: 650 }, thickness: 1, color: line })

  // Bill to + event, two columns
  const colWidth = (RIGHT - PAGE.marginX - 24) / 2
  const leftX = PAGE.marginX
  const rightX = PAGE.marginX + colWidth + 24
  page.drawText('BILL TO', { x: leftX, y: 630, size: 9, font: fonts.bold, color: violet })
  page.drawText('EVENT', { x: rightX, y: 630, size: 9, font: fonts.bold, color: violet })

  const rows: Array<[[string, string], [string, string]]> = [
    [['bill_to_name', 'Name / Company'], ['event_name', 'Event']],
    [['bill_to_email', 'Email'], ['event_date', 'Date']],
    [['bill_to_phone', 'Phone'], ['event_time', 'Time']],
    [['bill_to_address', 'Address'], ['event_venue', 'Venue & City']],
  ]
  rows.forEach(([left, right], index) => {
    const y = 586 - index * 36
    labeledField(form, page, left[0], left[1], leftX, y, colWidth, fonts)
    labeledField(form, page, right[0], right[1], rightX, y, colWidth, fonts)
  })

  // Charges table
  let y = 448
  const qtyX = RIGHT - 210
  const rateX = RIGHT - 160
  const amountX = RIGHT - 82
  page.drawText('CHARGES', { x: leftX, y, size: 9, font: fonts.bold, color: violet })
  y -= 18
  label(page, 'Description', leftX, y, fonts)
  label(page, 'Qty', qtyX, y, fonts)
  label(page, 'Rate', rateX, y, fonts)
  label(page, 'Amount', amountX, y, fonts)
  y -= 22

  for (let row = 1; row <= LINE_ITEM_ROWS; row++) {
    field(form, page, `item_${row}_description`, { x: leftX, y, width: qtyX - leftX - 12 }, fonts)
    field(form, page, `item_${row}_qty`, { x: qtyX, y, width: 38 }, fonts, { alignRight: true })
    field(form, page, `item_${row}_rate`, { x: rateX, y, width: 66 }, fonts, { alignRight: true })
    field(form, page, `item_${row}_amount`, { x: amountX, y, width: 82 }, fonts, { alignRight: true })
    y -= 21
  }

  // Totals
  y -= 8
  const totals: Array<[string, string, boolean]> = [
    ['subtotal', 'Subtotal', false],
    ['deposit_paid', 'Deposit Paid', false],
    ['balance_due', 'Balance Due', true],
  ]
  for (const [name, text, strong] of totals) {
    page.drawText(text, {
      x: amountX - 110,
      y: y + 5,
      size: strong ? 12 : 10,
      font: strong ? fonts.bold : fonts.regular,
      color: strong ? violet : muted,
    })
    field(form, page, name, { x: amountX, y, width: 82, height: strong ? 20 : 18 }, fonts, {
      alignRight: true,
      size: strong ? 12 : 10,
    })
    y -= 24
  }

  // Notes, payment methods, terms
  const notesTop = 156
  const halfWidth = (RIGHT - PAGE.marginX - 24) / 2
  label(page, 'Notes', leftX, notesTop, fonts)
  page.drawRectangle({ x: leftX, y: 56, width: halfWidth, height: notesTop - 64, borderColor: line, borderWidth: 0.6 })
  field(form, page, 'notes', { x: leftX + 3, y: 59, width: halfWidth - 6, height: notesTop - 70 }, fonts, {
    multiline: true,
    size: 9,
  })

  const paymentLines = getPaymentInstructionTextLines()
  const paymentText = [
    'Payment methods:',
    ...(paymentLines.length ? paymentLines : ['- Zelle / Cash App / Card']),
    '',
    `Terms: ${DEFAULT_INVOICE_PAYMENT_TERMS}`,
  ].join('\n')
  label(page, 'Payment & Terms', rightX, notesTop, fonts)
  page.drawRectangle({ x: rightX, y: 56, width: halfWidth, height: notesTop - 64, borderColor: line, borderWidth: 0.6 })
  field(form, page, 'payment_terms', { x: rightX + 3, y: 59, width: halfWidth - 6, height: notesTop - 70 }, fonts, {
    multiline: true,
    size: 8,
    value: paymentText,
  })

  page.drawText('Thank you!  ·  thebaeagenda.com', { x: leftX, y: 36, size: 9, font: fonts.regular, color: muted })

  form.updateFieldAppearances(fonts.regular)
  return Buffer.from(await pdf.save())
}
