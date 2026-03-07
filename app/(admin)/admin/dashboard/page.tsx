/**
 * ADMIN DASHBOARD
 * Overview / home page of the admin panel.
 * Phase 1: Stat shell cards (static). Data-fetching added in Phase 2.
 */
import { createClient } from '@/lib/supabase/server'

// ── Stat card shape ──────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'violet' | 'gold' | 'default'
}

function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  const accentColor =
    accent === 'violet'
      ? 'var(--violet)'
      : accent === 'gold'
        ? 'var(--gold)'
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
      <div
        style={{
          fontSize: '10px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Conthrax, sans-serif',
          fontSize: '28px',
          fontWeight: 600,
          color: accentColor,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{sub}</div>
      )}
    </div>
  )
}

// ── Quick link card ──────────────────────────────────────────────
function QuickLink({
  href,
  icon,
  label,
  desc,
}: {
  href: string
  icon: string
  label: string
  desc: string
}) {
  return (
    <a
      href={href}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        padding: '20px 24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        textDecoration: 'none',
        transition: `border-color var(--motion-fast) var(--ease-standard),
                     background var(--motion-fast) var(--ease-standard)`,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
          'rgba(155,93,229,0.3)'
        ;(e.currentTarget as HTMLAnchorElement).style.background =
          'var(--violet-dim)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
          'var(--border)'
        ;(e.currentTarget as HTMLAnchorElement).style.background =
          'var(--surface)'
      }}
    >
      <span style={{ fontSize: '20px', lineHeight: 1, marginTop: '2px' }}>
        {icon}
      </span>
      <div>
        <div
          style={{
            fontSize: '12px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--white)',
            marginBottom: '4px',
            fontWeight: 500,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{desc}</div>
      </div>
    </a>
  )
}

// ── Page ─────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Format today's date
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1100px' }}>
      {/* ── Page header ──────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <h1
          style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: 'var(--white)',
            marginBottom: '6px',
          }}
        >
          Dashboard
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--muted)' }}>{today}</p>
      </div>

      {/* ── Setup notice — shown until Supabase is connected ── */}
      <div
        style={{
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.25)',
          padding: '16px 20px',
          marginBottom: '40px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '14px', marginTop: '1px' }}>⚠️</span>
        <div>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              marginBottom: '4px',
              fontWeight: 500,
            }}
          >
            Supabase Setup Required
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
            Add your Supabase credentials to <code style={{ color: 'var(--white)', fontSize: '11px' }}>.env.local</code> and
            run the database migration to see live data. Stats below are placeholders.
          </div>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '48px',
        }}
      >
        <StatCard
          label="Upcoming Events"
          value="—"
          sub="Next 30 days"
          accent="violet"
        />
        <StatCard
          label="Active Bookings"
          value="—"
          sub="Confirmed"
          accent="violet"
        />
        <StatCard
          label="Pending Inquiries"
          value="—"
          sub="Needs response"
          accent="gold"
        />
        <StatCard
          label="Total Clients"
          value="—"
          sub="All time"
        />
      </div>

      {/* ── Quick links ──────────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <h2
          style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: '12px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '16px',
          }}
        >
          Quick Access
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px',
          }}
        >
          <QuickLink
            href="/admin/bookings"
            icon="📋"
            label="Bookings"
            desc="View and manage all booking requests"
          />
          <QuickLink
            href="/admin/events"
            icon="📅"
            label="Events"
            desc="Manage upcoming and past events"
          />
          <QuickLink
            href="/admin/clients"
            icon="👤"
            label="Clients"
            desc="Client records and contact history"
          />
          <QuickLink
            href="/admin/payments"
            icon="💰"
            label="Payments"
            desc="Track deposits, balances, and invoices"
          />
          <QuickLink
            href="/admin/content"
            icon="✏️"
            label="Content"
            desc="Edit public-facing site content"
          />
        </div>
      </div>
    </div>
  )
}
