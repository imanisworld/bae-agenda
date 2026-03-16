/**
 * BUILT SECTION — Server Component
 * "Under The Hood" — hardware console aesthetic tech showcase.
 * No JS event handlers; hover via CSS class.
 *
 * Accepts optional aboutQuote from site_content CMS.
 * Falls back to CONTENT_DEFAULTS.about_quote if not set.
 */
import { CONTENT_DEFAULTS } from '@/lib/content-schema'

interface Props {
  aboutQuote?: string
}

const STACK = [
  {
    category: 'Framework',
    name:     'Next.js 16',
    desc:     'App Router, Server Components, and Server Actions. Zero client-side waterfall.',
  },
  {
    category: 'Language',
    name:     'TypeScript',
    desc:     'End-to-end type safety from the database schema to the UI layer.',
  },
  {
    category: 'Database',
    name:     'Supabase',
    desc:     'PostgreSQL with Row Level Security. Auth, storage, and real-time built in.',
  },
  {
    category: 'Styling',
    name:     'Tailwind v4',
    desc:     'CSS-first config via @theme. Custom design tokens. Zero runtime overhead.',
  },
  {
    category: 'Deployment',
    name:     'Vercel',
    desc:     'Edge-optimized. Automatic previews, CI/CD pipeline, and custom domain.',
  },
  {
    category: 'Tooling',
    name:     'VS Code + Claude',
    desc:     'Developed locally with AI pair programming. Clean, production-ready architecture.',
  },
] as const

const PADS = [
  { label: 'FAST',   lit: true  },
  { label: 'TYPED',  lit: true  },
  { label: 'SECURE', lit: true  },
  { label: 'NDA',    lit: false },
]

export default function BuiltSection({ aboutQuote }: Props) {
  const bio = aboutQuote ?? CONTENT_DEFAULTS.about_quote

  return (
    <section
      id="built-by"
      aria-label="Under The Hood"
      style={{
        background: 'var(--black)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="section-container">

        <div className="hardware-heading">
          <span className="section-label" style={{ color: 'var(--violet)' }}>Under The Hood</span>
        </div>

        <div className="build-console">

          {/* ── Top bar: screen + chips + dial ────────────────── */}
          <div className="build-console-topbar">

            <div className="build-console-screen">
              <div className="build-console-screen-label">Signal Chain</div>
              <div className="build-console-screen-value">Scratch Build / Live Stack</div>
              <div className="build-console-screen-lines">
                <div><strong>Framework</strong> Next.js 16</div>
                <div><strong>Language</strong> TypeScript</div>
                <div><strong>Database</strong> Supabase</div>
                <div><strong>Styling</strong> Tailwind v4</div>
              </div>
            </div>

            <div className="build-console-chip-row">
              <span>NEXT</span>
              <span>TS</span>
              <span>RLS</span>
              <span>CMS</span>
            </div>

            <div className="build-console-dial-cluster">
              <div className="build-console-dial" />
              <div className="build-console-dial-label">VOLUME</div>
              <div className="build-console-dial-label">ECHO TIME</div>
            </div>

          </div>

          {/* ── Body: copy + module grid ───────────────────────── */}
          <div className="build-console-grid">

            {/* Left — copy panel */}
            <div className="build-console-copy">
              <h2 style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 600,
                letterSpacing: '0.01em', color: 'var(--white)',
                lineHeight: 1.1, marginBottom: '16px',
              }}>
                Built from<br />
                <span style={{ color: 'var(--gold)' }}>scratch.</span>
              </h2>

              <p className="build-console-body">
                This site was designed and developed by the same person behind the
                music. No templates. No drag-and-drop builders.
              </p>

              {bio && (
                <p className="build-console-quote">{bio}</p>
              )}

              {/* Pad bank */}
              <div className="build-console-pad-bank">
                {PADS.map(({ label, lit }) => (
                  <div key={label} className={`build-console-pad${lit ? ' is-lit' : ''}`}>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — live modules */}
            <div className="build-console-mixer">
              <div className="build-console-fx-header">
                <span>Live Modules</span>
                <div className="build-console-mini-chips">
                  <span>FAST</span>
                  <span>TYPED</span>
                  <span>SECURE</span>
                </div>
              </div>

              <div className="build-console-module-grid">
                {STACK.map(({ category, name, desc }, i) => (
                  <div key={name} className="build-console-module">
                    <div className="build-console-module-top">
                      <span className="build-console-module-category">{category}</span>
                      <span className="build-console-module-index">0{i + 1}</span>
                    </div>
                    <div className="build-console-module-name">{name}</div>
                    <div className="build-console-module-desc">{desc}</div>
                    <div className="build-console-module-meter"><span /></div>
                  </div>
                ))}
              </div>

              {/* EQ knob row */}
              <div className="build-console-knob-row">
                {(['LOW', 'MID', 'HI'] as const).map((band) => (
                  <div key={band} className="build-console-knob-unit">
                    <div className="build-console-knob" />
                    <span className="build-console-dial-label">{band}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
