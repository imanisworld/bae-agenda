import React from 'react'

/**
 * BUILT SECTION — Server Component
 * "Under The Hood" — hardware console aesthetic tech showcase.
 *
 * Accepts optional aboutQuote from site_content CMS.
 * Falls back to CONTENT_DEFAULTS.about_quote if not set.
 */
import { CONTENT_DEFAULTS } from '@/lib/content-schema'
import EQKnobs from '@/components/public/EQKnobs'
import LeverFX from '@/components/public/LeverFX'

interface Props {
  aboutQuote?: string
}

const STACK = [
  {
    category: 'Framework',
    name:     'Next.js 16',
    desc:     'App Router, server-rendered pages, and Server Actions.',
  },
  {
    category: 'Language',
    name:     'TypeScript',
    desc:     'Keeps data shapes and UI code consistent as the project grows.',
  },
  {
    category: 'Database',
    name:     'Supabase',
    desc:     'PostgreSQL with Row Level Security, authentication, and storage.',
  },
  {
    category: 'Styling',
    name:     'Tailwind v4',
    desc:     'CSS-first styling with shared design tokens.',
  },
  {
    category: 'Deployment',
    name:     'Vercel',
    desc:     'Preview deployments, production hosting, and custom domains.',
  },
  {
    category: 'Tooling',
    name:     'VS Code + Claude',
    desc:     'Built locally with AI-assisted development and reviewed before deployment.',
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
      className="built-section-surface"
      aria-label="Under The Hood"
      style={{
        background: 'radial-gradient(ellipse at 80% 50%, rgba(143,45,60,0.06) 0%, transparent 55%), var(--black)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="section-container">

        <div className="hardware-heading">
          <span className="section-label" style={{ color: 'var(--violet)' }}>Under The Hood</span>
        </div>

        <div className="build-console built-console-hardware-bg">
          <div className="built-console-hardware-image" aria-hidden="true" />
          <div className="built-console-hardware-vignette" aria-hidden="true" />

          {/* ── Top bar: screen + chips + dial ────────────────── */}
          <div className="build-console-topbar">

            <div className="build-console-screen">
              <div className="build-console-screen-label">Signal Chain</div>
              <div className="build-console-screen-value">Scratch Build — Live Stack</div>
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
                I designed and built this site myself. No template, no drag-and-drop builder.
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

              <EQKnobs />
              <LeverFX />
            </div>

          </div>

        </div>

        {/* ── Signal Chain Visual ─────────────────────────────── */}
        <div className="signal-chain-visual">
          {(['CLIENT', 'NEXT.JS', 'SUPABASE', 'VERCEL', 'LIVE'] as const).map((node, i, arr) => (
            <React.Fragment key={node}>
              <div className="signal-node">
                <div className="signal-node-dot" />
                <span className="signal-node-label">{node}</span>
              </div>
              {i < arr.length - 1 && <div className="signal-line" />}
            </React.Fragment>
          ))}
        </div>


      </div>
    </section>
  )
}
