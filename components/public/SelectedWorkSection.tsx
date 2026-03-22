/**
 * SELECTED WORK SECTION — Server Component
 * "Nights & Events" — DJ console surface, matching meet page's build-console aesthetic.
 * Cards display as module strips inside the console grid.
 */
import Link from 'next/link'
import { SELECTED_WORK } from '@/lib/portfolio-data'

export default function SelectedWorkSection() {
  return (
    <section
      id="work"
      aria-label="Selected Work"
      style={{
        background: 'var(--off-black)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="section-container">
        <div className="hardware-heading"><span className="section-label">Selected Work</span></div>

        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap',
          marginBottom: '32px',
        }}>
          <h2 style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(22px, 4.5vw, 44px)',
            fontWeight: 600,
            color: 'var(--white)',
            lineHeight: 1.1,
            margin: 0,
          }}>
            Nights &amp; <span style={{ color: 'var(--violet)' }}>Events</span>
          </h2>
          <Link href="/portfolio" className="btn-ghost" style={{ whiteSpace: 'nowrap' }}>
            Full Portfolio →
          </Link>
        </div>

        <div className="build-console">
          {/* Topbar: screen readout + chips + dial */}
          <div className="build-console-topbar">
            <div className="build-console-screen">
              <div className="build-console-screen-label">Event Log</div>
              <div className="build-console-screen-value">Selected Work / Live Events</div>
              <div className="build-console-screen-lines">
                {SELECTED_WORK.map(item => (
                  <span key={item.id}>
                    <strong>{item.title}</strong> {item.year} · {item.location}
                  </span>
                ))}
              </div>
            </div>

            <div className="build-console-chip-row" aria-hidden="true">
              <span>Events</span>
              <span>Nights</span>
              <span>Live</span>
            </div>

            <div className="build-console-dial-cluster" aria-hidden="true">
              <span className="build-console-dial" />
              <span className="build-console-dial-label">Output</span>
            </div>
          </div>

          {/* Mixer panel: event modules */}
          <div className="build-console-mixer">
            <div className="build-console-fx-header">
              <span>Event Archive</span>
              <div className="build-console-mini-chips">
                <span>Recurring</span>
                <span>Community</span>
              </div>
            </div>

            <div className="build-console-module-grid">
              {SELECTED_WORK.map(item => (
                <div key={item.id} className="build-console-module">
                  <div className="build-console-module-top">
                    <span className="build-console-module-category">{item.category}</span>
                    <span className="build-console-module-index">{item.year}</span>
                  </div>
                  <div className="build-console-module-name">{item.title}</div>
                  <div className="build-console-module-desc">{item.summary}</div>
                  <div className="build-console-module-meter" aria-hidden="true">
                    <span />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
