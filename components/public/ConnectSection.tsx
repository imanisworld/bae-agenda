/**
 * CONNECT SECTION — Server Component
 * Compact social bar shown at the bottom of every page.
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
        background: 'var(--off-black)',
        borderTop: '1px solid var(--border)',
        padding: '28px clamp(24px, 5vw, 72px)',
      }}
    >
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: '9px',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          flexShrink: 0,
        }}>
          Connect
        </span>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          {socials.map(({ label, url, icon }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`DJ B.A.E. on ${label}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: 'var(--muted)',
                textDecoration: 'none',
                padding: '6px 12px',
                border: '1px solid var(--border)',
                borderRadius: '100px',
                transition: 'color 200ms ease, border-color 200ms ease',
                whiteSpace: 'nowrap',
              }}
              className="connect-pill"
            >
              <span style={{ fontSize: '13px' }}>{icon}</span>
              {label}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
