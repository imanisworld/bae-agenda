'use client'

export default function PrintPressKitButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '14px 22px',
        background: '#5a2dff',
        color: '#fffdfa',
        border: '1px solid #5a2dff',
        cursor: 'pointer',
        fontSize: '11px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}
    >
      Download Press Kit
    </button>
  )
}
