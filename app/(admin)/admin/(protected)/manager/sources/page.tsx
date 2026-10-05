import Link from 'next/link'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminNotice from '@/components/admin/AdminNotice'
import PageHeader from '@/components/admin/PageHeader'
import {
  createManagerSourceAction,
  toggleManagerSourceAction,
  setManagerSignalStatusAction,
  convertManagerSignalToOpportunityAction,
} from '@/app/actions/manager-sources'
import {
  MANAGER_WATCH_PLATFORMS,
  MANAGER_WATCH_PLATFORM_LABELS,
  MANAGER_WATCH_SOURCE_KINDS,
  MANAGER_WATCH_SOURCE_KIND_LABELS,
  type ManagerWatchPlatform,
  type ManagerWatchSourceKind,
} from '@/lib/manager'
import { createAdminClient } from '@/lib/supabase/admin'
import { managerSourceHealthLabel, summarizeManagerSourceSignals } from '@/lib/manager-source-quality'

interface SourceRow {
  id: string
  name: string
  source_kind: ManagerWatchSourceKind
  platform: ManagerWatchPlatform
  url: string
  handle: string | null
  location_city: string | null
  location_state: string | null
  active: boolean
  check_frequency_hours: number
  check_reliability: 'full' | 'partial' | 'manual'
  last_checked_at: string | null
  last_seen_marker: string | null
  latest_signal_at: string | null
  recommended_demo: string | null
  notes: string | null
}

interface SignalRow {
  id: string
  source_id: string
  signal_type: string
  status: 'new' | 'relevant' | 'ignored' | 'converted'
  title: string
  url: string | null
  published_at: string | null
  discovered_at: string
  summary: string | null
  linked_opportunity_id: string | null
}

function getMessage(value: string | string[] | undefined) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function fmtTimestamp(value: string | null) {
  if (!value) return 'Never'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Indiana/Indianapolis',
  })
}

function locationLabel(source: SourceRow) {
  return [source.location_city, source.location_state].filter(Boolean).join(', ') || '—'
}

export default async function ManagerSourcesPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[]; success?: string | string[] }>
}) {
  const query = searchParams ? await searchParams : undefined
  const errorMessage = getMessage(query?.error)
  const successMessage = getMessage(query?.success)
  const admin = createAdminClient()

  const [
    { data: sourceData, error: sourcesError },
    { data: signalData, error: signalsError },
    { data: signalStatusData, error: signalStatusError },
  ] = await Promise.all([
    admin
      .from('manager_sources')
      .select('id, name, source_kind, platform, url, handle, location_city, location_state, active, check_frequency_hours, check_reliability, last_checked_at, last_seen_marker, latest_signal_at, recommended_demo, notes')
      .order('active', { ascending: false })
      .order('name'),
    admin
      .from('manager_source_signals')
      .select('id, source_id, signal_type, status, title, url, published_at, discovered_at, summary, linked_opportunity_id')
      .order('discovered_at', { ascending: false })
      .limit(100),
    admin
      .from('manager_source_signals')
      .select('source_id, status'),
  ])

  const unavailable =
    sourcesError?.code === '42P01' ||
    sourcesError?.code === 'PGRST205' ||
    signalsError?.code === '42P01' ||
    signalsError?.code === 'PGRST205' ||
    signalStatusError?.code === '42P01' ||
    signalStatusError?.code === 'PGRST205'

  const sources = (sourceData ?? []) as SourceRow[]
  const signals = (signalData ?? []) as SignalRow[]
  const sourceById = new Map(sources.map((source) => [source.id, source]))
  const statusesBySource = new Map<string, SignalRow['status'][]>()

  for (const row of signalStatusData ?? []) {
    const statuses = statusesBySource.get(row.source_id) ?? []
    statuses.push(row.status as SignalRow['status'])
    statusesBySource.set(row.source_id, statuses)
  }

  const sourceQuality = new Map(
    sources.map((source) => [
      source.id,
      summarizeManagerSourceSignals(statusesBySource.get(source.id) ?? []),
    ])
  )
  const activeSources = sources.filter((source) => source.active)
  const unchecked = activeSources.filter((source) => !source.last_checked_at)
  const actionableSignals = signals.filter((signal) => ['new', 'relevant'].includes(signal.status))
  const localSources = activeSources.filter(
    (source) =>
      source.location_city?.toLowerCase() === 'indianapolis' &&
      source.location_state?.toUpperCase() === 'IN'
  )
  const networkSources = activeSources.filter(
    (source) => ['dj', 'promoter'].includes(source.source_kind)
  )
  const noisySources = activeSources.filter(
    (source) => sourceQuality.get(source.id)?.health === 'noisy'
  )

  return (
    <div className="admin-page">
      <PageHeader
        title="Sources / Watchlist"
        subtitle="Track DJs, venues, promoters, brands, and public signals that can become Manager opportunities."
        action={{ label: 'Back To Manager', href: '/admin/manager' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}
      {successMessage && (
        <div className="admin-preview-banner" style={{ marginBottom: 16 }}>
          <span className="admin-preview-mark" aria-hidden="true">✓</span>
          <div><div className="admin-preview-title">{successMessage}</div></div>
        </div>
      )}

      {unavailable && (
        <div className="admin-preview-banner" style={{ marginBottom: 18 }}>
          <span className="admin-preview-mark" aria-hidden="true">◈</span>
          <div>
            <div className="admin-preview-title">Watchlist database not installed yet</div>
            <p>The UI is ready, but the Manager source tables are not available in this environment.</p>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          ['Active Sources', activeSources.length, 'Currently watched'],
          ['Indianapolis', localSources.length, 'Local discovery coverage'],
          ['DJ Network', networkSources.length, 'Venue / promoter relationship mining'],
          ['Never Checked', unchecked.length, 'Waiting for first scan'],
          ['Noisy Sources', noisySources.length, 'Mostly ignored signals'],
          ['New Signals', actionableSignals.length, 'Need review'],
          ['Converted', signals.filter((signal) => signal.status === 'converted').length, 'Became opportunities'],
        ].map(([label, value, sub]) => (
          <div key={String(label)} className="admin-stat-card">
            <div className="admin-stat-card-topline"><span>{label}</span></div>
            <div className="admin-stat-value">{value}</div>
            <div className="admin-stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div className="admin-preview-banner" style={{ marginBottom: 20 }}>
        <span className="admin-preview-mark" aria-hidden="true">⌕</span>
        <div>
          <div className="admin-preview-title">Expanded discovery</div>
          <p>
            The scheduled discovery pass now combines this recurring watchlist with broad searches for DJ hiring,
            festival submissions, campus entertainment, venue programming, direct event buyers, corporate/community
            activations, and DJ-to-venue relationships. DJ staffing/roster companies are excluded. New recurring sources are capped and must be verified before
            they are added.
          </p>
        </div>
      </div>

      <section className="admin-section" style={{ marginBottom: 20 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Watchlist</span>
          <span className="muted">{sources.length} sources</span>
        </div>

        {sources.length === 0 ? (
          <AdminEmptyState
            title="No watchlist sources yet"
            desc="Add DJs, venues, promoters, event brands, direct buyers, or other public sources. DJ staffing/roster companies are excluded."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stack">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Platform</th>
                  <th>Location</th>
                  <th>Cadence</th>
                  <th>Last Check</th>
                  <th>Latest Signal</th>
                  <th>Yield</th>
                  <th>Demo</th>
                  <th>Watch</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => {
                  const quality = sourceQuality.get(source.id) ?? summarizeManagerSourceSignals([])
                  return (
                  <tr key={source.id}>
                    <td data-label="Source">
                      <div style={{ display: 'grid', gap: 3 }}>
                        <Link href={source.url} target="_blank" rel="noreferrer" className="admin-view-all">
                          {source.name} ↗
                        </Link>
                        <span className="muted" style={{ fontSize: 11 }}>
                          {source.handle ?? source.check_reliability}
                        </span>
                      </div>
                    </td>
                    <td data-label="Type">{MANAGER_WATCH_SOURCE_KIND_LABELS[source.source_kind] ?? source.source_kind}</td>
                    <td data-label="Platform">{MANAGER_WATCH_PLATFORM_LABELS[source.platform] ?? source.platform}</td>
                    <td data-label="Location" className="muted">{locationLabel(source)}</td>
                    <td data-label="Cadence" className="muted">{source.check_frequency_hours}h</td>
                    <td data-label="Last Check" className="muted">{fmtTimestamp(source.last_checked_at)}</td>
                    <td data-label="Latest Signal" className="muted">{fmtTimestamp(source.latest_signal_at)}</td>
                    <td data-label="Yield">
                      <div style={{ display: 'grid', gap: 2 }}>
                        <span>{managerSourceHealthLabel(quality.health)}</span>
                        <span className="muted" style={{ fontSize: 10 }}>
                          {quality.total === 0
                            ? 'No signals'
                            : `${quality.useful}/${quality.total} useful · ${quality.yieldPercent}%`}
                        </span>
                      </div>
                    </td>
                    <td data-label="Demo" className="muted">{source.recommended_demo ?? '—'}</td>
                    <td data-label="Watch">
                      <form action={toggleManagerSourceAction}>
                        <input type="hidden" name="id" value={source.id} />
                        <input type="hidden" name="active" value={source.active ? 'false' : 'true'} />
                        <button type="submit" className="admin-btn-ghost">
                          {source.active ? 'Pause' : 'Resume'}
                        </button>
                      </form>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section" style={{ marginBottom: 20 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Recent Signals</span>
          <span className="muted">{signals.length} stored</span>
        </div>

        {signals.length === 0 ? (
          <AdminEmptyState
            title="No signals yet"
            desc="The watcher will store new public posts, events, booking calls, job listings, and other relevant changes here."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stack">
              <thead>
                <tr>
                  <th>Signal</th>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Published</th>
                  <th>Status</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((signal) => {
                  const source = sourceById.get(signal.source_id)
                  return (
                    <tr key={signal.id}>
                      <td data-label="Signal">
                        <div style={{ display: 'grid', gap: 4 }}>
                          {signal.url ? (
                            <Link href={signal.url} target="_blank" rel="noreferrer" className="admin-view-all">
                              {signal.title} ↗
                            </Link>
                          ) : (
                            <strong style={{ fontWeight: 500 }}>{signal.title}</strong>
                          )}
                          {signal.summary && (
                            <span className="muted" style={{ fontSize: 11, maxWidth: 440 }}>
                              {signal.summary}
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-label="Source">{source?.name ?? 'Unknown'}</td>
                      <td data-label="Type">{signal.signal_type.replaceAll('_', ' ')}</td>
                      <td data-label="Published" className="muted">{fmtTimestamp(signal.published_at ?? signal.discovered_at)}</td>
                      <td data-label="Status">{signal.status}</td>
                      <td data-label="Decision">
                        {signal.linked_opportunity_id ? (
                          <Link href={`/admin/manager/opportunities/${signal.linked_opportunity_id}`} className="admin-view-all">
                            Opportunity →
                          </Link>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <form action={convertManagerSignalToOpportunityAction}>
                              <input type="hidden" name="id" value={signal.id} />
                              <button type="submit" className="admin-btn-primary">Opportunity</button>
                            </form>
                            <form action={setManagerSignalStatusAction}>
                              <input type="hidden" name="id" value={signal.id} />
                              <input type="hidden" name="status" value="ignored" />
                              <button type="submit" className="admin-btn-ghost">Ignore</button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section" style={{ padding: 24 }}>
        <div className="admin-section-header" style={{ margin: '-24px -24px 22px' }}>
          <span className="admin-section-title">Add Source</span>
        </div>

        <form action={createManagerSourceAction}>
          <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="muted">Name</span>
              <input name="name" required className="admin-input" />
            </label>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="muted">URL</span>
              <input name="url" type="url" required placeholder="https://..." className="admin-input" />
            </label>
          </div>

          <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="muted">Source Type</span>
              <select name="source_kind" defaultValue="venue" className="admin-input">
                {MANAGER_WATCH_SOURCE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>{MANAGER_WATCH_SOURCE_KIND_LABELS[kind]}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="muted">Platform</span>
              <select name="platform" defaultValue="instagram" className="admin-input">
                {MANAGER_WATCH_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>{MANAGER_WATCH_PLATFORM_LABELS[platform]}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="muted">Handle</span>
              <input name="handle" placeholder="@account" className="admin-input" />
            </label>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="muted">Recommended Demo</span>
              <input name="recommended_demo" placeholder="Open Format / Nightlife" className="admin-input" />
            </label>
          </div>

          <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="muted">City</span>
              <input name="location_city" className="admin-input" />
            </label>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="muted">State</span>
              <input name="location_state" className="admin-input" />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
            <span className="muted">Why This Demo</span>
            <textarea name="recommended_demo_reason" rows={3} className="admin-input" />
          </label>

          <label style={{ display: 'grid', gap: 7, marginBottom: 16 }}>
            <span className="muted">Notes</span>
            <textarea name="notes" rows={4} className="admin-input" />
          </label>

          <button type="submit" className="admin-btn-primary">Add To Watchlist</button>
        </form>
      </section>
    </div>
  )
}
