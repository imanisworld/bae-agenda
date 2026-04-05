'use client'

import { useState } from 'react'

const LEVERS = [
  { id: 'l1', label: 'REVERB' },
  { id: 'l2', label: 'DELAY'  },
  { id: 'l3', label: 'FILTER' },
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
                all:          'unset',
                display:      'grid',
                gap:          '6px',
                justifyItems: 'center',
                padding:      isOn ? '11px 6px 9px' : '10px 6px',
                /* Physical button surface — depresses on activation */
                background:   isOn
                  ? 'linear-gradient(180deg, rgba(20,14,6,0.99) 0%, rgba(34,24,10,0.99) 100%)'
                  : 'linear-gradient(180deg, rgba(52,52,58,0.99) 0%, rgba(20,20,24,0.99) 100%)',
                border:       `1px solid ${isOn ? 'rgba(251,139,35,0.22)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: '4px',
                cursor:       'pointer',
                /* Raised / pressed shadow stack */
                boxShadow:    isOn
                  ? 'inset 0 2px 6px rgba(0,0,0,0.85), inset 0 1px 2px rgba(0,0,0,0.70), 0 0 0 1px rgba(0,0,0,0.75), 0 1px 0 rgba(255,255,255,0.04)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(0,0,0,0.75), 0 3px 7px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.40)',
                transform:    isOn ? 'translateY(1px)' : 'translateY(0)',
                transition:   'background 90ms ease, box-shadow 90ms ease, transform 90ms ease, border-color 90ms ease',
                touchAction:  'none',
                userSelect:   'none',
              }}
            >
              <span style={{
                fontSize:      '7px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color:         isOn ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.30)',
                fontFamily:    'DM Sans, sans-serif',
              }}>
                HOLD
              </span>

              {/* Backlit LED bar */}
              <div style={{
                width:        '100%',
                height:       '8px',
                borderRadius: '2px',
                background:   isOn
                  ? 'linear-gradient(90deg, rgba(251,139,35,0.5) 0%, rgba(255,162,60,1) 50%, rgba(251,139,35,0.5) 100%)'
                  : 'rgba(6,6,10,1)',
                border:       isOn
                  ? '1px solid rgba(251,139,35,0.55)'
                  : '1px solid rgba(0,0,0,0.80)',
                boxShadow:    isOn
                  ? '0 0 10px rgba(251,139,35,0.88), 0 0 26px rgba(251,139,35,0.26), inset 0 1px 0 rgba(255,210,120,0.45)'
                  : 'inset 0 2px 4px rgba(0,0,0,0.95)',
                transition:   'background 90ms ease, box-shadow 90ms ease, border-color 90ms ease',
              }} />

              <span style={{
                fontSize:      '7px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color:         isOn ? 'rgba(251,139,35,0.88)' : 'rgba(255,255,255,0.20)',
                fontFamily:    'DM Sans, sans-serif',
                transition:    'color 90ms ease',
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
