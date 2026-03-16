/**
 * BUILT SECTION — Server Component
 * "Under The Hood" — tech stack showcase.
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

        <div className="build-console">
          <div className="build-console-topbar">
            <div className="build-console-screen">
              <div className="build-console-screen-label">Signal Chain</div>
              <div className="build-console-screen-value">Scratch Build / Live Stack</div>
              <div className="build-console-screen-lines">
                {STACK.slice(0, 4).map(({ category, name }) => (
                  <span key={name}>
                    <strong>{category}</strong> {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="build-console-chip-row" aria-hidden="true">
              <span>Next</span>
              <span>TS</span>
              <span>RLS</span>
              <span>CMS</span>
            </div>

            <div className="build-console-dial-cluster" aria-hidden="true">
              <span className="build-console-dial" />
              <span className="build-console-dial-label">Echo Time</span>
            </div>
          </div>

          <div className="build-console-grid">
            <div className="build-console-copy">
              <div className="hardware-heading">
                <span className="section-label" style={{ color: 'var(--eyebrow)' }}>Under The Hood</span>
              </div>
              <h2 className="section-heading" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', marginBottom: '18px' }}>
                Built from<br /><span className="hardware-title-accent">scratch.</span>
              </h2>
              <p className="build-console-body">
                This site was designed and developed by the same person behind the
                music. No templates. No drag-and-drop builders.
              </p>
              {bio && (
                <p className="build-console-quote">
                  {bio}
                </p>
              )}

              <div className="build-console-pad-bank" aria-hidden="true">
                <span className="build-console-pad is-lit">UI</span>
                <span className="build-console-pad">CMS</span>
                <span className="build-console-pad">Auth</span>
                <span className="build-console-pad">DB</span>
              </div>
            </div>

            <div className="build-console-mixer">
              <div className="build-console-fx-header">
                <span>Live Modules</span>
                <div className="build-console-mini-chips">
                  <span>Fast</span>
                  <span>Typed</span>
                  <span>Secure</span>
                </div>
              </div>

              <div className="build-console-module-grid">
                {STACK.map(({ category, name, desc }, index) => (
                  <div key={name} className="build-console-module">
                    <div className="build-console-module-top">
                      <span className="build-console-module-category">{category}</span>
                      <span className="build-console-module-index">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="build-console-module-name">{name}</div>
                    <div className="build-console-module-desc">{desc}</div>
                    <div className="build-console-module-meter" aria-hidden="true">
                      <span />
                    </div>
                  </div>
                ))}
              </div>

              <div className="build-console-knob-row" aria-hidden="true">
                <div className="build-console-knob-unit">
                  <span className="build-console-knob" />
                  <span className="build-console-knob-text">Speed</span>
                </div>
                <div className="build-console-knob-unit">
                  <span className="build-console-knob" />
                  <span className="build-console-knob-text">Scale</span>
                </div>
                <div className="build-console-knob-unit">
                  <span className="build-console-knob" />
                  <span className="build-console-knob-text">Polish</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
