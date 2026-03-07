/**
 * STAT CARD — Admin Server Component
 * Top-level KPI card used on the dashboard.
 */

interface StatCardProps {
  label:   string
  value:   string | number
  sub?:    string
  accent?: 'violet' | 'gold' | 'default'
}

export default function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  const accentColor =
    accent === 'violet' ? 'var(--violet)'
    : accent === 'gold' ? 'var(--gold)'
    : 'var(--white)'

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{
        fontSize: '9px', letterSpacing: '0.22em',
        textTransform: 'uppercase', color: 'var(--muted)',
      }}>
        {label}
      </div>

      <div style={{
        fontFamily: 'Conthrax, sans-serif',
        fontSize: '30px', fontWeight: 600,
        color: accentColor, lineHeight: 1,
      }}>
        {value}
      </div>

      {sub && (
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{sub}</div>
      )}
    </div>
  )
}
