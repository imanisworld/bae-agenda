import Link from 'next/link'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import ManagerStatusBadge from '@/components/admin/ManagerStatusBadge'
import PageHeader from '@/components/admin/PageHeader'
import AdminPagination from '@/components/admin/AdminPagination'
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
import { normalizeAdminPage, paginateRows } from '@/lib/admin-pagination'

type ManagerPipelineView =
  | 'active'
  | 'needs_action'
  | 'outreach_ready'
  | 'follow_up'
  | 'negotiating'
  | 'warm_rebook'
  | 'history'
  | 'all'

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
  source_payload: Record<string, unknown> | null
  created_at: string
}

interface ManagerData {
  configured: boolean
  profileReady: boolean
  opportunities: OpportunityRow[]
  /** Every open lead, uncapped by the pipeline table's row limit. */
  activeOpportunities: OpportunityRow[]
}

const CLOSED_STATUSES = ['booked', 'passed', 'lost']
const PIPELINE_VIEWS: Array<{ value: ManagerPipelineView; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'needs_action', label: 'Needs Action' },
  { value: 'outreach_ready', label: 'Outreach Ready' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'warm_rebook', label: 'Warm Rebooks' },
  { value: 'history', label: 'History' },
  { value: 'all', label: 'All' },
]
const OPPORTUNITY_COLUMNS = 'id, title, organization, opportunity_type, status, location_city, location_state, event_date, application_deadline, compensation_min, compensation_max, recommended_demo, expected_work_hours, estimated_total_hours, estimated_net_pay, effective_hourly_rate, economics_basis, outreach_prepared_at, outreach_missing_items, outreach_channel, fit_score, next_action, next_action_at, source_payload, created_at'

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

function normalizePipelineView(value: string | string[] | undefined): ManagerPipelineView {
  const raw = Array.isArray(value) ? value[0] : value
  return PIPELINE_VIEWS.some((view) => view.value === raw)
    ? raw as ManagerPipelineView
    : 'active'
}

function isWarmRebook(row: OpportunityRow) {
  return row.source_payload?.lead_origin === 'warm_rebook'
}

async function getManagerData(): Promise<ManagerData> {
  try {
    const admin = createAdminClient()
    const [
      { data: opportunities, error: opportunitiesError },
      { data: activeOpportunities, error: activeError },
      { data: profile, error: profileError },
    ] = await Promise.all([
      admin
        .from('manager_opportunities')
        .select(OPPORTUNITY_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(1000),
      admin
        .from('manager_opportunities')
        .select(OPPORTUNITY_COLUMNS)
        .not('status', 'in', `(${CLOSED_STATUSES.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(1000),
      admin
        .from('manager_profiles')
        .select('id')
        .eq('profile_key', 'dj_bae')
        .maybeSingle(),
    ])

    const firstError = opportunitiesError ?? activeError ?? profileError
    if (firstError) {
      if (firstError.code === '42P01' || firstError.code === 'PGRST205') {
        return { configured: false, profileReady: false, opportunities: [], activeOpportunities: [] }
      }
      throw new Error(firstError.message ?? 'Unable to load manager.')
    }

    const normalize = (list: Record<string, unknown>[] | null) => (list ?? [])
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
      opportunities: normalize(opportunities),
      activeOpportunities: normalize(activeOpportunities),
    }
  } catch {
    return { configured: false, profileReady: false, opportunities: [], activeOpportunities: [] }
  }
}

export default async function ManagerPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string | string[]; page?: string | string[] }>
}) {
  const query = searchParams ? await searchParams : undefined
  const selectedView = normalizePipelineView(query?.view)
  const requestedPage = normalizeAdminPage(query?.page)
  const data = await getManagerData()
  const opportunities = data.opportunities
  const active = data.activeOpportunities
  const needsReview = active.filter((item) => ['found', 'qualified', 'review'].includes(item.status))
  const inMotion = active.filter((item) => ['outreach_ready', 'applied', 'contacted', 'follow_up', 'negotiating'].includes(item.status))
  const booked = opportunities.filter((item) => item.status === 'booked')
  const todayQueue = buildManagerTodayQueue(active)
  const allActionQueue = buildManagerTodayQueue(active, { limit: 1000 })
  const needsActionIds = new Set(allActionQueue.entries.map((entry) => entry.item.id))
  const followUpQueue = active
    .filter((item) => ['applied', 'contacted', 'follow_up'].includes(item.status))
    .map((item) => ({
      ...item,
      followUpUrgency: managerFollowUpUrgency(item.next_action_at),
    }))
    .filter((item) => item.followUpUrgency === 'due' || item.followUpUrgency === 'overdue')
    .sort((a, b) => (a.next_action_at ?? '').localeCompare(b.next_action_at ?? ''))


  const filteredOpportunities = opportunities.filter((item) => {
    if (selectedView === 'all') return true
    if (selectedView === 'history') return CLOSED_STATUSES.includes(item.status)
    if (selectedView === 'active') return !CLOSED_STATUSES.includes(item.status)
    if (selectedView === 'needs_action') return needsActionIds.has(item.id)
    if (selectedView === 'outreach_ready') return item.status === 'outreach_ready'
    if (selectedView === 'follow_up') return ['applied', 'contacted', 'follow_up'].includes(item.status)
    if (selectedView === 'negotiating') return item.status === 'negotiating'
    if (selectedView === 'warm_rebook') return !CLOSED_STATUSES.includes(item.status) && isWarmRebook(item)
    return true
  })
  const pipelinePage = paginateRows(filteredOpportunities, requestedPage)

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
        <a href="#today" className="admin-btn-primary">
          Today
        </a>
        <Link href="/admin/manager/profile" className="admin-btn-ghost">
          Manager Profile
        </Link>
        <Link href="/admin/manager/sources" className="admin-btn-ghost">
          Sources / Watchlist
        </Link>
        <Link href="/admin/manager/relationships" className="admin-btn-ghost">
          Relationships
        </Link>
        <Link href="/admin/manager/warm-rebooks" className="admin-btn-ghost">
          Warm Rebooks
        </Link>
        <Link href="/admin/manager/opportunities/new" className="admin-btn-ghost">
          Manual Lead
        </Link>
      </div>

      <section id="today" className="admin-section" style={{ marginBottom: 24 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Today</span>
          <span className="muted">
            {todayQueue.total > todayQueue.entries.length
              ? `Top ${todayQueue.entries.length} of ${todayQueue.total} actions`
              : `${todayQueue.total} action${todayQueue.total === 1 ? '' : 's'}`}
          </span>
        </div>

        {todayQueue.entries.length === 0 ? (
          <AdminEmptyState
            title="Nothing needs action right now"
            desc="New leads, ready outreach, negotiations, and due follow-ups will surface here automatically."
          />
        ) : (
          <div style={{ display: 'grid', gap: 1, background: 'var(--border)' }}>
            {todayQueue.entries.map(({ item, label, dueOn }) => (
              <Link
                key={item.id}
                href={`/admin/manager/opportunities/${item.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: 'var(--surface)',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 12, fontWeight: 500 }}>{label}</strong>
                  <span className="muted" style={{ display: 'block', fontSize: 10, lineHeight: 1.45, marginTop: 2 }}>
                    {item.title}{item.organization ? ` · ${item.organization}` : ''}
                    {dueOn ? ` · ${fmtDate(dueOn)}` : ''}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <ManagerStatusBadge status={item.status as ManagerOpportunityStatus} />
                  <div className="muted" style={{ marginTop: 4, fontSize: 10 }}>
                    {item.fit_score === null ? 'Fit —' : `Fit ${item.fit_score}`}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

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

      <section id="pipeline" className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Opportunity Pipeline</span>
          <span className="muted">{filteredOpportunities.length} matching · {opportunities.length} total</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 0 18px' }}>
          {PIPELINE_VIEWS.map((view) => (
            <Link
              key={view.value}
              href={`/admin/manager?view=${view.value}#pipeline`}
              className={selectedView === view.value ? 'admin-btn-primary' : 'admin-btn-ghost'}
            >
              {view.label}
            </Link>
          ))}
        </div>

        {filteredOpportunities.length === 0 ? (
          <AdminEmptyState
            title={data.configured ? `No ${PIPELINE_VIEWS.find((view) => view.value === selectedView)?.label.toLowerCase() ?? ''} opportunities` : 'Manager storage unavailable'}
            desc={
              data.configured
                ? 'Add a lead manually first. Automated discovery will write into this same pipeline later.'
                : 'The schema is intentionally waiting for a non-production database verification pass.'
            }
            action={data.configured ? { label: 'Add Opportunity', href: '/admin/manager/opportunities/new' } : undefined}
          />
        ) : (
          <>
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
                {pipelinePage.items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Opportunity">
                      <div style={{ display: 'grid', gap: 3 }}>
                        <strong style={{ fontWeight: 500 }}>{item.title}</strong>
                        <span className="muted" style={{ fontSize: 11 }}>
                          {item.organization ?? MANAGER_OPPORTUNITY_TYPE_LABELS[item.opportunity_type]}
                          {isWarmRebook(item) ? ' · Warm rebook' : ''}
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
            <AdminPagination
              pathname="/admin/manager"
              page={pipelinePage.page}
              totalPages={pipelinePage.totalPages}
              totalItems={pipelinePage.totalItems}
              pageSize={pipelinePage.pageSize}
              params={{ view: selectedView }}
              hash="pipeline"
            />
          </>
        )}
      </section>
    </div>
  )
}
