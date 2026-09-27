import Link from 'next/link'

interface TechItem {
  label: string
  value: string
}

interface Props {
  techItems: TechItem[]
}

export default function SetControlSection({ techItems }: Props) {
  return (
    <section
      aria-label="How DJ B.A.E. works"
      style={{
        borderTop: '1px solid var(--border)',
        padding: '40px 0 8px',
      }}
    >
      <span className="section-label">Approach</span>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr)',
          gap: '32px',
          alignItems: 'start',
        }}
        className="set-control-editorial"
      >
        <div>
          <h2
            style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: 'clamp(24px, 3.6vw, 40px)',
              lineHeight: 1.08,
              color: 'var(--white)',
              margin: '0 0 14px',
            }}
          >
            How the set comes together.
          </h2>
          <p
            style={{
              margin: 0,
              maxWidth: '520px',
              fontSize: '15px',
              lineHeight: 1.75,
              color: 'var(--muted)',
            }}
          >
            Selection, pacing, and technical setup are adjusted to the room instead of forcing every event into the same format.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '0', borderTop: '1px solid var(--border)' }}>
          {techItems.map((item) => (
            <div
              key={item.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px minmax(0, 1fr)',
                gap: '20px',
                padding: '18px 0',
                borderBottom: '1px solid var(--border)',
              }}
              className="set-control-editorial-row"
            >
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--white)',
                  fontWeight: 500,
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--muted)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '28px' }}>
        <Link href="/book" className="btn-ghost">
          Booking Inquiry
        </Link>
      </div>
    </section>
  )
}
