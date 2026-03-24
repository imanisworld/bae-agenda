/**
 * ADMIN LAYOUT
 * Wraps all /admin/* routes except /admin/login (which has its own root layout).
 * Server component — reads the session so we can pass user info to the sidebar.
 * Middleware already guarantees the user is authenticated; this is belt-and-suspenders.
 */
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/admin/Sidebar'
import { isAllowedAdminUser } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

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

  if (!user || !isAllowedAdminUser(user)) {
    redirect('/admin/login?error=unauthorized')
  }

  return (
    <div className="admin-shell">
      <Sidebar userEmail={user?.email} />
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
