import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/monitoring'

export const dynamic = 'force-dynamic'

function response(body: { status: 'ok' | 'degraded'; checkedAt: string }, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function GET() {
  const checkedAt = new Date().toISOString()

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('events').select('id').limit(1)
    if (error) throw error

    return response({ status: 'ok', checkedAt }, 200)
  } catch (error) {
    logError('Health check failed', error)
    return response({ status: 'degraded', checkedAt }, 503)
  }
}
