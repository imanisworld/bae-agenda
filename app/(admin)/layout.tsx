/**
 * ADMIN LAYOUT
 * Wraps all /admin/* routes except /admin/login (which has its own root layout).
 * Server component — reads the session so we can pass user info to the sidebar.
 * Middleware already guarantees the user is authenticated; this is belt-and-suspenders.
 */
import { createClient } from '@/lib/supabase/server'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Session unavailable — layout renders without user info
  }

  return (
    <AdminShell userEmail={user?.email}>
      {children}
    </AdminShell>
  )
}
