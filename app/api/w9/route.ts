import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { isAllowedAdminUser } from '@/lib/admin-auth'
import { createRequestId, logError } from '@/lib/monitoring'

const PAGE = { width: 612, height: 792, marginX: 56 }
const muted  = rgb(0.42, 0.42, 0.48)
const black  = rgb(0.08, 0.08, 0.08)
const violet = rgb(0.52, 0.33, 0.87)

function rule(page: ReturnType<PDFDocument['addPage']>, y: number) {
  page.drawLine({
    start: { x: PAGE.marginX, y },
    end:   { x: PAGE.width - PAGE.marginX, y },
    thickness: 0.5,
    color: rgb(0.87, 0.87, 0.9),
  })
}

function labelValue(
  page: ReturnType<PDFDocument['addPage']>,
  label: string,
  value: string,
  y: number,
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>,
  regular: Awaited<ReturnType<PDFDocument['embedFont']>>
) {
  page.drawText(label.toUpperCase(), { x: PAGE.marginX, y, size: 8, font: bold, color: muted })
  page.drawText(value || '—', { x: PAGE.marginX + 160, y, size: 11, font: regular, color: black })
  rule(page, y - 10)
  return y - 28
}

export async function GET() {
  const requestId = createRequestId()
  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user || !isAllowedAdminUser(auth.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'X-Robots-Tag': 'noindex, nofollow',
            'X-Request-Id': requestId,
          },
        }
      )
    }

    const { data } = await supabase
      .from('site_content')
      .select('key, value')
      .in('key', ['w9_legal_name', 'w9_business_name', 'w9_classification', 'w9_address', 'w9_city_state_zip', 'w9_tax_id'])

    const map: Record<string, string> = {}
    for (const row of (data ?? []) as Array<{ key: string; value: string | null }>) {
      if (row.value) map[row.key] = row.value
    }

    const pdf     = await PDFDocument.create()
    const page    = pdf.addPage([PAGE.width, PAGE.height])
    const regular = await pdf.embedFont(StandardFonts.Helvetica)
    const bold    = await pdf.embedFont(StandardFonts.HelveticaBold)

    // ── Header ───────────────────────────────────────────────
    page.drawText('DJ ', { x: PAGE.marginX, y: 736, size: 22, font: bold, color: black })
    page.drawText('B.A.E.', { x: PAGE.marginX + 30, y: 736, size: 22, font: bold, color: violet })

    page.drawText('W-9  Request for Taxpayer Identification', {
      x: PAGE.width - PAGE.marginX - 260, y: 736, size: 13, font: bold, color: black,
    })
    page.drawText('Number and Certification', {
      x: PAGE.width - PAGE.marginX - 178, y: 720, size: 10, font: regular, color: muted,
    })

    rule(page, 704)

    // ── Subtitle ─────────────────────────────────────────────
    page.drawText('Prepared by DJ B.A.E. — The Bae Agenda', {
      x: PAGE.marginX, y: 688, size: 10, font: regular, color: muted,
    })
    page.drawText(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
      x: PAGE.width - PAGE.marginX - 160, y: 688, size: 10, font: regular, color: muted,
    })

    // ── Fields ───────────────────────────────────────────────
    let y = 654
    y = labelValue(page, 'Legal Name', map['w9_legal_name'] ?? '', y, bold, regular)
    y = labelValue(page, 'Business Name / DBA', map['w9_business_name'] ?? '', y, bold, regular)
    y = labelValue(page, 'Tax Classification', map['w9_classification'] ?? '', y, bold, regular)
    y = labelValue(page, 'Street Address', map['w9_address'] ?? '', y, bold, regular)
    y = labelValue(page, 'City, State, ZIP', map['w9_city_state_zip'] ?? '', y, bold, regular)

    // Tax ID — masked in display
    const rawId = map['w9_tax_id'] ?? ''
    const maskedId = rawId.length > 4 ? `${'*'.repeat(rawId.length - 4)}${rawId.slice(-4)}` : rawId
    y = labelValue(page, 'Taxpayer ID (SSN / EIN)', maskedId, y, bold, regular)

    y -= 12
    rule(page, y)
    y -= 28

    // ── Certification block ───────────────────────────────────
    page.drawText('Certification', { x: PAGE.marginX, y, size: 10, font: bold, color: black })
    y -= 18

    const cert = 'Under penalties of perjury, I certify that: (1) the number shown on this form is my correct taxpayer identification number, (2) I am not subject to backup withholding, and (3) I am a U.S. citizen or other U.S. person.'
    const words = cert.split(' ')
    let line = ''
    const lineH = 15
    const maxW = PAGE.width - PAGE.marginX * 2

    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (regular.widthOfTextAtSize(test, 10) > maxW) {
        page.drawText(line, { x: PAGE.marginX, y, size: 10, font: regular, color: muted })
        y -= lineH
        line = word
      } else {
        line = test
      }
    }
    if (line) { page.drawText(line, { x: PAGE.marginX, y, size: 10, font: regular, color: muted }); y -= lineH }

    y -= 24
    page.drawText('Signature: ___________________________________', { x: PAGE.marginX, y, size: 11, font: regular, color: black })
    page.drawText(`Date: ${new Date().toLocaleDateString('en-US')}`, { x: PAGE.width - PAGE.marginX - 120, y, size: 11, font: regular, color: black })

    // ── Footer ────────────────────────────────────────────────
    rule(page, 72)
    page.drawText('DJ B.A.E. — The Bae Agenda  ·  thebaeagenda.com  ·  baebookings@proton.me', {
      x: PAGE.marginX, y: 58, size: 9, font: regular, color: muted,
    })

    const bytes = await pdf.save()
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': 'attachment; filename="DJ-BAE-W9.pdf"',
        'Cache-Control':       'no-store, max-age=0',
        'Pragma':              'no-cache',
        'X-Robots-Tag':        'noindex, nofollow',
        'X-Request-Id':        requestId,
      },
    })
  } catch (err) {
    logError('W9 route failed', err, { requestId, route: '/api/w9' })
    return NextResponse.json({ error: 'Failed to generate W-9', requestId }, { status: 500, headers: { 'X-Request-Id': requestId } })
  }
}
