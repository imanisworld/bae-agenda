/**
 * BADGE — Admin Server Component
 * Consistent status chips for bookings and payments.
 * Pure CSS — no JS, safe in Server Components.
 */

type BadgeVariant =
  | 'inquiry' | 'new' | 'contacted' | 'negotiating' | 'confirmed' | 'completed' | 'cancelled' | 'lost'   // booking
  | 'pending'  | 'received'  | 'refunded'                  // payment DB
  | 'paid'     | 'unpaid'    | 'partial' | 'deposit_requested' | 'deposit_paid' | 'balance_requested' // payment UI labels

const STYLES: Record<BadgeVariant, { color: string; bg: string; border: string }> = {
  // Booking
  inquiry:   { color: 'var(--gold)',   bg: 'rgba(201,168,76,0.10)',  border: 'rgba(201,168,76,0.30)'  },
  new:       { color: 'var(--gold)',   bg: 'rgba(201,168,76,0.10)',  border: 'rgba(201,168,76,0.30)'  },
  contacted: { color: '#7dd3fc',       bg: 'rgba(125,211,252,0.10)', border: 'rgba(125,211,252,0.30)' },
  negotiating:{ color: '#f59e0b',      bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.30)'  },
  confirmed: { color: '#d98a99',       bg: 'rgba(143,45,60,0.16)',  border: 'rgba(143,45,60,0.38)'  },
  completed: { color: '#34d399',       bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.30)'  },
  cancelled: { color: '#e85d75',       bg: 'rgba(232,93,117,0.10)', border: 'rgba(232,93,117,0.30)'  },
  lost:      { color: '#e85d75',       bg: 'rgba(232,93,117,0.10)', border: 'rgba(232,93,117,0.30)'  },
  // Payment (DB values)
  pending:   { color: 'var(--gold)',   bg: 'rgba(201,168,76,0.10)',  border: 'rgba(201,168,76,0.30)'  },
  received:  { color: '#34d399',       bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.30)'  },
  refunded:  { color: '#e85d75',       bg: 'rgba(232,93,117,0.10)', border: 'rgba(232,93,117,0.30)'  },
  // Payment (UI display labels)
  paid:      { color: '#34d399',       bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.30)'  },
  unpaid:    { color: '#e85d75',       bg: 'rgba(232,93,117,0.10)', border: 'rgba(232,93,117,0.30)'  },
  partial:   { color: 'var(--gold)',   bg: 'rgba(201,168,76,0.10)',  border: 'rgba(201,168,76,0.30)'  },
  deposit_requested: { color: 'var(--gold)', bg: 'rgba(201,168,76,0.10)', border: 'rgba(201,168,76,0.30)' },
  deposit_paid: { color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.30)' },
  balance_requested: { color: '#7dd3fc', bg: 'rgba(125,211,252,0.10)', border: 'rgba(125,211,252,0.30)' },
}

interface BadgeProps {
  variant: BadgeVariant
  label?: string // override display text; defaults to the variant name
}

export default function Badge({ variant, label }: BadgeProps) {
  const s = STYLES[variant]
  const text = label ?? variant

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        fontSize: '9px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontWeight: 500,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: '999px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  )
}
