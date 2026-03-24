'use client'

import { useRef, useState } from 'react'

function EQKnob({ band }: { band: string }) {
  const [angle,    setAngle]    = useState(0)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef({ y: 0, angle: 0 })

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    startRef.current = { y: e.clientY, angle }
    setDragging(true)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    const delta = startRef.current.y - e.clientY
    setAngle(Math.max(-135, Math.min(135, startRef.current.angle + delta * 1.5)))
  }

  function onPointerUp() {
    setDragging(false)
  }

  return (
    <div className="build-console-knob-unit">
      <div
        className="build-console-knob"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          transform:  `rotate(${angle}deg)`,
          cursor:     dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          transition: dragging ? 'none' : 'box-shadow 120ms ease',
          boxShadow: dragging
            ? 'inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 1px rgba(155,93,229,0.5), 0 0 14px rgba(155,93,229,0.2)'
            : 'inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      />
      <span className="build-console-dial-label">{band}</span>
    </div>
  )
}

export default function EQKnobs() {
  return (
    <div className="build-console-knob-row">
      {(['LOW', 'MID', 'HI'] as const).map(band => (
        <EQKnob key={band} band={band} />
      ))}
    </div>
  )
}
