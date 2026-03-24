'use client'

import { useState } from 'react'

const PADS = [
  { id: 'p1', label: 'Booking Flow',   sub: 'Inquiry → Client Record' },
  { id: 'p2', label: 'Content CMS',    sub: 'Admin-Managed Copy'       },
  { id: 'p3', label: 'Public / Admin', sub: 'Separated Data Layers'    },
  { id: 'p4', label: 'Press Kit',      sub: 'Generated from Site Data' },
]

export default function BuildPads() {
  const [lit,     setLit]     = useState<Set<string>>(new Set())
  const [pressed, setPressed] = useState<string | null>(null)

  const toggle = (id: string) => {
    setLit(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '8px',
    }}>
      {PADS.map(({ id, label, sub }) => {
        const isActive = pressed === id
        const isLit    = lit.has(id)
        return (
          <button
            key={id}
            type="button"
            onPointerDown={() => setPressed(id)}
            onPointerUp={() => { setPressed(null); toggle(id) }}
            onPointerLeave={() => setPressed(null)}
            style={{
              all:           'unset',
              display:       'grid',
              gap:           '8px',
              padding:       '16px 14px',
              background:    isLit
                ? 'rgba(251,176,59,0.12)'
                : 'rgba(18,18,22,0.9)',
              border:        `1px solid ${isLit ? 'rgba(251,176,59,0.5)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius:  '3px',
              cursor:        'pointer',
              transform:     isActive ? 'scale(0.96) translateY(1px)' : 'scale(1)',
              boxShadow:     isLit
                ? '0 0 14px rgba(251,176,59,0.2), inset 0 0 8px rgba(251,176,59,0.06)'
                : 'inset 0 1px 0 rgba(255,255,255,0.04)',
              transition:    'background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 80ms ease',
              touchAction:   'none',
              userSelect:    'none',
            }}
          >
            {/* Top indicator LED */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{
                display:      'block',
                width:        '5px',
                height:       '5px',
                borderRadius: '50%',
                background:   isLit ? 'var(--amber)' : 'rgba(255,255,255,0.12)',
                boxShadow:    isLit ? '0 0 6px rgba(251,176,59,0.8)' : 'none',
                transition:   'background 120ms ease, box-shadow 120ms ease',
              }} />
              <span style={{
                fontSize:      '8px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color:         isLit ? 'var(--amber)' : 'rgba(255,255,255,0.25)',
                fontFamily:    'DM Sans, sans-serif',
                transition:    'color 120ms ease',
              }}>
                {isLit ? 'ON' : 'OFF'}
              </span>
            </div>

            <div style={{
              fontSize:   '13px',
              color:      isLit ? 'var(--white)' : 'rgba(255,255,255,0.7)',
              fontFamily: 'Conthrax, sans-serif',
              lineHeight: 1.3,
              transition: 'color 120ms ease',
            }}>
              {label}
            </div>

            <div style={{
              fontSize:      '10px',
              letterSpacing: '0.04em',
              color:         isLit ? 'rgba(251,176,59,0.8)' : 'var(--muted)',
              lineHeight:    1.5,
              transition:    'color 120ms ease',
            }}>
              {sub}
            </div>
          </button>
        )
      })}
    </div>
  )
}
