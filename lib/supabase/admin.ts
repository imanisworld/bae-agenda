/**
 * SUPABASE ADMIN CLIENT — Server-only.
 * Uses the service role key which bypasses Row Level Security.
 * Used exclusively in Server Actions for admin mutations.
 *
 * ⚠️  Never import this in Client Components or expose the service key to the browser.
 */
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin credentials missing. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
    )
  }

  // No Database generic — our hand-written types/database.ts lacks the `Relationships`
  // field that @supabase/supabase-js v2.98 expects, causing Insert types to resolve as `never`.
  // Admin mutations are server-only and validated by Supabase RLS; strict TS typing is optional here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, serviceKey, {
    auth: {
      persistSession:   false,
      autoRefreshToken: false,
    },
  })
}
