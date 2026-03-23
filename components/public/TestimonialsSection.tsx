/**
 * TESTIMONIALS SECTION
 * Short trust strip — client quotes.
 * Hardcoded for now; swap copy when real quotes come in.
 */

const QUOTES = [
  {
    quote: "Every transition was perfect. The crowd didn\u2019t want to leave.",
    name: 'Auboni H.',
    context: 'Private Event \u00b7 Indianapolis',
  },
  {
    quote: "BAE read the room all night. Best DJ we\u2019ve had at this venue.",
    name: 'Event Coordinator',
    context: 'Club Night \u00b7 Chicago',
  },
  {
    quote: 'Brought exactly the energy we needed. Would book again without hesitation.',
    name: 'Event Promoter',
    context: 'Rooftop Event \u00b7 Indianapolis',
  },
]

export default function TestimonialsSection() {
  return (
    <section
      aria-label="Client testimonials"
      style={{
        background: 'var(--bg-sunken)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="section-container" style={{ paddingTop: '56px', paddingBottom: '56px' }}>
        <div style={{ marginBottom: '36px' }}>
          <span className="section-label">What People Say</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
        }}>
          {QUOTES.map(({ quote, name, context }) => (
            <div key={name} style={{
              background: 'var(--off-black)',
              padding: '28px 24px',
              display: 'grid',
              gap: '16px',
            }}>
              <p style={{
                fontSize: '14px',
                color: 'var(--white)',
                lineHeight: 1.75,
                margin: 0,
                fontStyle: 'italic',
              }}>
                &ldquo;{quote}&rdquo;
              </p>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--white)', fontWeight: 500, marginBottom: '2px' }}>
                  {name}
                </div>
                <div style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  {context}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
