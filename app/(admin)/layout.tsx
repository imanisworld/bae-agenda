/**
 * ADMIN LAYOUT
 * Wraps all /admin/* routes.
 * Session shell only — auth enforcement happens deeper in /(protected).
 */
import Sidebar from '@/components/admin/Sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
}
