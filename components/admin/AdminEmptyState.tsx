/**
 * ADMIN EMPTY STATE — Server Component
 * Used inside tables and sections when there is no data yet.
 */
import Link from 'next/link'

interface AdminEmptyStateProps {
  title:   string
  desc?:   string
  action?: { label: string; href: string }
}

export default function AdminEmptyState({ title, desc, action }: AdminEmptyStateProps) {
  return (
    <div style={{
      padding: '56px 32px',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', gap: '12px',
    }}>
      <div style={{
        fontFamily: 'Conthrax, sans-serif',
        fontSize: '11px', letterSpacing: '0.15em',
        textTransform: 'uppercase', color: 'var(--muted)',
      }}>
        {title}
      </div>

      {desc && (
        <p style={{
          fontSize: '12px', color: 'var(--muted)',
          lineHeight: 1.6, maxWidth: '320px',
        }}>
          {desc}
        </p>
      )}

      {action && (
        <Link href={action.href} className="admin-btn-ghost" style={{ marginTop: '8px' }}>
          {action.label}
        </Link>
      )}
    </div>
  )
}
