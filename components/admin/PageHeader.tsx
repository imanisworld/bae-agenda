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
    <div style={{
      display: 'flex', alignItems: 'flex-start',
      justifyContent: 'space-between', flexWrap: 'wrap',
      gap: '16px', marginBottom: '32px',
    }}>
      <div>
        <h1 style={{
          fontFamily: 'Conthrax, sans-serif',
          fontSize: '20px', fontWeight: 600,
          letterSpacing: '0.05em', color: 'var(--white)',
          marginBottom: subtitle ? '6px' : 0,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '12px', color: 'var(--muted)' }}>{subtitle}</p>
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
