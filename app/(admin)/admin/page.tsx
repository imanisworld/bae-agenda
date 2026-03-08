import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * /admin entry route
 * Sends authenticated users to the dashboard.
 * Sends unauthenticated users to login.
 */
export default async function AdminIndexPage() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()

    if (data.user) {
      redirect('/admin/dashboard')
    }
  } catch {
    // Treat any auth error as unauthenticated
  }

  redirect('/admin/login')
}
