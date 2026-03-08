'use server'
/**
 * AUTH SERVER ACTIONS
 * Called from the admin Sidebar logout form.
 * 'use server' must be the first line so Next.js treats this as a server-only module.
 * If it were not first, next/headers would end up in the client bundle → client-side crash.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'

export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // If the session is already gone, still redirect to login
  }
  // redirect() must be outside try/catch — it throws a special NEXT_REDIRECT internally
  redirect('/admin/login')
}
