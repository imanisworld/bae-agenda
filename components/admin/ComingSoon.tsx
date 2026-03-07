/**
 * COMING SOON — Admin stub placeholder
 * Used by Phase 1 admin pages that haven't been built yet.
 * Replaced section-by-section during Phase 2 & 3.
 */

interface ComingSoonProps {
  title: string
  icon: string
  desc: string
}

export function ComingSoon({ title, icon, desc }: ComingSoonProps) {
  return (
    <div
      style={{
        padding: '40px 48px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: '48px' }}>
        <h1
          style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: 'var(--white)',
          }}
        >
          {title}
        </h1>
      </div>

      {/* Placeholder body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          border: '1px dashed var(--border)',
          padding: '80px 40px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '40px' }}>{icon}</span>
        <div
          style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: '14px',
            letterSpacing: '0.1em',
            color: 'var(--muted)',
            textTransform: 'uppercase',
          }}
        >
          Coming in Phase 2
        </div>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--muted)',
            maxWidth: '360px',
            lineHeight: 1.6,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  )
}
