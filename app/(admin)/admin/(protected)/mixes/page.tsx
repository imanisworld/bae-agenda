import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminNotice from '@/components/admin/AdminNotice'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { toggleMixFeaturedAction, toggleMixPublishedAction } from '@/app/actions/mixes'

interface MixRow {
  id: string
  title: string
  genre: string | null
  duration: number | null
  is_featured: boolean
  sort_order: number
  published_at: string | null
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—'
  return `${Math.round(seconds / 60)} min`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Indiana/Indianapolis',
  })
}

async function getMixes(): Promise<MixRow[]> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('mixes')
      .select('id, title, genre, duration, is_featured, sort_order, published_at')
      .order('published_at', { ascending: false })
      .order('sort_order', { ascending: true })
    return (data ?? []) as MixRow[]
  } catch {
    return []
  }
}

function getErrorMessage(errorParam: string | string[] | undefined) {
  if (!errorParam) return null
  return Array.isArray(errorParam) ? errorParam[0] ?? null : errorParam
}

export default async function MixesAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[] }>
}) {
  const mixes = await getMixes()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const errorMessage = getErrorMessage(resolvedSearchParams?.error)

  return (
    <div className="admin-page">
      <PageHeader
        title="Mixes"
        subtitle={mixes.length ? `${mixes.length} total` : undefined}
        action={{ label: 'New Mix', href: '/admin/mixes/new' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}

      <div className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">All Mixes</span>
        </div>

        {mixes.length === 0 ? (
          <AdminEmptyState
            title="No mixes yet"
            desc="Published mixes here provide Lab metadata and a fallback when SoundCloud is unavailable."
            action={{ label: 'Create First Mix', href: '/admin/mixes/new' }}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stack">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Genre</th>
                  <th>Duration</th>
                  <th>Sort</th>
                  <th>Published</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mixes.map((mix) => (
                  <tr key={mix.id}>
                    <td data-label="Title" style={{ fontWeight: 400 }}>{mix.title}</td>
                    <td data-label="Genre" className="muted">{mix.genre ?? '—'}</td>
                    <td data-label="Duration" className="muted">{formatDuration(mix.duration)}</td>
                    <td data-label="Sort" className="muted">{mix.sort_order}</td>
                    <td data-label="Published">
                      <form action={toggleMixPublishedAction}>
                        <input type="hidden" name="id" value={mix.id} />
                        <input type="hidden" name="next_published" value={String(!mix.published_at)} />
                        <button
                          type="submit"
                          className="admin-btn-ghost"
                          style={{
                            padding: '4px 8px',
                            fontSize: '9px',
                            color: mix.published_at ? '#34d399' : 'var(--muted)',
                          }}
                        >
                          {mix.published_at ? `Published (${formatDate(mix.published_at)})` : 'Draft'}
                        </button>
                      </form>
                    </td>
                    <td data-label="Featured">
                      <form action={toggleMixFeaturedAction}>
                        <input type="hidden" name="id" value={mix.id} />
                        <input type="hidden" name="next_featured" value={String(!mix.is_featured)} />
                        <button
                          type="submit"
                          className="admin-btn-ghost"
                          style={{
                            padding: '4px 8px',
                            fontSize: '9px',
                            color: mix.is_featured ? 'var(--gold)' : 'var(--muted)',
                          }}
                        >
                          {mix.is_featured ? '★ Featured' : 'Not Featured'}
                        </button>
                      </form>
                    </td>
                    <td data-label="Actions">
                      <Link href={`/admin/mixes/${mix.id}`} className="admin-view-all">
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
