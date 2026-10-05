import { PDFDocument, type PDFForm, type PDFPage } from 'pdf-lib'
import { DEFAULT_INVOICE_PAYMENT_TERMS } from '@/lib/invoices'
import { getPaymentInstructionTextLines } from '@/lib/payment-instructions'
import { brand, drawBrandFooter, drawBrandHeader, loadBrand, type BrandFonts } from '@/lib/pdf-brand'

// A blank invoice with fillable boxes. Fill it in Acrobat, Preview or a browser,
// or print it and write on the lines. Same letterhead as the generated invoices.

const PAGE = { width: 612, height: 792, marginX: 56 }
const LEFT = PAGE.marginX
const RIGHT = PAGE.width - PAGE.marginX
const LINE_ITEM_ROWS = 8

function label(page: PDFPage, text: string, x: number, y: number, fonts: BrandFonts) {
  page.drawText(text.toUpperCase(), { x, y, size: 7, font: fonts.bold, color: brand.muted })
}

function sectionTitle(page: PDFPage, text: string, x: number, y: number, fonts: BrandFonts) {
  page.drawText(text.toUpperCase(), { x, y, size: 9, font: fonts.heading, color: brand.oxblood })
}

// A single-line box sitting on an underline, so it prints as a write-in line too.
function field(
  form: PDFForm,
  page: PDFPage,
  name: string,
  box: { x: number; y: number; width: number; height?: number },
  fonts: BrandFonts,
  options: { size?: number; value?: string; multiline?: boolean; alignRight?: boolean; bold?: boolean } = {}
) {
  const textField = form.createTextField(name)
  if (options.multiline) textField.enableMultiline()
  if (options.alignRight) textField.setAlignment(2)
  if (options.value) textField.setText(options.value)
  textField.addToPage(page, {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height ?? 17,
    font: options.bold ? fonts.bold : fonts.regular,
    textColor: options.bold ? brand.oxblood : brand.ink,
    ...(options.bold ? { backgroundColor: brand.cream } : {}),
    borderWidth: 0,
  })
  textField.setFontSize(options.size ?? 10)
  textField.updateAppearances(options.bold ? fonts.bold : fonts.regular)
  if (!options.multiline) {
    page.drawLine({
      start: { x: box.x, y: box.y },
      end: { x: box.x + box.width, y: box.y },
      thickness: 0.6,
      color: brand.rule,
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
  fonts: BrandFonts
) {
  label(page, text, x, y + 20, fonts)
  field(form, page, name, { x, y, width }, fonts)
}

export async function generateBlankInvoicePdf() {
  const pdf = await PDFDocument.create()
  pdf.setTitle('DJ B.A.E. Invoice')
  pdf.setAuthor('DJ B.A.E. — The Bae Agenda')
  const page = pdf.addPage([PAGE.width, PAGE.height])
  const form = pdf.getForm()
  const brandAssets = await loadBrand(pdf)
  const { fonts } = brandAssets

  drawBrandHeader(page, brandAssets)

  // Invoice number and dates, one row
  const metaWidth = (RIGHT - LEFT - 32) / 3
  ;[
    ['invoice_number', 'Invoice #'],
    ['invoice_date', 'Invoice Date'],
    ['due_date', 'Due Date'],
  ].forEach(([name, text], index) => {
    labeledField(form, page, name, text, LEFT + index * (metaWidth + 16), 632, metaWidth, fonts)
  })

  // Bill to + event, two columns
  const colWidth = (RIGHT - LEFT - 24) / 2
  const rightX = LEFT + colWidth + 24
  sectionTitle(page, 'Bill To', LEFT, 602, fonts)
  sectionTitle(page, 'Event', rightX, 602, fonts)

  const rows: Array<[[string, string], [string, string]]> = [
    [['bill_to_name', 'Name / Company'], ['event_name', 'Event']],
    [['bill_to_email', 'Email'], ['event_date', 'Date']],
    [['bill_to_phone', 'Phone'], ['event_time', 'Set Time']],
    [['bill_to_address', 'Address'], ['event_venue', 'Venue & City']],
  ]
  rows.forEach(([left, right], index) => {
    const y = 564 - index * 34
    labeledField(form, page, left[0], left[1], LEFT, y, colWidth, fonts)
    labeledField(form, page, right[0], right[1], rightX, y, colWidth, fonts)
  })

  // Charges table
  const qtyX = RIGHT - 210
  const rateX = RIGHT - 160
  const amountX = RIGHT - 82
  sectionTitle(page, 'Charges', LEFT, 432, fonts)
  page.drawRectangle({ x: LEFT, y: 408, width: RIGHT - LEFT, height: 16, color: brand.black })
  const headerY = 413
  ;[
    ['Description', LEFT + 6],
    ['Qty', qtyX],
    ['Rate', rateX],
    ['Amount', amountX],
  ].forEach(([text, x]) => {
    page.drawText(String(text).toUpperCase(), { x: Number(x), y: headerY, size: 7, font: fonts.bold, color: brand.gold })
  })

  let y = 386
  for (let row = 1; row <= LINE_ITEM_ROWS; row++) {
    field(form, page, `item_${row}_description`, { x: LEFT, y, width: qtyX - LEFT - 12 }, fonts)
    field(form, page, `item_${row}_qty`, { x: qtyX, y, width: 38 }, fonts, { alignRight: true })
    field(form, page, `item_${row}_rate`, { x: rateX, y, width: 66 }, fonts, { alignRight: true })
    field(form, page, `item_${row}_amount`, { x: amountX, y, width: 82 }, fonts, { alignRight: true })
    y -= 20
  }

  // Totals
  y -= 8
  const totals: Array<[string, string, boolean]> = [
    ['subtotal', 'Subtotal', false],
    ['deposit_paid', 'Deposit Paid', false],
    ['balance_due', 'Balance Due', true],
  ]
  for (const [name, text, strong] of totals) {
    if (strong) {
      page.drawRectangle({ x: amountX - 120, y: y - 4, width: RIGHT - amountX + 120, height: 24, color: brand.cream })
    }
    page.drawText(strong ? text.toUpperCase() : text, {
      x: amountX - 112,
      y: y + 4,
      size: strong ? 9 : 9.5,
      font: strong ? fonts.heading : fonts.regular,
      color: strong ? brand.oxblood : brand.muted,
    })
    field(form, page, name, { x: amountX, y: strong ? y - 1 : y, width: 82, height: strong ? 19 : 17 }, fonts, {
      alignRight: true,
      size: strong ? 12 : 10,
      bold: strong,
    })
    y -= 23
  }

  // Notes, payment methods, terms
  const boxTop = 152
  const boxBottom = 52
  const halfWidth = (RIGHT - LEFT - 24) / 2
  label(page, 'Notes', LEFT, boxTop + 6, fonts)
  label(page, 'Payment & Terms', rightX, boxTop + 6, fonts)
  for (const x of [LEFT, rightX]) {
    page.drawRectangle({ x, y: boxBottom, width: halfWidth, height: boxTop - boxBottom, borderColor: brand.rule, borderWidth: 0.6 })
  }
  field(form, page, 'notes', { x: LEFT + 3, y: boxBottom + 3, width: halfWidth - 6, height: boxTop - boxBottom - 6 }, fonts, {
    multiline: true,
    size: 9,
  })

  const paymentLines = getPaymentInstructionTextLines()
  const paymentText = [
    'Pay by:',
    ...(paymentLines.length ? paymentLines : ['- Zelle / Cash App / Card']),
    '',
    DEFAULT_INVOICE_PAYMENT_TERMS,
  ].join('\n')
  field(form, page, 'payment_terms', { x: rightX + 3, y: boxBottom + 3, width: halfWidth - 6, height: boxTop - boxBottom - 6 }, fonts, {
    multiline: true,
    size: 8,
    value: paymentText,
  })

  drawBrandFooter(page, fonts)

  return Buffer.from(await pdf.save())
}
