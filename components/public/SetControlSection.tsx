'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import InteractiveMediaDisc from '@/components/public/InteractiveMediaDisc'

interface TechItem {
  label: string
  value: string
}

interface Props {
  techItems: TechItem[]
  atmosphereNotes: string[]
}

export default function SetControlSection({ techItems, atmosphereNotes }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [barsVisible, setBarsVisible] = useState(false)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setBarsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="build-console">
      <div className="build-console-topbar">
        <div className="build-console-screen">
          <div className="build-console-screen-label">Live Profile</div>
          <div className="build-console-screen-value">Meet / Booth / Room Read</div>
          <div className="build-console-screen-lines">
            {techItems.map((item) => (
              <span key={item.label}>
                <strong>{item.label}</strong> {item.value}
              </span>
            ))}
          </div>
        </div>

        <div className="build-console-chip-row" aria-hidden="true">
          <span>Club</span>
          <span>Private</span>
          <span>Travel</span>
        </div>
      </div>

      <div className="build-console-grid">
        <div
          className="build-console-copy"
          style={{
            background: 'linear-gradient(180deg, rgba(155,93,229,0.08), rgba(18,18,22,0.96))',
          }}
        >
          <div className="hardware-heading">
            <span className="section-label" style={{ color: 'var(--eyebrow)' }}>
              Set Control
            </span>
          </div>

          <div className="set-control-visual-shell">
            <div className="set-control-particle set-control-particle-a" aria-hidden="true" />
            <div className="set-control-particle set-control-particle-b" aria-hidden="true" />
            <div className="set-control-particle set-control-particle-c" aria-hidden="true" />
            <div className="set-control-ripple set-control-ripple-a" aria-hidden="true" />
            <div className="set-control-ripple set-control-ripple-b" aria-hidden="true" />
            <div className="set-control-ripple set-control-ripple-c" aria-hidden="true" />
            <InteractiveMediaDisc
              className="set-control-disc"
              imageSrc="/photos/images/logo.JPG"
            />
            <a
              href="https://www.youtube.com/@djb.a.e"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              Watch on YouTube →
            </a>
          </div>
        </div>

        <div className="build-console-mixer">
          <div className="build-console-fx-header">
            <span>Set Architecture</span>
            <div className="build-console-mini-chips">
              <span>Selection</span>
              <span>Timing</span>
              <span>Pressure</span>
            </div>
          </div>

          <div className="build-console-module-grid">
            {techItems.map((item, index) => (
              <div key={item.label} className="build-console-module set-control-module">
                <div className="build-console-module-top">
                  <span className="build-console-module-category">{item.label}</span>
                </div>
                <div className="build-console-module-desc" style={{ minHeight: '72px' }}>
                  {item.value}
                </div>
                <div className="build-console-module-meter set-control-meter" aria-hidden="true">
                  <span
                    className={barsVisible ? 'is-visible' : ''}
                    style={{ ['--set-control-meter-target' as string]: `${82 + index * 6}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
              Event Atmosphere
            </div>
            <div className="set-control-atmosphere-grid">
              {atmosphereNotes.map((note, index) => (
                <div
                  key={note}
                  className="build-console-pad set-control-atmosphere-card"
                  style={{
                    minHeight: '92px',
                    background: index % 2 === 0 ? 'rgba(155,93,229,0.08)' : 'rgba(242,184,75,0.07)',
                    borderColor: 'rgba(255,255,255,0.12)',
                    alignItems: 'end',
                    padding: '14px',
                    aspectRatio: 'auto',
                    textAlign: 'left',
                    justifyItems: 'start',
                    lineHeight: 1.35,
                  }}
                >
                  {note}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '18px' }}>
            <Link href="/book" className="btn-ghost" style={{ justifyContent: 'center' }}>
              Start A Booking Request
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
