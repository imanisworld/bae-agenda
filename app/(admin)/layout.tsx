<<<<<<< ours
/**
 * ADMIN LAYOUT
 * Wraps all /admin/* routes.
 * Auth is enforced by middleware — this layout just provides the shell.
 */
import Sidebar from '@/components/admin/Sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
=======
export default function AdminRootLayout({
>>>>>>> theirs
  children,
}: {
  children: React.ReactNode
}) {
<<<<<<< ours
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  return (
    <div className="admin-shell">
      <Sidebar userEmail={data.user?.email} />
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
=======
  return children
>>>>>>> theirs
}
