/**
 * SUPABASE BROWSER CLIENT
 * Used in Client Components ('use client') for browser-side operations:
 * - auth state listening
 * - booking form submissions from the public site
 * Usage: const supabase = createClient()
 */
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
