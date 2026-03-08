/**
 * BUILT SECTION — Server Component
 * "Under The Hood" — tech stack showcase.
 * No JS event handlers; hover via CSS class.
 *
 * Accepts optional aboutQuote from site_content CMS.
 * Falls back to CONTENT_DEFAULTS.about_quote if not set.
 */
import { CONTENT_DEFAULTS } from '@/lib/content-schema'
import Link from 'next/link'

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

        {/* Two-column header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
          gap: '80px',
          alignItems: 'start',
        }}>

          {/* Left — title + bio */}
          <div>
            <span className="section-label">Under The Hood</span>
            <h2 className="section-heading" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}>
              Built from<br />scratch.
            </h2>
            <p style={{
              fontSize: '13px', color: 'var(--muted)',
              lineHeight: 1.75, marginTop: '16px',
            }}>
              This site was designed and developed by the same person behind the
              music. No templates. No drag-and-drop builders.
            </p>
            {bio && (
              <p style={{
                fontSize: '13px', color: 'var(--muted)',
                lineHeight: 1.75, marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border)',
                fontStyle: 'italic',
              }}>
                {bio}
              </p>
            )}
          </div>

          {/* Right — tech grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2px',
          }}>
            {STACK.map(({ category, name, desc }) => (
              <div key={name} className="tech-card">
                <div style={{
                  fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'var(--violet)', marginBottom: '12px',
                }}>
                  {category}
                </div>
                <div style={{
                  fontFamily: 'Conthrax, sans-serif',
                  fontSize: '11px', fontWeight: 600,
                  color: 'var(--white)', marginBottom: '8px',
                  lineHeight: 1.3,
                }}>
                  {name}
                </div>
                <div style={{
                  fontSize: '11px', color: 'var(--muted)', lineHeight: 1.65,
                }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>

        </div>

        <div style={{ marginTop: '34px' }}>
          <Link href="/admin-demo" className="btn-ghost">
            View Admin Demo <span aria-hidden="true">→</span>
          </Link>
        </div>

      </div>

      {/*
        ── FULL-WIDTH PHOTO AREA ─────────────────────────────────────
        A large performance or venue photo spanning the full section width.
        This space is intentionally generous — it can grow into a gallery,
        a slideshow, or a press kit grid.

        TO ADD A PHOTO: replace the photo-placeholder div with:
          <img src="/photos/built-hero.jpg" alt="DJ B.A.E. performing at [venue]" />
        Recommended: wide panoramic, 2400 × 1200 or similar. Dark scenes work best.
        ─────────────────────────────────────────────────────────────
      */}
      <div className="built-photo-area photo-slot" aria-hidden="true">
        <div className="photo-placeholder">
          <span className="photo-placeholder-label">Performance Photo</span>
          <span className="photo-placeholder-label" style={{ opacity: 0.55 }}>wide panoramic · 2400 × 1200 recommended</span>
        </div>
      </div>

    </section>
  )
}
