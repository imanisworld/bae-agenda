/**
 * CONNECT SECTION — Server Component
 * "Stay Connected" — social links grid.
 * Hover via CSS class; no JS event handlers.
 *
 * Accepts optional CMS overrides for instagram_url, soundcloud_url, youtube_url.
 * All other social links remain from the SOCIALS constant.
 */
import { SOCIALS } from '@/lib/constants'

interface SocialOverrides {
  instagram_url?:  string
  soundcloud_url?: string
  youtube_url?:    string
}

interface Props {
  socialOverrides?: SocialOverrides
}

/** Map from SOCIALS label → CMS key */
const CMS_OVERRIDE_MAP: Record<string, keyof SocialOverrides> = {
  Instagram:  'instagram_url',
  SoundCloud: 'soundcloud_url',
  YouTube:    'youtube_url',
}

export default function ConnectSection({ socialOverrides = {} }: Props) {
  // Merge CMS overrides into SOCIALS — only override if the CMS value is non-empty
  const socials = SOCIALS.map(s => {
    const cmsKey = CMS_OVERRIDE_MAP[s.label]
    const override = cmsKey ? socialOverrides[cmsKey] : undefined
    return { ...s, url: override || s.url }
  })

  return (
    <section
      id="connect"
      aria-label="Stay Connected"
      style={{
        background: 'var(--off-black)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="section-container" style={{ textAlign: 'center' }}>

        <span className="section-label" style={{ justifyContent: 'center' }}>Socials</span>
        <h2 className="section-heading">Stay Connected</h2>

        <p style={{
          fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7,
          maxWidth: '480px', margin: '0 auto 56px',
        }}>
          Follow for mixes, event announcements, and behind the scenes.
        </p>

        {/* Social grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))',
          justifyContent: 'center',
          gap: '18px',
          maxWidth: '760px',
          margin: '0 auto',
        }}>
          {socials.map(({ label, url, icon }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`DJ B.A.E. on ${label}`}
              className="social-card"
              style={{ minWidth: 0 }}
            >
              <span className="social-orb" aria-hidden="true">{icon}</span>
              <span style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: '9px', fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--white)',
              }}>
                {label}
              </span>
            </a>
          ))}
        </div>

      </div>
    </section>
  )
}
