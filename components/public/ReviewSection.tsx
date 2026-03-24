/**
 * REVIEW SECTION — Server Component
 * Shows approved reviews from Supabase + a form to submit a new one.
 * Falls back to hardcoded quotes if DB has no approved reviews yet.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import ReviewForm from '@/components/public/ReviewForm'

interface Review {
  id:         string
  name:       string
  event_type: string | null
  rating:     number
  message:    string
}

const FALLBACK_REVIEWS: Review[] = [
  { id: 'f1', name: 'Auboni H.',          event_type: 'Private Event · Indianapolis', rating: 5, message: "Every transition was perfect. The crowd didn't want to leave." },
  { id: 'f2', name: 'Event Coordinator',  event_type: 'Club Night · Chicago',         rating: 5, message: "BAE read the room all night. Best DJ we've had at this venue." },
  { id: 'f3', name: 'Event Promoter',     event_type: 'Rooftop Event · Indianapolis', rating: 5, message: 'Brought exactly the energy we needed. Would book again without hesitation.' },
]

async function getApprovedReviews(): Promise<Review[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('reviews')
      .select('id, name, event_type, rating, message')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(6)
    if (data && data.length > 0) return data as Review[]
  } catch { /* fall through */ }
  return FALLBACK_REVIEWS
}

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} out of 5 stars`} style={{ color: 'var(--violet)', fontSize: '12px', letterSpacing: '2px' }}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  )
}

export default async function ReviewSection() {
  const reviews = await getApprovedReviews()
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

  return (
    <section
      aria-label="Client reviews"
      style={{
        borderTop: '1px solid var(--border)',
        background:
          'radial-gradient(ellipse at 18% 28%, rgba(155,93,229,0.08) 0%, transparent 48%), var(--bg-sunken, #08080a)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            linear-gradient(180deg, transparent 0%, rgba(155,93,229,0.04) 56%, transparent 100%),
            radial-gradient(circle at 50% 100%, rgba(155,93,229,0.1), transparent 34%)
          `,
        }}
      />
      <div className="section-container" style={{ position: 'relative', zIndex: 1, paddingTop: '56px', paddingBottom: '48px' }}>
        <div className="hardware-heading">
          <span className="section-label">Reviews</span>
        </div>
        <h2 className="section-heading" style={{ marginBottom: '28px' }}>Audience Feedback</h2>

        <div className="build-console">
          <div className="build-console-topbar">
            <div className="build-console-screen">
              <div className="build-console-screen-label">Audience Log</div>
              <div className="build-console-screen-value">What People Say After The Set</div>
              <div className="build-console-screen-lines">
                <span><strong>Source</strong> Client and venue feedback submitted through the site</span>
                <span><strong>Status</strong> New notes stay private until approved</span>
                <span><strong>Read</strong> Real reactions from rooms, parties, and live events</span>
              </div>
            </div>

            <div className="build-console-chip-row" aria-hidden="true">
              <span>{reviews.length} Loaded</span>
              <span>{averageRating.toFixed(1)} Avg</span>
              <span>Approved</span>
            </div>
          </div>

          <div className="build-console-grid">
            <div
              className="build-console-copy"
              style={{ background: 'linear-gradient(180deg, rgba(155,93,229,0.1), rgba(18,18,22,0.96))' }}
            >
              <h2 style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: 'clamp(22px, 4vw, 42px)',
                fontWeight: 600,
                color: 'var(--white)',
                lineHeight: 1.05,
                marginBottom: '16px',
              }}>
                Reactions That<br />
                <span style={{ color: 'var(--violet)' }}>Stay With People</span>
              </h2>

              <p className="build-console-body">
                The site moves from dates, to proof, to booking. This section is the trust bridge:
                how the room felt, how the night landed, and why people call back.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '10px',
                marginTop: '24px',
              }}>
                {[
                  { label: 'Average', value: `${averageRating.toFixed(1)} / 5` },
                  { label: 'Showing', value: `${reviews.length} Reviews` },
                  { label: 'Flow', value: 'Live Energy' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(8,8,12,0.35)',
                      padding: '14px 12px',
                      display: 'grid',
                      gap: '4px',
                    }}
                  >
                    <div style={{
                      fontSize: '9px',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                    }}>
                      {stat.label}
                    </div>
                    <div style={{
                      fontFamily: 'Conthrax, sans-serif',
                      fontSize: '13px',
                      color: 'var(--white)',
                      lineHeight: 1.3,
                    }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ marginTop: '18px', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.7 }}>
                Worked with DJ B.A.E.? Drop a note below. Approved reviews publish here and feed the same signal the rest of the page is building.
              </p>
            </div>

            <div className="build-console-mixer">
              <div className="build-console-fx-header">
                <span>Selected Reviews</span>
                <div className="build-console-mini-chips">
                  <span>Public</span>
                  <span>Verified</span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1px',
                background: 'var(--border)',
                border: '1px solid var(--border)',
              }}>
                {reviews.slice(0, 3).map(r => (
                  <div
                    key={r.id}
                    className="card-hover"
                    style={{
                      background: 'var(--surface)',
                      padding: '24px 20px',
                      display: 'grid',
                      gap: '12px',
                    }}
                  >
                    <Stars n={r.rating} />
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--white)',
                      lineHeight: 1.75,
                      margin: 0,
                      fontStyle: 'italic',
                    }}>
                      &ldquo;{r.message}&rdquo;
                    </p>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--white)', fontWeight: 500, marginBottom: '3px' }}>
                        {r.name}
                      </div>
                      {r.event_type && (
                        <div style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                          {r.event_type}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '20px',
                borderTop: '1px solid var(--border)',
                paddingTop: '22px',
              }}>
                <div style={{ marginBottom: '18px' }}>
                  <span className="section-label" style={{ marginBottom: '6px' }}>Leave a Review</span>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                    Share your experience and we’ll keep the same tone and quality before anything goes live.
                  </p>
                </div>
                <ReviewForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
