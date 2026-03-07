/**
 * AUTH SERVER ACTIONS
 * Server-side auth mutations called from Client Components.
 * 'use server' ensures these never run in the browser bundle.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Sign out the current admin user and redirect to /admin/login.
 * Called from the Sidebar logout button.
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
