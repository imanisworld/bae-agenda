import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function normalizedAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export function isAllowedAdminUser(user: Pick<User, 'email'> | null | undefined) {
  if (!user?.email) return false

  const allowlist = normalizedAdminEmails()
  if (allowlist.length === 0) {
    return true
  }

  return allowlist.includes(user.email.toLowerCase())
}

export async function requireAdminUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) redirect('/admin/login')

  return user
}
