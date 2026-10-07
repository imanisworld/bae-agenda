import Link from 'next/link'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import PageHeader from '@/components/admin/PageHeader'
import { createAdminClient } from '@/lib/supabase/admin'

interface DiscoveryRun {
  id: string
  run_key: string
  status: 'running' | 'completed' | 'partial' | 'failed'
  started_at: string
  completed_at: string | null
  sources_due: number
  sources_checked: number
  partial_coverage_count: number
  signals_created: number
  signals_ignored: number
  opportunities_created: number
  warm_rebooks_created: number
  warm_rebooks_updated: number
  sources_added: number
  summary: Record<string, unknown>
  notes: string | null
}

function fmtTimestamp(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Indiana/Indianapolis',
  })
}

function runCoverage(run: DiscoveryRun) {
  if (run.sources_due === 0) return 'No recurring sources due'
  return `${run.sources_checked}/${run.sources_due} due sources checked`
}

function runResult(run: DiscoveryRun) {
  return [
    `${run.signals_created} signals`,
    `${run.opportunities_created} opportunities`,
    `${run.warm_rebooks_created} warm rebooks`,
    `${run.sources_added} sources added`,
  ].join(' · ')
}

async function getDiscoveryRuns() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('manager_discovery_runs')
    .select('id, run_key, status, started_at, completed_at, sources_due, sources_checked, partial_coverage_count, signals_created, signals_ignored, opportunities_created, warm_rebooks_created, warm_rebooks_updated, sources_added, summary, notes')
    .order('started_at', { ascending: false })
    .limit(30)

  if (error?.code === '42P01' || error?.code === 'PGRST205') {
    return { runs: [] as DiscoveryRun[], unavailable: true }
  }
  if (error) throw new Error(error.message)
  return { runs: (data ?? []) as DiscoveryRun[], unavailable: false }
}

export default async function ManagerDiscoveryRunsPage() {
  const { runs, unavailable } = await getDiscoveryRuns()
  const latest = runs[0] ?? null

  return (
    <div className="admin-page">
      <PageHeader
        title="Discovery Runs"
        subtitle="Evidence for what each Manager discovery pass actually checked and changed."
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        <Link href="/admin/manager" className="admin-btn-ghost">Manager</Link>
        <Link href="/admin/manager/sources" className="admin-btn-ghost">Sources / Watchlist</Link>
        <Link href="/admin/manager/relationships" className="admin-btn-ghost">Relationships</Link>
        <Link href="/admin/manager/warm-rebooks" className="admin-btn-ghost">Warm Rebooks</Link>
      </div>

      {unavailable ? (
        <div className="admin-preview-banner" style={{ marginBottom: 20 }}>
          <span className="admin-preview-mark" aria-hidden="true">!</span>
          <div>
            <div className="admin-preview-title">Run ledger not installed</div>
            <p>The UI is ready, but the discovery-run migration has not been applied in this environment.</p>
          </div>
        </div>
      ) : null}

      {latest ? (
        <section className="admin-section" style={{ marginBottom: 20 }}>
          <div className="admin-section-header">
            <span className="admin-section-title">Latest Run</span>
            <span className="muted">{fmtTimestamp(latest.started_at)} · {latest.status}</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 14,
              paddingTop: 16,
            }}
          >
            {[
              ['Sources', latest.sources_checked, `${latest.sources_due} due`],
              ['Signals', latest.signals_created, `${latest.signals_ignored} ignored`],
              ['Opportunities', latest.opportunities_created, 'Created this run'],
              ['Warm Rebooks', latest.warm_rebooks_created, `${latest.warm_rebooks_updated} updated`],
              ['Sources Added', latest.sources_added, 'New recurring sources'],
              ['Partial Checks', latest.partial_coverage_count, 'Coverage explicitly partial'],
            ].map(([label, value, sub]) => (
              <div key={String(label)} className="admin-stat-card">
                <div className="admin-stat-card-topline"><span>{label}</span></div>
                <div className="admin-stat-value">{value}</div>
                <div className="admin-stat-sub">{sub}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="admin-section">
        <div className="admin-section-header">
          <span className="admin-section-title">Run History</span>
          <span className="muted">{runs.length} recorded</span>
        </div>

        {runs.length === 0 ? (
          <AdminEmptyState
            title="No discovery runs recorded yet"
            desc="The next Manager discovery pass will create the first durable run summary."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stack">
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Status</th>
                  <th>Coverage</th>
                  <th>Results</th>
                  <th>Partial</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td data-label="Started">
                      <strong>{fmtTimestamp(run.started_at)}</strong>
                      <div className="muted" style={{ marginTop: 3, fontSize: 10 }}>{run.run_key}</div>
                    </td>
                    <td data-label="Status">{run.status}</td>
                    <td data-label="Coverage">
                      {runCoverage(run)}
                      {run.notes ? (
                        <div className="muted" style={{ marginTop: 3, fontSize: 10, maxWidth: 360 }}>
                          {run.notes}
                        </div>
                      ) : null}
                    </td>
                    <td data-label="Results">{runResult(run)}</td>
                    <td data-label="Partial">{run.partial_coverage_count}</td>
                    <td data-label="Completed" className="muted">{fmtTimestamp(run.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
