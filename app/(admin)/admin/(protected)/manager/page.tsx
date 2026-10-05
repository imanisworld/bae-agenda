import Link from 'next/link'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import ManagerStatusBadge from '@/components/admin/ManagerStatusBadge'
import PageHeader from '@/components/admin/PageHeader'
import {
  MANAGER_OPPORTUNITY_TYPE_LABELS,
  isManagerOpportunityStatus,
  isManagerOpportunityType,
  type ManagerOpportunityStatus,
  type ManagerOpportunityType,
} from '@/lib/manager'
import { createAdminClient } from '@/lib/supabase/admin'
import { managerFollowUpUrgency } from '@/lib/manager-follow-up'
import { buildManagerTodayQueue } from '@/lib/manager-today'

interface OpportunityRow {
  id: string
  title: string
  organization: string | null
  opportunity_type: ManagerOpportunityType
  status: ManagerOpportunityStatus
  location_city: string | null
  location_state: string | null
  event_date: string | null
  application_deadline: string | null
  compensation_min: number | null
  compensation_max: number | null
  recommended_demo: string | null
  expected_work_hours: number | null
  estimated_total_hours: number | null
  estimated_net_pay: number | null
  effective_hourly_rate: number | null
  economics_basis: string | null
  outreach_prepared_at: string | null
  outreach_missing_items: string[] | null
  outreach_channel: string | null
  fit_score: number | null
  next_action: string | null
  next_action_at: string | null
  created_at: string
}

interface ManagerData {
  configured: boolean
  profileReady: boolean
  opportunities: OpportunityRow[]
}

function fmtDate(value: string | null) {
  if (!value) return '—'
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function fmtPay(min: number | null, max: number | null) {
  const money = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)

  if (min !== null && max !== null) return min === max ? money(min) : `${money(min)}–${money(max)}`
  if (min !== null) return `${money(min)}+`
  if (max !== null) return `Up to ${money(max)}`
  return 'Unknown'
}

function fmtEconomics(row: OpportunityRow) {
  if (row.effective_hourly_rate !== null) {
    const rate = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(row.effective_hourly_rate)

    if (row.economics_basis === 'all_in_net') return `${rate}/hr net`
    if (row.economics_basis === 'all_in_gross') return `${rate}/hr all-in`
    if (row.economics_basis === 'on_site_gross') return `${rate}/hr onsite`
    return `${rate}/hr`
  }

  if (row.compensation_min !== null && row.expected_work_hours === null) return 'Need hours'
  if (row.compensation_min === null) return 'Pay unknown'
  return 'Incomplete'
}

function outreachLabel(row: OpportunityRow) {
  if (!row.outreach_prepared_at) return 'Not prepped'
  const missing = row.outreach_missing_items?.length ?? 0
  if (missing > 0) return `Needs ${missing}`
  if (row.outreach_channel === 'instagram_dm') return 'Ready · IG'
  if (row.outreach_channel === 'web_form') return 'Ready · Web'
  if (row.outreach_channel === 'application') return 'Ready · Apply'
  if (row.outreach_channel === 'email') return 'Ready · Email'
  return 'Ready'
}

function locationLabel(row: OpportunityRow) {
  const parts = [row.location_city, row.location_state].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Unknown'
}

async function getManagerData(): Promise<ManagerData> {
  try {
    const admin = createAdminClient()
    const [
      { data: opportunities, error: opportunitiesError },
      { data: profile, error: profileError },
    ] = await Promise.all([
      admin
        .from('manager_opportunities')
        .select('id, title, organization, opportunity_type, status, location_city, location_state, event_date, application_deadline, compensation_min, compensation_max, recommended_demo, expected_work_hours, estimated_total_hours, estimated_net_pay, effective_hourly_rate, economics_basis, outreach_prepared_at, outreach_missing_items, outreach_channel, fit_score, next_action, next_action_at, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      admin
        .from('manager_profiles')
        .select('id')
        .eq('profile_key', 'dj_bae')
        .maybeSingle(),
    ])

    if (opportunitiesError || profileError) {
      const code = opportunitiesError?.code ?? profileError?.code
      if (code === '42P01' || code === 'PGRST205') {
        return { configured: false, profileReady: false, opportunities: [] }
      }
      throw new Error(opportunitiesError?.message ?? profileError?.message ?? 'Unable to load manager.')
    }

    const rows = (opportunities ?? [])
      .map((row: Record<string, unknown>) => {
        const status = isManagerOpportunityStatus(row.status) ? row.status : 'found'
        const type = isManagerOpportunityType(row.opportunity_type) ? row.opportunity_type : 'other'

        return {
          ...row,
          status,
          opportunity_type: type,
        } as OpportunityRow
      })

    return {
      configured: true,
      profileReady: Boolean(profile),
      opportunities: rows,
    }
  } catch {
    return { configured: false, profileReady: false, opportunities: [] }
  }
}

export default async function ManagerPage() {
  const data = await getManagerData()
  const opportunities = data.opportunities
  const active = opportunities.filter((item) => !['booked', 'passed', 'lost'].includes(item.status))
  const needsReview = opportunities.filter((item) => ['found', 'qualified', 'review'].includes(item.status))
  const inMotion = opportunities.filter((item) => ['outreach_ready', 'applied', 'contacted', 'follow_up', 'negotiating'].includes(item.status))
  const booked = opportunities.filter((item) => item.status === 'booked')
  const todayQueue = buildManagerTodayQueue(active)
  const followUpQueue = opportunities
    .filter((item) => ['applied', 'contacted', 'follow_up'].includes(item.status))
    .map((item) => ({
      ...item,
      followUpUrgency: managerFollowUpUrgency(item.next_action_at),
    }))
    .filter((item) => item.followUpUrgency === 'due' || item.followUpUrgency === 'overdue')
    .sort((a, b) => (a.next_action_at ?? '').localeCompare(b.next_action_at ?? ''))

  return (
    <div className="admin-page">
      <PageHeader
        title="Manager"
        subtitle="Business-development control room for gigs, brand deals, outreach, and follow-up."
        action={{ label: 'Add Opportunity', href: '/admin/manager/opportunities/new' }}
      />

      {!data.configured && (
        <div className="admin-preview-banner" style={{ marginBottom: 18 }}>
          <span className="admin-preview-mark" aria-hidden="true">◈</span>
          <div>
            <div className="admin-preview-title">Manager database not installed yet</div>
            <p>
              The admin interface is built, but this environment does not have the private Manager tables yet.
              No sample leads are being substituted.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        <Link href="/admin/manager/profile" className="admin-btn-ghost">
          Manager Profile
        </Link>
        <Link href="/admin/manager/sources" className="admin-btn-ghost">
          Sources / Watchlist
        </Link>
        <Link href="/admin/manager/opportunities/new" className="admin-btn-ghost">
          Manual Lead
        </Link>
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
          ['Active', active.length, 'Open pipeline'],
          ['Needs Review', needsReview.length, 'Found / qualified'],
          ['In Motion', inMotion.length, 'Outreach through negotiation'],
          ['Follow-ups', followUpQueue.length, 'Due or overdue'],
          ['Booked', booked.length, 'Converted opportunities'],
        ].map(([label, value, sub]) => (
          <div key={String(label)} className="admin-stat-card">
            <div className="admin-stat-card-topline">
              <span>{label}</span>
            </div>
            <div className="admin-stat-value">{value}</div>
            <div className="admin-stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {!data.profileReady && data.configured && (
        <div className="admin-preview-banner" style={{ marginBottom: 18 }}>
          <span className="admin-preview-mark" aria-hidden="true">!</span>
          <div>
            <div className="admin-preview-title">Manager profile needs setup</div>
            <p>
              Set pay, travel, market, event-type, brand, genre, and deal-breaker rules before automated scoring is enabled.
            </p>
          </div>
        </div>
      )}

      <section className="admin-section" style={{ marginBottom: 24 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Follow-up Queue</span>
          <span className="muted">{followUpQueue.length} due / overdue</span>
        </div>

        {followUpQueue.length === 0 ? (
          <AdminEmptyState
            title="No follow-ups due"
            desc="Contacted and applied opportunities will appear here when their scheduled follow-up date arrives."
          />
        ) : (
          <div style={{ display: 'grid', gap: 1, background: 'var(--border)' }}>
            {followUpQueue.map((item) => (
              <Link
                key={item.id}
                href={`/admin/manager/opportunities/${item.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                  gap: 14,
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: 'var(--surface)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 12, fontWeight: 500 }}>
                    {item.title}
                  </strong>
                  <span className="muted" style={{ fontSize: 10 }}>
                    {item.organization ?? 'No organization'} · {item.next_action ?? 'Follow up'}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    color: item.followUpUrgency === 'overdue' ? '#e85d75' : 'var(--gold)',
                  }}
                >
                  {item.followUpUrgency}
                </span>
                <span className="muted" style={{ fontSize: 11 }}>
                  {fmtDate(item.next_action_at)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Opportunity Pipeline</span>
          <span className="muted">{opportunities.length} total</span>
        </div>

        {opportunities.length === 0 ? (
          <AdminEmptyState
            title={data.configured ? 'No opportunities yet' : 'Manager storage unavailable'}
            desc={
              data.configured
                ? 'Add a lead manually first. Automated discovery will write into this same pipeline later.'
                : 'The schema is intentionally waiting for a non-production database verification pass.'
            }
            action={data.configured ? { label: 'Add Opportunity', href: '/admin/manager/opportunities/new' } : undefined}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stack">
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Deadline</th>
                  <th>Pay</th>
                  <th>Location</th>
                  <th>Economics</th>
                  <th>Demo</th>
                  <th>Outreach</th>
                  <th>Fit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Opportunity">
                      <div style={{ display: 'grid', gap: 3 }}>
                        <strong style={{ fontWeight: 500 }}>{item.title}</strong>
                        <span className="muted" style={{ fontSize: 11 }}>
                          {item.organization ?? MANAGER_OPPORTUNITY_TYPE_LABELS[item.opportunity_type]}
                        </span>
                      </div>
                    </td>
                    <td data-label="Status">
                      <ManagerStatusBadge status={item.status} />
                    </td>
                    <td data-label="Date" className="muted">{fmtDate(item.event_date)}</td>
                    <td data-label="Deadline" className="muted">{fmtDate(item.application_deadline)}</td>
                    <td data-label="Pay">{fmtPay(item.compensation_min, item.compensation_max)}</td>
                    <td data-label="Location" className="muted">{locationLabel(item)}</td>
                    <td data-label="Economics" className="muted">{fmtEconomics(item)}</td>
                    <td data-label="Demo" className="muted">{item.recommended_demo ?? '—'}</td>
                    <td data-label="Outreach" className="muted">{outreachLabel(item)}</td>
                    <td data-label="Fit">
                      {item.fit_score === null ? '—' : `${item.fit_score}/100`}
                    </td>
                    <td data-label="Action">
                      <Link href={`/admin/manager/opportunities/${item.id}`} className="admin-view-all">
                        Review →
                      </Link>
                    </td>
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
