'use client'

export default function PrintPressKitButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label="Print or save the press kit as a PDF"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 18px',
        background: '#111',
        color: '#f4f1eb',
        border: '1px solid rgba(0,0,0,0.18)',
        cursor: 'pointer',
        fontSize: '11px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}
    >
      Print / Save PDF
    </button>
  )
}
