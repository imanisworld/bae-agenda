/**
 * ADMIN PROTECTED LAYOUT
 * Wraps authenticated /admin/* routes.
 * Server component — reads session so we can pass user info to the sidebar.
 */
import { createClient } from '@/lib/supabase/server'
import AdminShell from '@/components/admin/AdminShell'
import { isAllowedAdminUser } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export default async function AdminProtectedLayout({
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
    // Session unavailable — treat as signed out
  }

  if (!user || !isAllowedAdminUser(user)) {
    redirect('/admin/login?error=unauthorized')
  }

  return (
    <AdminShell userEmail={user?.email}>
      {children}
    </AdminShell>
  )
}
