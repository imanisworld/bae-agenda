import { SELECTED_WORK } from '@/lib/portfolio-data'

export default function SelectedWorkStories() {
  return (
    <section aria-labelledby="selected-stories-title" style={{ marginBottom: '56px' }}>
      <div className="hardware-heading">
        <span className="section-label">Selected Stories</span>
      </div>
      <div style={{ maxWidth: '720px', marginBottom: '24px' }}>
        <h2
          id="selected-stories-title"
          style={{
            margin: 0,
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(28px, 4vw, 46px)',
            lineHeight: 1,
          }}
        >
          What the work actually was.
        </h2>
        <p style={{ margin: '14px 0 0', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.75 }}>
          A little more context than a flyer: the role, the room, and what made each project different.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '1px', background: 'var(--border)' }}>
        {SELECTED_WORK.map((item, index) => (
          <article
            key={item.id}
            style={{
              minHeight: '300px',
              padding: '22px',
              background: 'var(--off-black)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
              <span style={{ color: 'var(--gold)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                {item.category}
              </span>
              <span style={{ color: 'rgba(246,241,232,0.3)', fontFamily: 'Conthrax, sans-serif', fontSize: '11px' }}>
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '8px' }}>
                {item.year} · {item.location}
              </div>
              <h3 style={{ margin: 0, fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(21px, 2.5vw, 30px)', lineHeight: 1 }}>
                {item.title}
              </h3>
              <p style={{ margin: '14px 0 18px', color: 'var(--muted)', fontSize: '13px', lineHeight: 1.7 }}>
                {item.summary}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {item.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    style={{
                      padding: '5px 8px',
                      border: '1px solid rgba(196,165,116,0.2)',
                      color: 'var(--gold)',
                      fontSize: '9px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
