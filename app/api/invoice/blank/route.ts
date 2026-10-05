import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAllowedAdminUser } from '@/lib/admin-auth'
import { createRequestId, logError } from '@/lib/monitoring'
import { generateBlankInvoicePdf } from '@/lib/blank-invoice-pdf'

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

    const pdf = await generateBlankInvoicePdf()
    return new NextResponse(pdf, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': 'inline; filename="DJ-BAE-blank-invoice.pdf"',
        'Cache-Control':       'no-store, max-age=0',
        'X-Robots-Tag':        'noindex, nofollow',
        'X-Request-Id':        requestId,
      },
    })
  } catch (err) {
    logError('Blank invoice route failed', err, { requestId, route: '/api/invoice/blank' })
    return NextResponse.json({ error: 'Failed to generate blank invoice', requestId }, { status: 500, headers: { 'X-Request-Id': requestId } })
  }
}
