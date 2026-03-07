/**
 * NEXT.JS PROXY (formerly middleware.ts)
 * Renamed from middleware.ts → proxy.ts in Next.js 16.
 * Runs at the edge before every matched request.
 *
 * Delegates to updateSession() which:
 *   1. Refreshes the Supabase session token on every request
 *   2. Redirects unauthenticated users away from /admin/*
 *   3. Redirects already-authenticated users away from /admin/login
 */
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT static assets.
     * This ensures session refresh runs on every page and API route.
     */
    '/((?!_next/static|_next/image|favicon.ico|fonts/|images/|videos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
