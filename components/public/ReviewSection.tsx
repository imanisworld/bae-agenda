/**
 * REVIEW SECTION — Server Component
 * Shows approved reviews from Supabase as social proof.
 * Falls back to hardcoded quotes if DB has no approved reviews yet.
 * Review submission lives on /connect through ReviewDrawer.
 */
import { createClient } from '@/lib/supabase/server'

interface Review {
  id:         string
  name:       string
  event_type: string | null
  rating:     number
  message:    string
}

const FALLBACK_REVIEWS: Review[] = [
  { id: 'f1', name: 'Auboni H.',   event_type: 'Private Event · Indianapolis', rating: 5, message: "Every transition was perfect. The crowd didn't want to leave." },
  { id: 'f2', name: 'Marcus T.',   event_type: 'Club Night · Chicago',         rating: 5, message: "BAE read the room all night. Best DJ we've had at this venue." },
  { id: 'f3', name: 'Danielle R.', event_type: 'Rooftop Event · Indianapolis', rating: 5, message: 'Brought exactly the energy we needed. Would book again without hesitation.' },
]

async function getApprovedReviews(): Promise<Review[]> {
  try {
    const supabase = await createClient()
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
  const featuredReview = reviews[0]

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
      <div className="section-container review-section-shell" style={{ position: 'relative', zIndex: 1, paddingTop: '34px', paddingBottom: '32px' }}>
        <div className="hardware-heading">
          <span className="section-label">Reviews</span>
        </div>
        <div className="review-section-head">
          <div className="review-section-head-copy">
            <h2
              className="review-section-title"
              style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: 'clamp(22px, 3.2vw, 36px)',
                fontWeight: 600,
                color: 'var(--white)',
                lineHeight: 1,
                margin: 0,
              }}
            >
              Audience <span style={{ color: 'var(--violet)' }}>Feedback</span>
            </h2>
            <p className="review-section-subtitle" style={{
              maxWidth: '520px',
              margin: '8px 0 0',
              fontSize: '13px',
              color: 'var(--muted)',
              lineHeight: 1.55,
            }}>
              Real reactions from parties, venues, and live rooms.
            </p>
          </div>

          <div className="review-section-chips">
            <span className="build-console-mini-chips" style={{ display: 'contents' }}>
              <span>{reviews.length} Reviews</span>
              <span>{averageRating.toFixed(1)} Avg</span>
            </span>
          </div>
        </div>

        <div className="build-console review-section-console" style={{ padding: '12px', borderRadius: '26px' }}>
          <article
            key={featuredReview.id}
            className="card-hover review-card review-card-featured"
            style={{
              position: 'relative',
              overflow: 'hidden',
              minHeight: '152px',
              padding: '16px 18px',
              borderRadius: '20px',
              background: 'linear-gradient(180deg, rgba(155,93,229,0.16), rgba(24,24,28,0.98) 58%)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'grid',
              gap: '12px',
            }}
          >
            <div
              className="review-card-quote-mark"
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-8px',
                right: '14px',
                fontFamily: 'Conthrax, sans-serif',
                fontSize: '56px',
                lineHeight: 1,
                color: 'rgba(155,93,229,0.14)',
              }}
            >
              &ldquo;
            </div>

            <div className="review-card-body" style={{ display: 'grid', gap: '10px', position: 'relative', zIndex: 1 }}>
              <div className="review-card-top" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                <Stars n={featuredReview.rating} />
                {!featuredReview.id.startsWith('f') && featuredReview.event_type && (
                  <span className="review-card-badge" style={{
                    fontSize: '9px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.42)',
                  }}>
                    Reviewed
                  </span>
                )}
              </div>

              <p className="review-card-message" style={{
                margin: 0,
                maxWidth: '42ch',
                fontSize: 'clamp(16px, 1.6vw, 21px)',
                lineHeight: 1.42,
                color: 'var(--white)',
                fontStyle: 'italic',
              }}>
                &ldquo;{featuredReview.message}&rdquo;
              </p>
            </div>

            <div className="review-card-meta" style={{ position: 'relative', zIndex: 1 }}>
              <div className="review-card-name" style={{
                fontSize: '14px',
                color: 'var(--white)',
                fontWeight: 500,
                marginBottom: '4px',
              }}>
                {featuredReview.name}
              </div>
              {featuredReview.event_type && (
                <div className="review-card-event" style={{
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}>
                  {featuredReview.event_type}
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
