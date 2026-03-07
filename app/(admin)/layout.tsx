/**
 * ADMIN LAYOUT
 * Wraps all /admin/* routes except /admin/login (which has its own root layout).
 * Server component — reads the session so we can pass user info to the sidebar.
 * Middleware already guarantees the user is authenticated; this is belt-and-suspenders.
 */
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/admin/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--black)',
      }}
    >
      {/* Fixed sidebar — 240px wide */}
      <Sidebar userEmail={user?.email} />

      {/* Scrollable main content — offset by sidebar width */}
      <main
        style={{
          flex: 1,
          marginLeft: '240px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </main>
    </div>
  )
}
