'use client'

import { useState } from 'react'

export default function HeroDeck() {
  const [isPlaying, setIsPlaying] = useState(true)

  return (
    <button
      type="button"
      className={`hero-deck ${isPlaying ? 'is-playing' : 'is-paused'}`}
      aria-pressed={isPlaying}
      aria-label={isPlaying ? 'Pause sound motion' : 'Play sound motion'}
      onClick={() => setIsPlaying((v) => !v)}
    >
      <span className="hero-turntable" aria-hidden="true">
        <span className="hero-turntable-panel">
          <span className="hero-turntable-aura hero-turntable-aura-a" />
          <span className="hero-turntable-aura hero-turntable-aura-b" />

          <span className="hero-turntable-plinth" />

          <span className="hero-turntable-copy">
            <span className="hero-turntable-kicker">For the weekend</span>
            <span className="hero-turntable-title">Cue it back up.</span>
            <span className="hero-turntable-text">
              {isPlaying ? 'Tap to pause motion' : 'Tap to resume motion'}
            </span>
          </span>

          <span className="hero-turntable-record-window">
            <span className="hero-turntable-record-shadow" />
            <span className="hero-turntable-record">
              <span className="hero-turntable-groove hero-turntable-groove-a" />
              <span className="hero-turntable-groove hero-turntable-groove-b" />
              <span className="hero-turntable-groove hero-turntable-groove-c" />
              <span className="hero-turntable-label">
                <span className="hero-turntable-label-ring" />
                <span className="hero-turntable-label-mark" />
              </span>
              <span className="hero-turntable-spindle" />
              <span className="hero-turntable-shine" />
            </span>
          </span>

          <span className="hero-turntable-arm-base" />
          <span className="hero-turntable-arm">
            <span className="hero-turntable-arm-bar" />
            <span className="hero-turntable-arm-head" />
          </span>

          <span className="hero-turntable-knob hero-turntable-knob-left" />
          <span className="hero-turntable-knob hero-turntable-knob-right" />
          <span className="hero-turntable-switch" />
        </span>
      </span>
    </button>
  )
}
