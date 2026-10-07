import Link from 'next/link'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import PageHeader from '@/components/admin/PageHeader'
import {
  buildManagerRelationshipRows,
  managerRelationshipStrengthLabel,
  type ManagerRelationshipSignal,
  type ManagerRelationshipSource,
} from '@/lib/manager-relationship-intelligence'
import { createAdminClient } from '@/lib/supabase/admin'

function fmtDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function locationLabel(source: ManagerRelationshipSource) {
  const parts = [source.location_city, source.location_state].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Location unknown'
}

async function getRelationshipData() {
  const admin = createAdminClient()
  const [
    { data: sources, error: sourcesError },
    { data: signals, error: signalsError },
  ] = await Promise.all([
    admin
      .from('manager_sources')
      .select('id, name, source_kind, url, location_city, location_state, notes')
      .eq('active', true)
      .order('name'),
    admin
      .from('manager_source_signals')
      .select('id, source_id, signal_type, status, title, url, published_at, discovered_at, summary, linked_opportunity_id, source_payload')
      .order('discovered_at', { ascending: false })
      .limit(1000),
  ])

  const error = sourcesError ?? signalsError
  if (error) throw new Error(error.message)

  return buildManagerRelationshipRows(
    (sources ?? []) as ManagerRelationshipSource[],
    (signals ?? []) as ManagerRelationshipSignal[]
  )
}

export default async function ManagerRelationshipsPage() {
  const rows = await getRelationshipData()
  const observed = rows.filter((row) => row.relevantCount > 0)
  const repeated = observed.filter((row) => row.strength === 'repeat_observed')
  const recurring = observed.filter((row) => row.recurringEvidence)
  const withOpportunities = observed.filter((row) => row.linkedOpportunityCount > 0)

  return (
    <div className="admin-page">
      <PageHeader
        title="Relationship Intelligence"
        subtitle="Repeated venue, promoter, event-series, and programming signals. Relationship evidence is not an open gig unless a signal is explicitly linked to an opportunity."
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        <Link href="/admin/manager" className="admin-btn-ghost">Manager</Link>
        <Link href="/admin/manager/sources" className="admin-btn-ghost">Sources / Watchlist</Link>
        <Link href="/admin/manager/warm-rebooks" className="admin-btn-ghost">Warm Rebooks</Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14,
          marginBottom: 30,
        }}
      >
        {[
          ['Observed', observed.length, 'Sources with verified signals'],
          ['Repeated', repeated.length, 'Two or more relevant signals'],
          ['Recurring', recurring.length, 'Explicit recurring-program evidence'],
          ['Opportunity-linked', withOpportunities.length, 'At least one converted signal'],
        ].map(([label, value, sub]) => (
          <div key={String(label)} className="admin-stat-card">
            <div className="admin-stat-card-topline"><span>{label}</span></div>
            <div className="admin-stat-value">{value}</div>
            <div className="admin-stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      <section className="admin-section">
        <div className="admin-section-header">
          <span className="admin-section-title">Relationship Map</span>
          <span className="muted">{observed.length} observed source relationships</span>
        </div>

        {observed.length === 0 ? (
          <AdminEmptyState
            title="No relationship signals yet"
            desc="Verified source signals will appear here after discovery records them."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stack">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Evidence level</th>
                  <th>Signals</th>
                  <th>Latest evidence</th>
                  <th>Last verified</th>
                  <th>Action state</th>
                </tr>
              </thead>
              <tbody>
                {observed.map((row) => {
                  const latest = row.latestSignal
                  const evidenceHref = latest?.url ?? row.source.url

                  return (
                    <tr key={row.source.id}>
                      <td data-label="Source">
                        <strong>{row.source.name}</strong>
                        <div className="muted" style={{ marginTop: 3, fontSize: 10 }}>
                          {row.source.source_kind} · {locationLabel(row.source)}
                        </div>
                      </td>
                      <td data-label="Evidence level">
                        <strong style={{ fontSize: 11 }}>
                          {managerRelationshipStrengthLabel(row.strength)}
                        </strong>
                        <div className="muted" style={{ marginTop: 3, fontSize: 10 }}>
                          {row.recurringEvidence ? 'Recurring pattern stated in verified evidence' : 'No recurring pattern inferred'}
                        </div>
                      </td>
                      <td data-label="Signals">
                        {row.relevantCount} relevant
                        {row.ignoredCount > 0 ? (
                          <div className="muted" style={{ marginTop: 3, fontSize: 10 }}>
                            {row.ignoredCount} ignored
                          </div>
                        ) : null}
                      </td>
                      <td data-label="Latest evidence">
                        {latest ? (
                          <>
                            <a href={evidenceHref} target="_blank" rel="noreferrer">
                              {latest.title}
                            </a>
                            {latest.summary ? (
                              <div className="muted" style={{ marginTop: 4, fontSize: 10, maxWidth: 420 }}>
                                {latest.summary}
                              </div>
                            ) : null}
                          </>
                        ) : '—'}
                      </td>
                      <td data-label="Last verified">
                        {latest ? fmtDate(latest.published_at ?? latest.discovered_at) : '—'}
                      </td>
                      <td data-label="Action state">
                        {row.linkedOpportunityCount > 0 ? (
                          <span>{row.linkedOpportunityCount} linked opportunity{row.linkedOpportunityCount === 1 ? '' : 'ies'}</span>
                        ) : (
                          <span className="muted">Relationship watch only</span>
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
    </div>
  )
}
