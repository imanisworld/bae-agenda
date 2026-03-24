import Link from 'next/link'
import InteractiveMediaDisc from '@/components/public/InteractiveMediaDisc'
import MixesTeaserForm from '@/components/public/MixesTeaserForm'

const SOUNDCLOUD_PROFILE_URL = 'https://soundcloud.com/deejaybae'
const YOUTUBE_PROFILE_URL = 'https://www.youtube.com/@djb.a.e'

interface Props {
  sectionId?: string
  variant?: 'teaser' | 'page'
}

export default function MixesSection({ sectionId = 'lab', variant = 'teaser' }: Props) {
  const isPage = variant === 'page'

  return (
    <section
      id={sectionId}
      aria-label="Bae's in the Lab"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(155,93,229,0.07) 0%, transparent 60%), var(--off-black)',
        position:   'relative',
        borderTop:  '1px solid var(--border)',
      }}
    >
      <div
        className="section-container"
        style={{
          position: 'relative',
          zIndex: 2,
          paddingTop: isPage ? '72px' : '40px',
          paddingBottom: isPage ? '72px' : '32px',
        }}
      >
        {isPage ? (
          <>
            <div style={{
              display: 'flex', alignItems: 'flex-end',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span style={{ width: '22px', height: '1px', background: 'var(--violet)', display: 'block', flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Lab
                  </span>
                </div>
                <h2 className="section-heading" style={{ marginBottom: 0 }}>
                  Bae&apos;s in the Lab
                </h2>
                <p style={{
                  marginTop: '16px',
                  maxWidth: '640px',
                  fontSize: '15px',
                  lineHeight: 1.75,
                  color: 'var(--muted)',
                }}>
                  The lab is where mixes, live recordings, and fresh drops start collecting. Tap in here for what is playing now and what lands next.
                </p>
              </div>
            </div>

            <div aria-hidden="true" style={{ height: '1px', background: 'var(--border)', margin: '32px 0 36px' }} />
          </>
        ) : null}

        {isPage && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '32px',
          }}>
            {[
              { label: 'Status', value: 'In Rotation' },
              { label: 'Current Mode', value: 'Archive + Drops' },
              { label: 'Tap In', value: 'SoundCloud + YouTube' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(12,12,16,0.54)',
                  padding: '14px 16px',
                  display: 'grid',
                  gap: '6px',
                }}
              >
                <div style={{
                  fontSize: '8px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: 'var(--white)',
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '2px' }}>
          <div
            className={`mixes-teaser-shell${isPage ? ' is-page' : ' is-teaser'}`}
            style={{ gridColumn: '1 / -1' }}
          >
            <div aria-hidden="true" className="mixes-teaser-noise" />
            <div aria-hidden="true" className="mixes-teaser-orbit mixes-teaser-orbit-a" />
            <div aria-hidden="true" className="mixes-teaser-orbit mixes-teaser-orbit-b" />

            <InteractiveMediaDisc
              className="mixes-teaser-disc-button"
              imageSrc="/photos/images/logo.JPG"
            />

            <div className="mixes-teaser-copy">
              <div className="mixes-teaser-kicker">Lab Archive</div>
              <h3 className="mixes-teaser-title">Bae&apos;s in the Lab</h3>
              <p className="mixes-teaser-subtext">
                {isPage
                  ? 'Recent sets and old drops are all here. Follow me now and the archive will keep growing from this point forward.'
                  : 'Recent sets and new drops land here first.'}
              </p>

              <MixesTeaserForm />

              <div className="mixes-teaser-follow">
                <div className="mixes-teaser-follow-label">{isPage ? 'Tap In Here' : 'Tap In Now'}</div>
                <div className="mixes-teaser-follow-grid">
                  <a
                    href={SOUNDCLOUD_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mixes-teaser-platform"
                  >
                    <span className="mixes-teaser-platform-tag">SC</span>
                    <span>SoundCloud</span>
                  </a>
                  <a
                    href={YOUTUBE_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mixes-teaser-platform"
                  >
                    <span className="mixes-teaser-platform-tag">YT</span>
                    <span>YouTube</span>
                  </a>
                </div>
              </div>

              {isPage && (
                <div style={{
                  width: 'min(100%, 560px)',
                  marginTop: '6px',
                  paddingTop: '18px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '12px',
                  lineHeight: 1.7,
                  color: 'var(--muted)',
                }}>
                  SoundCloud and YouTube are the fastest way to catch new uploads, live edits, and whatever gets added to the rotation next.
                </div>
              )}

              {!isPage && (
                <div style={{
                  width: 'min(100%, 520px)',
                  marginTop: '0',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                  fontSize: '10px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(250,248,243,0.44)',
                }}>
                  <span>Up Next</span>
                  <span style={{ width: '18px', height: '1px', background: 'rgba(155,93,229,0.4)', display: 'block' }} />
                  <span>Upcoming Dates</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
