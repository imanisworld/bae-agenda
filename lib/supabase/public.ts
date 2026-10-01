/**
 * SUPABASE PUBLIC READ CLIENT
 * For public pages only: an anonymous client that never reads cookies, so the
 * pages using it can be cached and served from Vercel's edge (see
 * `export const revalidate` on each public page) instead of rendering on every
 * visit. It sees exactly what any logged-out visitor sees under RLS.
 * Admin and portal code keeps using `@/lib/supabase/server`.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}
