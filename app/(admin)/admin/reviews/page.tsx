import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/admin/PageHeader'
import { approveReview, rejectReview } from '@/app/actions/reviews'

interface Review {
  id:         string
  name:       string
  event_type: string | null
  rating:     number
  message:    string
  approved:   boolean
  created_at: string
}

function Stars({ n }: { n: number }) {
  return <span style={{ color: 'var(--violet)', letterSpacing: '2px' }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}

async function getReviews() {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('reviews')
      .select('id, name, event_type, rating, message, approved, created_at')
      .order('created_at', { ascending: false })
    return (data ?? []) as Review[]
  } catch { return [] }
}

export default async function ReviewsPage() {
  const reviews = await getReviews()
  const pending  = reviews.filter(r => !r.approved)
  const approved = reviews.filter(r =>  r.approved)

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  function ReviewCard({ r, isPending }: { r: Review; isPending: boolean }) {
    return (
      <div style={{
        background: 'var(--surface)',
        border:     `1px solid ${isPending ? 'rgba(155,93,229,0.3)' : 'var(--border)'}`,
        padding:    '20px',
        display:    'grid',
        gap:        '10px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 500, color: 'var(--white)', fontSize: '14px' }}>{r.name}</div>
            {r.event_type && (
              <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', marginTop: '2px' }}>{r.event_type}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <Stars n={r.rating} />
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{fmtDate(r.created_at)}</span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
          &ldquo;{r.message}&rdquo;
        </p>

        {isPending && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <form action={approveReview.bind(null, r.id)}>
              <button type="submit" style={{
                padding:       '8px 18px',
                background:    'var(--violet)',
                color:         'var(--black)',
                border:        'none',
                fontSize:      '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight:    500,
                cursor:        'pointer',
              }}>
                Approve
              </button>
            </form>
            <form action={rejectReview.bind(null, r.id)}>
              <button type="submit" style={{
                padding:       '8px 18px',
                background:    'none',
                color:         '#e85d75',
                border:        '1px solid rgba(232,93,117,0.4)',
                fontSize:      '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor:        'pointer',
              }}>
                Delete
              </button>
            </form>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="admin-page">
      <PageHeader title="Reviews" subtitle={`${pending.length} pending · ${approved.length} published`} />

      {/* Pending */}
      {pending.length > 0 && (
        <div className="admin-section">
          <div className="admin-section-header">
            <span className="admin-section-title">Pending Approval</span>
          </div>
          <div style={{ display: 'grid', gap: '12px', padding: '20px' }}>
            {pending.map(r => <ReviewCard key={r.id} r={r} isPending={true} />)}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div style={{ padding: '24px 20px', color: 'var(--muted)', fontSize: '13px' }}>
          No pending reviews.
        </div>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <div className="admin-section">
          <div className="admin-section-header">
            <span className="admin-section-title">Published</span>
          </div>
          <div style={{ display: 'grid', gap: '12px', padding: '20px' }}>
            {approved.map(r => <ReviewCard key={r.id} r={r} isPending={false} />)}
          </div>
        </div>
      )}
    </div>
  )
}
