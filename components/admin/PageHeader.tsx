/**
 * PAGE HEADER — Admin Server Component
 * Consistent title + optional action button across all admin pages.
 */
import Link from 'next/link'

interface PageHeaderProps {
  title:     string
  subtitle?: string
  action?: {
    label: string
    href:  string
  }
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="admin-page-header">
      <div>
        <h1 className="admin-page-title" style={{ marginBottom: subtitle ? '6px' : 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p className="admin-page-subtitle">{subtitle}</p>
        )}
      </div>

      {action && (
        <Link href={action.href} className="admin-btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  )
}
