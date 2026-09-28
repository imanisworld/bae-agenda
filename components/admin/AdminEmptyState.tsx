/**
 * ADMIN EMPTY STATE — Server Component
 * Used inside tables and sections when there is no data yet.
 */
import Link from 'next/link'

interface AdminEmptyStateProps {
  title: string
  desc?: string
  action?: { label: string; href: string }
}

export default function AdminEmptyState({ title, desc, action }: AdminEmptyStateProps) {
  return (
    <div className="admin-empty-state">
      <span className="admin-empty-mark" aria-hidden="true" />
      <div className="admin-empty-title">{title}</div>
      {desc && <p>{desc}</p>}
      {action && (
        <Link href={action.href} className="admin-btn-ghost">
          {action.label}
        </Link>
      )}
    </div>
  )
}
