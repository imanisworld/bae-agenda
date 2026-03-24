'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import InteractiveMediaDisc from '@/components/public/InteractiveMediaDisc'
import PitchBendStrip from '@/components/public/PitchBendStrip'

interface TechItem {
  label: string
  value: string
}

interface Props {
  techItems: TechItem[]
}

export default function SetControlSection({ techItems }: Props) {
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

          <div className="set-control-visual-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
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
            <PitchBendStrip />
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

          <div
            style={{
              marginTop: '20px',
              borderLeft: '2px solid var(--accent, #9b5de5)',
              paddingLeft: '20px',
            }}
          >
            <p
              style={{
                fontSize: '15px',
                color: 'var(--white)',
                lineHeight: 1.8,
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              &ldquo;The set doesn&apos;t start when I press play. It starts when I walk in and read the room.&rdquo;
            </p>
            <div
              style={{
                marginTop: '10px',
                fontSize: '10px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              DJ B.A.E.
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
