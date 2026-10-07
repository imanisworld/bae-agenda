type MixContext = {
  id: string
  title: string
  genre: string | null
  description: string | null
  duration: number | null
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return null
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

export default function LabContextRail({ mixes }: { mixes: MixContext[] }) {
  const contextual = mixes.filter((mix) => mix.genre || mix.description).slice(0, 4)
  if (contextual.length === 0) return null

  return (
    <section
      aria-labelledby="lab-context-title"
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '36px var(--page-gutter) 10px',
      }}
    >
      <div style={{ maxWidth: '720px', marginBottom: '18px' }}>
        <span style={{ display: 'block', color: 'var(--gold)', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Listening notes
        </span>
        <h2 id="lab-context-title" style={{ margin: 0, fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(22px, 3vw, 34px)' }}>
          A little context before you press play.
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
        }}
      >
        {contextual.map((mix) => {
          const duration = formatDuration(mix.duration)
          return (
            <article key={mix.id} style={{ padding: '16px', background: 'var(--off-black)', minHeight: '150px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--gold)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {mix.genre || 'Mix'}
                </span>
                {duration ? <span style={{ color: 'var(--muted)', fontSize: '10px' }}>{duration}</span> : null}
              </div>
              <h3 style={{ margin: 0, fontSize: '14px', lineHeight: 1.35, color: 'var(--white)' }}>{mix.title}</h3>
              {mix.description ? (
                <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: '12px', lineHeight: 1.65 }}>
                  {mix.description}
                </p>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
