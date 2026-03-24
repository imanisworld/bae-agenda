/**
 * NEXT.JS PROXY (formerly middleware.ts)
 * Renamed from middleware.ts → proxy.ts in Next.js 16.
 * Runs at the edge before every matched request.
 *
 * 1. Protects /admin/* — redirects unauthenticated users to /admin/login
 * 2. Excludes /admin/login itself to prevent redirect loops
 * 3. Refreshes the Supabase session token on every request
 */
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /admin/* — skip the login page to avoid infinite redirects
  if (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin/login') &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return updateSession(request)
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
