/**
 * STAT CARD — Admin Server Component
 * Branded KPI card used on the dashboard.
 */
import Link from 'next/link'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'violet' | 'gold' | 'default'
  href?: string
}

export default function StatCard({ label, value, sub, accent = 'default', href }: StatCardProps) {
  const className = `admin-stat-card admin-stat-card--${accent}`
  const body = (
    <>
      <div className="admin-stat-card-topline">
        <span>{label}</span>
        <i aria-hidden="true" />
      </div>
      <div className="admin-stat-card-value">{value}</div>
      {sub && <div className="admin-stat-card-sub">{sub}</div>}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    )
  }

  return <div className={className}>{body}</div>
}
