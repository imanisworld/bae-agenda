'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

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

  // Spring back to 0 on release
  const springTick = useCallback(() => {
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
  }, [])

  const startSpring = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(springTick)
  }, [springTick])

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
          position:   'relative',
          width:      '28px',
          height:     '120px',
          background: 'rgba(8,8,12,0.9)',
          border:     '1px solid rgba(155,93,229,0.25)',
          borderRadius: '3px',
          cursor:     'ns-resize',
          touchAction: 'none',
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

        {/* Thumb */}
        <div style={{
          position:    'absolute',
          left:        '10%',
          right:       '10%',
          top:         `calc(${thumbPct}% - 8px)`,
          height:      '16px',
          background:  `rgba(155,93,229,${0.5 + intensity * 0.5})`,
          borderRadius: '2px',
          boxShadow:   intensity > 0.05
            ? `0 0 ${8 + intensity * 12}px rgba(155,93,229,${0.4 + intensity * 0.4})`
            : 'none',
          transition:  'background 60ms ease, box-shadow 60ms ease',
          // Grip lines
          display:     'flex',
          flexDirection: 'column',
          alignItems:  'center',
          justifyContent: 'center',
          gap:         '3px',
        }}>
          <span style={{ display: 'block', width: '60%', height: '1px', background: 'rgba(255,255,255,0.4)' }} />
          <span style={{ display: 'block', width: '60%', height: '1px', background: 'rgba(255,255,255,0.4)' }} />
        </div>
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
