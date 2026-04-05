'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * PITCH BEND STRIP
 * Vertical drag strip that springs back to center on release.
 * Inspired by hardware pitch bend / mod wheel controls.
 */
export default function PitchBendStrip() {
  const trackRef   = useRef<HTMLDivElement>(null)
  const rafRef     = useRef<number | null>(null)
  const valueRef   = useRef(0)          // -1 to 1, 0 = center
  const [display, setDisplay] = useState(0) // for rendering
  const isDraggingRef = useRef(false)

  const startSpring = () => {
    const springTick = () => {
      if (isDraggingRef.current) return

      const v = valueRef.current
      if (Math.abs(v) < 0.004) {
        valueRef.current = 0
        setDisplay(0)
        return
      }

      valueRef.current = v * 0.82
      setDisplay(valueRef.current)
      rafRef.current = requestAnimationFrame(springTick)
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(springTick)
  }

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  const getValueFromEvent = (clientY: number) => {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    const relY  = clientY - rect.top
    const norm  = (relY / rect.height) * 2 - 1  // 0→top = -1, 1→bottom = +1 (flip)
    return Math.max(-1, Math.min(1, norm))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const v = getValueFromEvent(e.clientY)
    valueRef.current = v
    setDisplay(v)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    e.preventDefault()
    const v = getValueFromEvent(e.clientY)
    valueRef.current = v
    setDisplay(v)
  }

  const onPointerUp = () => {
    isDraggingRef.current = false
    startSpring()
  }

  // Thumb position: 0% (top) when value=-1, 50% center, 100% bottom when value=+1
  const thumbPct = ((display + 1) / 2) * 100

  // Color shifts violet→white as you push up, violet→muted as you push down
  const intensity = Math.abs(display)
  const isUp = display < 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none',
      }}
    >
      {/* Label top */}
      <div style={{
        fontSize: '8px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: isUp && intensity > 0.05 ? `rgba(155,93,229,${0.6 + intensity * 0.4})` : 'var(--muted)',
        transition: 'color 80ms ease',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        +
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position:     'relative',
          width:        '28px',
          height:       '120px',
          /* Sunken machined channel */
          background:   'linear-gradient(180deg, rgba(4,4,6,1) 0%, rgba(12,12,16,0.96) 50%, rgba(4,4,6,1) 100%)',
          border:       'none',
          borderRadius: '5px',
          boxShadow:    'inset 0 2px 8px rgba(0,0,0,0.98), inset 0 0 0 1px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)',
          cursor:       'ns-resize',
          touchAction:  'none',
        }}
      >
        {/* Center reference line */}
        <div style={{
          position:   'absolute',
          top:        '50%',
          left:       '20%',
          right:      '20%',
          height:     '1px',
          background: 'rgba(155,93,229,0.3)',
          transform:  'translateY(-50%)',
        }} />

        {/* Active fill */}
        <div style={{
          position:   'absolute',
          left:       '20%',
          right:      '20%',
          top:        display < 0 ? `${thumbPct}%` : '50%',
          bottom:     display > 0 ? `${100 - thumbPct}%` : '50%',
          background: `rgba(155,93,229,${0.15 + intensity * 0.4})`,
          transition: 'background 60ms ease',
        }} />

        {/* Thumb — rubber fader pad */}
        <div style={{
          position:      'absolute',
          left:          '8%',
          right:         '8%',
          top:           `calc(${thumbPct}% - 9px)`,
          height:        '18px',
          background:    `linear-gradient(180deg,
            rgba(${100 + Math.round(intensity * 55)},${62 + Math.round(intensity * 28)},${180 + Math.round(intensity * 49)},0.96) 0%,
            rgba(${58 + Math.round(intensity * 28)},${36 + Math.round(intensity * 14)},${108 + Math.round(intensity * 30)},0.99) 100%)`,
          borderRadius:  '3px',
          boxShadow:     `inset 0 1px 0 rgba(255,255,255,${0.14 + intensity * 0.14}),
            inset 0 -1px 0 rgba(0,0,0,0.72),
            0 0 0 1px rgba(0,0,0,0.65),
            0 2px 6px rgba(0,0,0,0.75)
            ${intensity > 0.05 ? `, 0 0 ${8 + Math.round(intensity * 16)}px rgba(155,93,229,${(0.35 + intensity * 0.45).toFixed(2)})` : ''}`,
          transition:    'background 60ms ease, box-shadow 60ms ease',
          /* Grip rib texture via repeating background */
          backgroundImage: `
            repeating-linear-gradient(
              180deg,
              rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px,
              transparent 1px, transparent 4px
            ),
            linear-gradient(180deg,
              rgba(${100 + Math.round(intensity * 55)},${62 + Math.round(intensity * 28)},${180 + Math.round(intensity * 49)},0.96) 0%,
              rgba(${58 + Math.round(intensity * 28)},${36 + Math.round(intensity * 14)},${108 + Math.round(intensity * 30)},0.99) 100%)`,
        }} />
      </div>

      {/* Label bottom */}
      <div style={{
        fontSize: '8px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: !isUp && intensity > 0.05 ? `rgba(155,93,229,${0.6 + intensity * 0.4})` : 'var(--muted)',
        transition: 'color 80ms ease',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        −
      </div>

      {/* Value readout */}
      <div style={{
        fontFamily:    'DM Mono, monospace',
        fontSize:      '9px',
        color:         intensity > 0.05 ? 'var(--violet)' : 'var(--muted)',
        letterSpacing: '0.05em',
        transition:    'color 80ms ease',
      }}>
        {display >= 0 ? '+' : ''}{(display * 100).toFixed(0)}
      </div>

      {/* PITCH label */}
      <div style={{
        fontSize:      '7px',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color:         'var(--muted)',
        fontFamily:    'DM Sans, sans-serif',
        marginTop:     '2px',
      }}>
        PITCH
      </div>
    </div>
  )
}
