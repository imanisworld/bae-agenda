/**
 * LEAVE REVIEW SECTION — Server Component
 * The review-submission form, split out from ReviewSection so it can sit
 * lower on the homepage (near Connect) instead of asking a first-time
 * visitor to review an event they haven't booked yet. Review quotes
 * (social proof) stay in ReviewSection higher up the page.
 */
import ReviewForm from '@/components/public/ReviewForm'

export default function LeaveReviewSection() {
  return (
    <section
      id="leave-review"
      aria-label="Leave a review"
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-sunken, #08080a)',
      }}
    >
      <div className="section-container" style={{ paddingTop: '48px', paddingBottom: '48px', maxWidth: '640px' }}>
        <div className="hardware-heading">
          <span className="section-label">Worked With BAE?</span>
        </div>
        <h2
          style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(20px, 3vw, 30px)',
            fontWeight: 600,
            color: 'var(--white)',
            lineHeight: 1.1,
            margin: '12px 0 6px',
          }}
        >
          Leave a Review
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
          Share your experience and it will stay private until approved.
        </p>

        <div
          className="review-form-shell"
          style={{
            borderRadius: '20px',
            padding: '16px',
            background: 'linear-gradient(180deg, rgba(24,24,28,0.98), rgba(16,16,20,0.98))',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <ReviewForm compact />
        </div>
      </div>
    </section>
  )
}
