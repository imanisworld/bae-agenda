import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAllowedAdminUser } from '@/lib/admin-auth'
import { createRequestId, logError } from '@/lib/monitoring'
import { generateW9Pdf } from '@/lib/w9-pdf'

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

    const pdf = await generateW9Pdf()
    return new NextResponse(pdf, {
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
