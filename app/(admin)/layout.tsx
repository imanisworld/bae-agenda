/**
 * ADMIN LAYOUT
 * Wraps all /admin/* routes.
 * Auth is disabled — re-enable when Supabase auth is properly configured.
 */
import Sidebar from '@/components/admin/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-shell">
      <Sidebar userEmail={undefined} />
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
