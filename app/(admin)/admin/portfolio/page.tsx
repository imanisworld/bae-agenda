/**
 * ADMIN — PORTFOLIO
 * Gig history with inline featured/status toggles, search, and stats.
 */
import Link from 'next/link'
import PageHeader      from '@/components/admin/PageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminNotice     from '@/components/admin/AdminNotice'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  togglePortfolioFeaturedAction,
  togglePortfolioStatusAction,
} from '@/app/actions/portfolio'

interface PortfolioRow {
  id:         string
  event_name: string
  venue:      string | null
  city:       string
  year:       number
  tags:       string[]
  featured:   boolean
  status:     string
}

async function getAllEntries(): Promise<PortfolioRow[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('portfolio_entries')
      .select('id, event_name, venue, city, year, tags, featured, status')
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
  searchParams?: Promise<{ error?: string | string[]; q?: string }>
}) {
  const all = await getAllEntries()
  const resolved = searchParams ? await searchParams : undefined
  const errorMessage = getErrorMessage(resolved?.error)
  const query = (resolved?.q ?? '').toLowerCase().trim()

  const entries = query
    ? all.filter(
        (e) =>
          e.event_name.toLowerCase().includes(query) ||
          e.city.toLowerCase().includes(query)
      )
    : all

  const published = all.filter((e) => e.status === 'published').length
  const drafts    = all.filter((e) => e.status === 'draft').length
  const featCount = all.filter((e) => e.featured).length

  return (
    <div className="admin-page" style={{ maxWidth: '1200px' }}>
      <PageHeader
        title="Portfolio"
        subtitle={`${all.length} entries`}
        action={{ label: 'New Entry', href: '/admin/portfolio/new' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '1px',
        background: 'var(--border)',
        border: '1px solid var(--border)',
        marginBottom: '24px',
      }}>
        {[
          { label: 'Total',     value: all.length   },
          { label: 'Published', value: published     },
          { label: 'Drafts',    value: drafts        },
          { label: 'Featured',  value: featCount     },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--off-black)',
            padding: '16px 20px',
            display: 'grid',
            gap: '4px',
          }}>
            <div style={{ fontSize: '8px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {label}
            </div>
            <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '20px', color: 'var(--white)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Search + View on site */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <form method="GET" style={{ flex: 1, minWidth: '160px' }}>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by event or city…"
            style={{
              width: '100%',
              background: 'var(--off-black)',
              border: '1px solid var(--border)',
              color: 'var(--white)',
              padding: '9px 13px',
              fontSize: '13px',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
        </form>
        <Link
          href="/portfolio"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn-ghost"
          style={{ whiteSpace: 'nowrap' }}
        >
          View on site →
        </Link>
      </div>

      <div className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">
            {query ? `Results for "${query}" (${entries.length})` : 'Gig History'}
          </span>
        </div>

        {entries.length === 0 ? (
          <AdminEmptyState
            title={query ? 'No matching entries' : 'No portfolio entries yet'}
            desc={query ? 'Try a different search term.' : 'Add gig history entries — they\'ll appear on the public portfolio page.'}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stack">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Event</th>
                  <th>City</th>
                  <th>Tags</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} style={{ opacity: entry.status === 'draft' ? 0.65 : 1 }}>
                    <td data-label="Year" style={{
                      fontFamily: 'Conthrax, sans-serif',
                      fontSize: '12px',
                      color: 'var(--muted)',
                    }}>
                      {entry.year}
                    </td>
                    <td data-label="Event" style={{ color: 'var(--white)', fontWeight: 400 }}>
                      {entry.event_name}
                    </td>
                    <td data-label="City" className="muted">{entry.city}</td>
                    <td data-label="Tags">
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
                    <td data-label="Featured">
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
                          {entry.featured ? '★ Featured' : 'Set Featured'}
                        </button>
                      </form>
                    </td>
                    <td data-label="Status">
                      <form action={togglePortfolioStatusAction}>
                        <input type="hidden" name="id" value={entry.id} />
                        <input
                          type="hidden"
                          name="next_status"
                          value={entry.status === 'published' ? 'draft' : 'published'}
                        />
                        <button
                          type="submit"
                          className="admin-btn-ghost"
                          style={{
                            padding: '4px 8px',
                            fontSize: '9px',
                            color: entry.status === 'published' ? 'var(--white)' : 'var(--muted)',
                          }}
                        >
                          {entry.status === 'published' ? '● Live' : '○ Draft'}
                        </button>
                      </form>
                    </td>
                    <td data-label="Actions">
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
