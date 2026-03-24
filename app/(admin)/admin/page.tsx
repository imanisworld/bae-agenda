import { redirect } from 'next/navigation'

// /admin → /admin/dashboard (auth disabled for now)
export default function AdminIndexPage() {
  redirect('/admin/dashboard')
}
