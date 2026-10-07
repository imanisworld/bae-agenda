import Link from 'next/link'
import { EVENT_TYPES } from '@/lib/constants'

const LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  'Birthday / Private Party': 'Birthday / Private',
  'Wedding': 'Wedding',
  'Corporate Event': 'Corporate',
  'Club / Venue Night': 'Nightlife / Venue',
  'Brunch / Day Party': 'Brunch / Day Party',
  'Other': 'Something Else',
}

export default function BookingIntentBar({ activeType = '' }: { activeType?: string }) {
  return (
    <section
      aria-labelledby="booking-intent-title"
      style={{
        marginBottom: '18px',
        padding: '18px',
        border: '1px solid var(--border)',
        background: 'rgba(196,165,116,0.035)',
      }}
    >
      <div style={{ display: 'grid', gap: '6px', marginBottom: '14px' }}>
        <span style={{ color: 'var(--gold)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Start with the room
        </span>
        <h2 id="booking-intent-title" style={{ margin: 0, fontFamily: 'Conthrax, sans-serif', fontSize: '18px' }}>
          I&apos;m planning…
        </h2>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px', lineHeight: 1.6 }}>
          Pick one and the booking form starts with that event type selected. You can change it anytime.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
        {EVENT_TYPES.map((type) => {
          const active = activeType === type
          return (
            <Link
              key={type}
              href={`/book?type=${encodeURIComponent(type)}`}
              aria-current={active ? 'true' : undefined}
              style={{
                minHeight: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '9px 11px',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                background: active ? 'rgba(196,165,116,0.1)' : 'var(--off-black)',
                color: active ? 'var(--white)' : 'var(--muted)',
                textDecoration: 'none',
                fontSize: '11px',
              }}
            >
              {LABELS[type]}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
