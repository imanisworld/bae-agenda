/**
 * CONNECT SECTION — Server Component
 * "Stay Connected" — social links as a patch-bay / signal-routing panel.
 * Each social is a labeled jack output.
 *
 * Accepts optional CMS overrides for instagram_url, soundcloud_url, youtube_url.
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
  const socials = SOCIALS.map(s => {
    const cmsKey  = CMS_OVERRIDE_MAP[s.label]
    const override = cmsKey ? socialOverrides[cmsKey] : undefined
    return { ...s, url: override || s.url }
  })

  return (
    <section
      id="connect"
      aria-label="Stay Connected"
      style={{
        background: 'radial-gradient(ellipse at 50% 100%, rgba(155,93,229,0.09) 0%, transparent 60%), var(--off-black)',
        borderTop: '1px solid var(--border)',
        scrollMarginTop: '96px',
      }}
    >
      <div className="section-container" style={{ textAlign: 'center', paddingBottom: '56px' }}>

        <div className="hardware-heading" style={{ justifyContent: 'center' }}>
          <span className="section-label">Socials</span>
        </div>
        <h2 className="section-heading">Stay Connected</h2>

        <p style={{
          fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7,
          maxWidth: '480px', margin: '0 auto 48px',
        }}>
          Follow for mixes, event announcements, and behind the scenes.
        </p>

        {/* Patch-bay panel */}
        <div className="patch-bay" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Top rail */}
          <div className="patch-bay-rail" aria-hidden="true" />

          <div className="patch-bay-jacks">
            {socials.map(({ label, url, icon }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`DJ B.A.E. on ${label}`}
                className="patch-jack"
                data-platform={label}
              >
                {/* Jack port */}
                <span className="patch-jack-port" aria-hidden="true">
                  <span className="patch-jack-rim" />
                  <span className="patch-jack-tip" />
                </span>
                {/* Cable stub */}
                <span className="patch-jack-stub" aria-hidden="true" />
                {/* Icon label */}
                <span className="patch-jack-icon">{icon}</span>
                {/* Platform name */}
                <span className="patch-jack-name">{label}</span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
