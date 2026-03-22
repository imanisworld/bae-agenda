/**
 * ADMIN — PORTFOLIO
 * Gig history table with inline featured toggle and edit/delete links.
 */
import Link from 'next/link'
import PageHeader      from '@/components/admin/PageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminNotice     from '@/components/admin/AdminNotice'
import { createClient } from '@/lib/supabase/server'
import { togglePortfolioFeaturedAction } from '@/app/actions/portfolio'

interface PortfolioRow {
  id:         string
  event_name: string
  venue:      string | null
  city:       string
  year:       number
  tags:       string[]
  featured:   boolean
}

async function getEntries(): Promise<PortfolioRow[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('portfolio_entries')
      .select('id, event_name, venue, city, year, tags, featured')
      .order('year', { ascending: false })
      .order('event_name', { ascending: true })
    return (data ?? []) as PortfolioRow[]
  } catch {
    return []
  }
}

function getErrorMessage(errorParam: string | string[] | undefined) {
  if (!errorParam) return null
  return Array.isArray(errorParam) ? errorParam[0] ?? null : errorParam
}

export default async function PortfolioAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[] }>
}) {
  const entries = await getEntries()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const errorMessage = getErrorMessage(resolvedSearchParams?.error)

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1200px' }}>
      <PageHeader
        title="Portfolio"
        subtitle={entries.length ? `${entries.length} entries` : undefined}
        action={{ label: 'New Entry', href: '/admin/portfolio/new' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}

      <div className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Gig History</span>
        </div>

        {entries.length === 0 ? (
          <AdminEmptyState
            title="No portfolio entries yet"
            desc="Add gig history entries — they'll appear on the public portfolio page."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Event</th>
                  <th>Venue</th>
                  <th>City</th>
                  <th>Tags</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{
                      fontFamily: 'Conthrax, sans-serif',
                      fontSize: '12px',
                      color: 'var(--muted)',
                    }}>
                      {entry.year}
                    </td>
                    <td style={{ color: 'var(--white)', fontWeight: 400 }}>
                      {entry.event_name}
                    </td>
                    <td className="muted">{entry.venue ?? '—'}</td>
                    <td className="muted">{entry.city}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(entry.tags ?? []).slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '8px',
                              letterSpacing: '0.14em',
                              textTransform: 'uppercase',
                              color: 'var(--muted)',
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid var(--border)',
                              borderRadius: '100px',
                              padding: '2px 6px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {entry.tags.length > 2 && (
                          <span style={{ fontSize: '9px', color: 'var(--muted)' }}>
                            +{entry.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <form action={togglePortfolioFeaturedAction}>
                        <input type="hidden" name="id" value={entry.id} />
                        <input type="hidden" name="next_featured" value={String(!entry.featured)} />
                        <button
                          type="submit"
                          className="admin-btn-ghost"
                          style={{
                            padding: '4px 8px',
                            fontSize: '9px',
                            color: entry.featured ? 'var(--violet)' : 'var(--muted)',
                          }}
                        >
                          {entry.featured ? '★ Featured' : 'Not Featured'}
                        </button>
                      </form>
                    </td>
                    <td>
                      <Link href={`/admin/portfolio/${entry.id}`} className="admin-view-all">
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
