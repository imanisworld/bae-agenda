/**
 * ADMIN LAYOUT
 * Wraps all /admin/* routes.
 * Requires a valid Supabase session — redirects to /admin/login if not authenticated.
 */
import Sidebar from '@/components/admin/Sidebar'
import { requireAdminUser } from '@/lib/admin-auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdminUser()

  return (
    <div className="admin-shell">
      <Sidebar userEmail={user.email} />
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
