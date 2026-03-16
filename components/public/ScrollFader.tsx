'use client'

import { useEffect, useState } from 'react'

const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'mixes', label: 'Mixes' },
  { id: 'events', label: 'Events' },
  { id: 'booking', label: 'Booking' },
  { id: 'built-by', label: 'Built' },
  { id: 'connect', label: 'Connect' },
] as const

export default function ScrollFader() {
  const [activeId, setActiveId] = useState<(typeof SECTIONS)[number]['id']>('home')

  useEffect(() => {
    const sections = SECTIONS
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node))

    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible?.target.id) {
          setActiveId(visible.target.id as (typeof SECTIONS)[number]['id'])
        }
      },
      {
        threshold: [0.25, 0.5, 0.75],
        rootMargin: '-20% 0px -20% 0px',
      }
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const activeIndex = Math.max(
    SECTIONS.findIndex((section) => section.id === activeId),
    0
  )

  function goToSection(id: string) {
    const node = document.getElementById(id)
    if (!node) return

    node.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function goBy(delta: -1 | 1) {
    const next = SECTIONS[activeIndex + delta]
    if (!next) return
    goToSection(next.id)
  }

  return (
    <aside className="scroll-fader" aria-label="Section navigation">
      <button
        type="button"
        className="scroll-fader-step"
        onClick={() => goBy(-1)}
        aria-label="Go to previous section"
        disabled={activeIndex === 0}
      >
        +
      </button>

      <div className="scroll-fader-body">
        <span className="scroll-fader-label">Volume</span>
        <div className="scroll-fader-track">
          <span
            className="scroll-fader-thumb"
            style={{
              top: `calc(${(activeIndex / (SECTIONS.length - 1 || 1)) * 100}% - 16px)`,
            }}
          />
          {SECTIONS.map((section, index) => (
            <button
              key={section.id}
              type="button"
              className={`scroll-fader-stop ${section.id === activeId ? 'is-active' : ''}`}
              aria-label={`Go to ${section.label}`}
              aria-current={section.id === activeId ? 'true' : undefined}
              style={{
                top: `${(index / (SECTIONS.length - 1 || 1)) * 100}%`,
              }}
              onClick={() => goToSection(section.id)}
            >
              <span className="scroll-fader-stop-label">{section.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="scroll-fader-step"
        onClick={() => goBy(1)}
        aria-label="Go to next section"
        disabled={activeIndex === SECTIONS.length - 1}
      >
        -
      </button>
    </aside>
  )
}
