'use client'

import { useState } from 'react'

const LEVERS = [
  { id: 'l1', label: 'CACHE'  },
  { id: 'l2', label: 'AUTH'   },
  { id: 'l3', label: 'DEPLOY' },
]

export default function LeverFX() {
  const [on, setOn] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setOn(prev => {
      const n = new Set(prev)
      if (n.has(id)) {
        n.delete(id)
      } else {
        n.add(id)
      }
      return n
    })
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{
        fontSize:      '8px',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color:         'rgba(255,255,255,0.28)',
        fontFamily:    'DM Sans, sans-serif',
        marginBottom:  '10px',
      }}>
        Lever FX
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {LEVERS.map(({ id, label }) => {
          const isOn = on.has(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              style={{
                all:         'unset',
                display:     'grid',
                gap:         '6px',
                justifyItems:'center',
                padding:     '10px 6px',
                background:  isOn ? 'rgba(251,139,35,0.07)' : 'rgba(10,10,14,0.95)',
                border:      `1px solid ${isOn ? 'rgba(251,139,35,0.35)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius:'3px',
                cursor:      'pointer',
                transition:  'background 100ms ease, border-color 100ms ease',
                touchAction: 'none',
                userSelect:  'none',
              }}
            >
              <span style={{
                fontSize:      '7px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color:         'rgba(255,255,255,0.3)',
                fontFamily:    'DM Sans, sans-serif',
              }}>
                HOLD
              </span>

              {/* LED bar */}
              <div style={{
                width:        '100%',
                height:       '7px',
                borderRadius: '2px',
                background:   isOn
                  ? 'linear-gradient(90deg, rgba(251,139,35,0.3) 0%, #fb8b23 50%, rgba(251,139,35,0.3) 100%)'
                  : 'rgba(255,255,255,0.05)',
                boxShadow:    isOn
                  ? '0 0 8px rgba(251,139,35,0.7), 0 0 20px rgba(251,139,35,0.2)'
                  : 'none',
                transition:   'background 100ms ease, box-shadow 100ms ease',
              }} />

              <span style={{
                fontSize:      '7px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color:         isOn ? 'rgba(251,139,35,0.85)' : 'rgba(255,255,255,0.2)',
                fontFamily:    'DM Sans, sans-serif',
                transition:    'color 100ms ease',
              }}>
                {isOn ? 'ON' : label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
