/**
 * STAT CARD — Admin Server Component
 * Branded KPI card used on the dashboard.
 */

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'violet' | 'gold' | 'default'
}

export default function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  return (
    <div className={`admin-stat-card admin-stat-card--${accent}`}>
      <div className="admin-stat-card-topline">
        <span>{label}</span>
        <i aria-hidden="true" />
      </div>
      <div className="admin-stat-card-value">{value}</div>
      {sub && <div className="admin-stat-card-sub">{sub}</div>}
    </div>
  )
}
