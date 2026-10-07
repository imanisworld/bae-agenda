import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminNotice from '@/components/admin/AdminNotice'
import ManagerOpportunityForm, { type ManagerOpportunityFormValue } from '@/components/admin/ManagerOpportunityForm'
import ManagerStatusBadge from '@/components/admin/ManagerStatusBadge'
import PageHeader from '@/components/admin/PageHeader'
import { updateManagerOpportunityAction } from '@/app/actions/manager'
import { addManagerOpportunityActivityAction } from '@/app/actions/manager-activity'
import { prepareManagerOutreachAction, saveManagerOutreachDraftAction } from '@/app/actions/manager-outreach'
import { dispatchManagerOutreachAction } from '@/app/actions/manager-dispatch'
import { dispatchManagerFollowUpAction } from '@/app/actions/manager-follow-up'
import { recordManagerNegotiationDecisionAction } from '@/app/actions/manager-negotiation'
import {
  MANAGER_ACTIVITY_TYPES,
  MANAGER_ACTIVITY_TYPE_LABELS,
  MANAGER_OPPORTUNITY_TYPE_LABELS,
  MANAGER_SOURCE_TYPE_LABELS,
  isManagerOpportunityStatus,
  isManagerOpportunityType,
  isManagerSourceType,
} from '@/lib/manager'
import {
  MANAGER_OUTREACH_CHANNELS,
  MANAGER_OUTREACH_CHANNEL_LABELS,
  type ManagerOutreachChannel,
  type ManagerOutreachAsset,
} from '@/lib/manager-outreach'
import { createAdminClient } from '@/lib/supabase/admin'
import { defaultManagerFollowUpDate, managerDispatchActionLabel } from '@/lib/manager-dispatch'
import {
  buildManagerFollowUpDraft,
  defaultManagerSecondFollowUpDate,
  managerFollowUpActionLabel,
  managerFollowUpUrgency,
} from '@/lib/manager-follow-up'
import { buildManagerNegotiation } from '@/lib/manager-negotiation'
import { splitManagerAsks } from '@/lib/manager-asks'

type ScoreComponent = { score?: number; max?: number; note?: string }

type NegotiationProfile = {
  minimum_fee: number | null
  target_hourly_rate: number | null
  max_drive_minutes: number | null
}

type ActivityRow = {
  id: string
  activity_type: keyof typeof MANAGER_ACTIVITY_TYPE_LABELS
  title: string
  body: string | null
  occurred_at: string
  from_status: string | null
  to_status: string | null
  metadata: Record<string, unknown> | null
}

type OpportunityDetail = ManagerOpportunityFormValue & {
  id: string
  created_at: string
  applied_at: string | null
  last_contacted_at: string | null
  booked_at: string | null
  linked_booking_id?: string | null
  fit_score_breakdown?: {
    pay?: ScoreComponent
    travel?: ScoreComponent
    eventFit?: ScoreComponent
    musicFit?: ScoreComponent
    readiness?: ScoreComponent
    flags?: string[]
  } | null
  fit_score_version?: string | null
  fit_scored_at?: string | null
  outreach_channel?: ManagerOutreachChannel | null
  outreach_subject?: string | null
  outreach_draft?: string | null
  outreach_assets?: ManagerOutreachAsset[] | null
  outreach_missing_items?: string[] | null
  outreach_prepared_at?: string | null
  outreach_version?: string | null
  economics_breakdown?: {
    note?: string
    guaranteed_gross?: number | null
    expected_work_hours?: number | null
    one_way_travel_minutes?: number | null
    round_trip_travel_hours?: number | null
    expected_total_hours?: number | null
    travel_cost_estimate?: number | null
    estimated_net_pay?: number | null
    on_site_gross_hourly_rate?: number | null
    effective_hourly_rate?: number | null
    effective_hourly_basis?: string | null
    complete?: boolean
  } | null
}

function getMessage(value: string | string[] | undefined) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function fmtMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

function fmtHours(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 2)} hr`
}

function fmtDay(value: string | null | undefined) {
  if (!value) return null
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function economicsBasisLabel(value: string | null | undefined) {
  if (value === 'all_in_net') return 'All-in net'
  if (value === 'all_in_gross') return 'All-in gross'
  if (value === 'on_site_gross') return 'On-site gross'
  return 'Incomplete'
}

function fmtTimestamp(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Indiana/Indianapolis',
  })
}

async function getNegotiationProfile(): Promise<NegotiationProfile> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('manager_profiles')
    .select('minimum_fee, target_hourly_rate, max_drive_minutes')
    .eq('profile_key', 'dj_bae')
    .maybeSingle()

  if (error || !data) {
    return {
      minimum_fee: null,
      target_hourly_rate: null,
      max_drive_minutes: null,
    }
  }

  return data as NegotiationProfile
}

async function getActivities(id: string): Promise<ActivityRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('manager_opportunity_activities')
    .select('id, activity_type, title, body, occurred_at, from_status, to_status, metadata')
    .eq('opportunity_id', id)
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return []
    throw new Error(error.message || 'Unable to load opportunity activity.')
  }

  return (data ?? []) as ActivityRow[]
}

async function getOpportunity(id: string): Promise<OpportunityDetail | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('manager_opportunities')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return null
    throw new Error(error.message || 'Unable to load opportunity.')
  }

  if (!data) return null

  return {
    ...data,
    opportunity_type: isManagerOpportunityType(data.opportunity_type) ? data.opportunity_type : 'other',
    source_type: isManagerSourceType(data.source_type) ? data.source_type : 'other',
    status: isManagerOpportunityStatus(data.status) ? data.status : 'found',
  } as OpportunityDetail
}

export default async function ManagerOpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ error?: string | string[]; success?: string | string[] }>
}) {
  const { id } = await params
  const query = searchParams ? await searchParams : undefined
  const [opportunity, activities, negotiationProfile] = await Promise.all([
    getOpportunity(id),
    getActivities(id),
    getNegotiationProfile(),
  ])
  if (!opportunity) notFound()

  const errorMessage = getMessage(query?.error)
  const successMessage = getMessage(query?.success)
  const status = opportunity.status ?? 'found'
  const opportunityType = opportunity.opportunity_type ?? 'other'
  const sourceType = opportunity.source_type ?? 'other'
  const followUpEligible = ['applied', 'contacted', 'follow_up'].includes(status)
  const followUpUrgency = managerFollowUpUrgency(opportunity.next_action_at)
  const asks = splitManagerAsks(opportunity.requirements)
  const eventPlace = [
    opportunity.venue_name,
    [opportunity.location_city, opportunity.location_state].filter(Boolean).join(', '),
  ].filter(Boolean).join(' — ')
  const eventContact = [
    opportunity.contact_name,
    opportunity.contact_email,
    opportunity.contact_phone,
  ].filter(Boolean).join(' · ')
  const eventDetails: [string, string | null][] = [
    ['Who\'s Running It', opportunity.organization?.trim() || null],
    ['Contact Person', eventContact || null],
    ['Where', eventPlace || null],
    ['Event Date', fmtDay(opportunity.event_date)],
    ...(opportunity.application_deadline
      ? [['Apply By', fmtDay(opportunity.application_deadline)] as [string, string | null]]
      : []),
  ]
  const followUpDraft = followUpEligible
    ? buildManagerFollowUpDraft(opportunity)
    : null
  const negotiation =
    status === 'negotiating'
      ? buildManagerNegotiation(negotiationProfile, opportunity)
      : null

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title={opportunity.title ?? 'Opportunity'}
        subtitle={[
          opportunity.organization,
          MANAGER_OPPORTUNITY_TYPE_LABELS[opportunityType],
        ].filter(Boolean).join(' · ')}
        action={{ label: 'Back To Manager', href: '/admin/manager' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}
      {successMessage && (
        <div className="admin-preview-banner" style={{ marginBottom: 16 }}>
          <span className="admin-preview-mark" aria-hidden="true">✓</span>
          <div><div className="admin-preview-title">{successMessage}</div></div>
        </div>
      )}

      <section className="admin-section" style={{ marginBottom: 16 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Event Details</span>
          {eventDetails.some(([, value]) => !value) && (
            <a href="#edit-opportunity" className="muted" style={{ fontSize: 10, textDecoration: 'underline' }}>
              Fill in missing details
            </a>
          )}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 1,
            background: 'var(--border)',
          }}
        >
          {eventDetails.map(([label, value]) => (
            <div key={label} style={{ background: 'var(--surface)', padding: '14px 16px' }}>
              <div style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>
                {label}
              </div>
              <div style={{ color: value ? 'var(--white)' : 'var(--muted)', fontSize: 12, overflowWrap: 'anywhere' }}>
                {value ?? 'Not found yet'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section" style={{ marginBottom: 16 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Manager Snapshot</span>
          <ManagerStatusBadge status={status} />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 1,
            background: 'var(--border)',
          }}
        >
          {[
            ['Type', MANAGER_OPPORTUNITY_TYPE_LABELS[opportunityType]],
            ['Source', MANAGER_SOURCE_TYPE_LABELS[sourceType]],
            ['Demo', opportunity.recommended_demo ?? 'Not selected'],
            ['Fit', opportunity.fit_score === null || opportunity.fit_score === undefined ? 'Not scored' : `${opportunity.fit_score}/100`],
            ['Scored', fmtTimestamp(opportunity.fit_scored_at ?? null)],
            ['Added', fmtTimestamp(opportunity.created_at)],
            ['Applied', fmtTimestamp(opportunity.applied_at)],
            ['Last Contact', fmtTimestamp(opportunity.last_contacted_at)],
            ['Booked', fmtTimestamp(opportunity.booked_at)],
          ].map(([label, value]) => (
            <div key={label} style={{ background: 'var(--surface)', padding: '14px 16px' }}>
              <div style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>
                {label}
              </div>
              <div style={{ color: 'var(--white)', fontSize: 12 }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section" style={{ marginBottom: 16 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Gig Economics</span>
          <span className="muted">{economicsBasisLabel(opportunity.economics_basis)}</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 1,
            background: 'var(--border)',
          }}
        >
          {[
            ['Guaranteed Pay', fmtMoney(opportunity.compensation_min)],
            ['Work Hours', fmtHours(opportunity.expected_work_hours)],
            ['Travel One-way', opportunity.travel_minutes === null || opportunity.travel_minutes === undefined ? '—' : `${opportunity.travel_minutes} min`],
            ['Total Time', fmtHours(opportunity.estimated_total_hours)],
            ['Travel Cost', fmtMoney(opportunity.travel_cost_estimate)],
            ['Est. Net Pay', fmtMoney(opportunity.estimated_net_pay)],
            ['Effective Rate', opportunity.effective_hourly_rate === null || opportunity.effective_hourly_rate === undefined ? '—' : `${fmtMoney(opportunity.effective_hourly_rate)}/hr`],
          ].map(([label, value]) => (
            <div key={String(label)} style={{ background: 'var(--surface)', padding: '14px 16px' }}>
              <div style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>
                {label}
              </div>
              <div style={{ color: 'var(--white)', fontSize: 12 }}>{value}</div>
            </div>
          ))}
        </div>
        {opportunity.economics_breakdown?.note && (
          <p className="muted" style={{ fontSize: 11, margin: '12px 0 0' }}>
            {opportunity.economics_breakdown.note}
          </p>
        )}
      </section>

      {negotiation && (
        <section className="admin-section" style={{ marginBottom: 16 }}>
          <div className="admin-section-header">
            <span className="admin-section-title">Negotiation Assistant</span>
            <span className="muted">Recommendation: {negotiation.label}</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 1,
              background: 'var(--border)',
              marginBottom: 14,
            }}
          >
            {[
              ['Current Offer', fmtMoney(opportunity.compensation_min)],
              ['Minimum Fee', fmtMoney(negotiationProfile.minimum_fee)],
              ['Effective Rate', opportunity.effective_hourly_rate == null ? '—' : `${fmtMoney(opportunity.effective_hourly_rate)}/hr`],
              ['Target Rate', negotiationProfile.target_hourly_rate == null ? '—' : `${fmtMoney(negotiationProfile.target_hourly_rate)}/hr`],
              ['Suggested Counter', fmtMoney(negotiation.suggested_counter_fee)],
            ].map(([label, value]) => (
              <div key={String(label)} style={{ background: 'var(--surface)', padding: '14px 16px' }}>
                <div style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>
                  {label}
                </div>
                <div style={{ color: 'var(--white)', fontSize: 12 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
            {negotiation.reasons.map((reason) => (
              <div key={reason} className="muted" style={{ fontSize: 11, lineHeight: 1.55 }}>
                {reason}
              </div>
            ))}
            {negotiation.missing.length > 0 && (
              <div className="muted" style={{ fontSize: 11 }}>
                Missing: {negotiation.missing.join(', ')}
              </div>
            )}
          </div>

          <form action={recordManagerNegotiationDecisionAction}>
            <input type="hidden" name="opportunity_id" value={opportunity.id} />

            <div className="admin-form-grid-two" style={{ marginBottom: 12 }}>
              <label style={{ display: 'grid', gap: 7 }}>
                <span className="admin-field-label">Decision</span>
                <select
                  name="decision"
                  defaultValue={negotiation.decision}
                  className="admin-input"
                >
                  <option value="accept">Accept</option>
                  <option value="counter">Counter</option>
                  <option value="pass">Pass</option>
                  <option value="needs_info">Needs Info</option>
                </select>
              </label>

              <label style={{ display: 'grid', gap: 7 }}>
                <span className="admin-field-label">Proposed Fee</span>
                <input
                  name="proposed_fee"
                  type="number"
                  min={0}
                  step="25"
                  defaultValue={negotiation.suggested_counter_fee ?? ''}
                  className="admin-input"
                  placeholder="Optional"
                />
              </label>
            </div>

            <label style={{ display: 'grid', gap: 7, marginBottom: 12 }}>
              <span className="admin-field-label">Negotiation Note / Counter Draft</span>
              <textarea
                name="note"
                rows={9}
                defaultValue={negotiation.counter_draft ?? ''}
                className="admin-input"
                style={{ minHeight: 190, resize: 'vertical', lineHeight: 1.6 }}
                placeholder="Add the terms, response, or editable counter message you want preserved in the timeline."
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="muted" style={{ fontSize: 10 }}>
                Records the decision and terms only. It does not send a message or create a booking.
              </span>
              <button type="submit" className="admin-btn-primary">
                Record Negotiation Decision
              </button>
            </div>
          </form>
        </section>
      )}

      {opportunity.fit_score_breakdown && (
        <section className="admin-section" style={{ marginBottom: 16 }}>
          <div className="admin-section-header">
            <span className="admin-section-title">Why This Score</span>
            <span className="muted">{opportunity.fit_score_version ?? 'v1'}</span>
          </div>
          <div style={{ display: 'grid', gap: 10, padding: '4px 0' }}>
            {[
              ['Pay', opportunity.fit_score_breakdown.pay],
              ['Travel', opportunity.fit_score_breakdown.travel],
              ['Event Fit', opportunity.fit_score_breakdown.eventFit],
              ['Music Fit', opportunity.fit_score_breakdown.musicFit],
              ['Readiness', opportunity.fit_score_breakdown.readiness],
            ].map(([label, component]) => {
              const item = component as ScoreComponent | undefined
              if (!item) return null
              return (
                <div key={String(label)} style={{ display: 'grid', gridTemplateColumns: '110px 70px 1fr', gap: 12, alignItems: 'baseline' }}>
                  <strong style={{ fontSize: 12, fontWeight: 500 }}>{String(label)}</strong>
                  <span style={{ fontSize: 12 }}>{item.score ?? 0}/{item.max ?? '—'}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{item.note ?? '—'}</span>
                </div>
              )
            })}
            {(opportunity.fit_score_breakdown.flags?.length ?? 0) > 0 && (
              <div className="muted" style={{ fontSize: 11 }}>
                Flags: {opportunity.fit_score_breakdown.flags?.join(', ')}
              </div>
            )}
          </div>
        </section>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {opportunity.linked_booking_id ? (
          <Link
            href={`/admin/bookings/${opportunity.linked_booking_id}`}
            className="admin-btn-primary"
          >
            Open Linked Booking →
          </Link>
        ) : (
          <Link
            href={`/admin/bookings/new?opportunity=${opportunity.id}`}
            className="admin-btn-primary"
          >
            Create Booking From Opportunity
          </Link>
        )}
      </div>

      {opportunity.source_url && (
        <div style={{ marginBottom: 16 }}>
          <Link
            href={opportunity.source_url}
            target="_blank"
            rel="noreferrer"
            className="admin-btn-ghost"
          >
            Open Original Source ↗
          </Link>
        </div>
      )}

      <section className="admin-section" style={{ marginBottom: 16 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Outreach / Application Prep</span>
          <span className="muted">
            {opportunity.outreach_prepared_at
              ? `Prepared ${fmtTimestamp(opportunity.outreach_prepared_at)}`
              : 'Not prepared'}
          </span>
        </div>

        {!opportunity.outreach_draft ? (
          <div style={{ padding: '18px 0' }}>
            <p className="muted" style={{ margin: '0 0 14px', fontSize: 12, lineHeight: 1.6 }}>
              Build a review-only pitch using the opportunity, Manager Profile, website, Instagram, and closest published mix. Nothing is sent automatically.
            </p>
            <form action={prepareManagerOutreachAction}>
              <input type="hidden" name="opportunity_id" value={opportunity.id} />
              <button type="submit" className="admin-btn-primary">Prepare Outreach</button>
            </form>
          </div>
        ) : (
          <>
            {(opportunity.outreach_missing_items?.length ?? 0) > 0 ? (
              <div className="admin-preview-banner" style={{ margin: '14px 0' }}>
                <span className="admin-preview-mark" aria-hidden="true">!</span>
                <div>
                  <div className="admin-preview-title">Missing Before Outreach</div>
                  <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                    {opportunity.outreach_missing_items?.map((item) => (
                      <span key={item} className="muted" style={{ fontSize: 11 }}>{item}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="admin-preview-banner" style={{ margin: '14px 0' }}>
                <span className="admin-preview-mark" aria-hidden="true">✓</span>
                <div>
                  <div className="admin-preview-title">Prep complete</div>
                  <p>Manager found a usable route and supporting assets. Review the copy before you send or apply.</p>
                </div>
              </div>
            )}

            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', margin: '0 0 4px' }}>
              <div className="admin-section-title" style={{ marginBottom: 8 }}>What They Asked For</div>
              {asks.length === 0 ? (
                <p className="muted" style={{ margin: 0, fontSize: 11, lineHeight: 1.6 }}>
                  Manager didn&apos;t record what this lead is asking for. Open the original source, then add their asks to{' '}
                  <a href="#edit-opportunity" style={{ textDecoration: 'underline' }}>Requirements</a>{' '}
                  (one per line). Sending stays locked until you do.
                </p>
              ) : (
                <>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4, fontSize: 12, lineHeight: 1.5 }}>
                    {asks.map((ask, index) => (
                      <li key={`${index}:${ask}`}>{ask}</li>
                    ))}
                  </ul>
                  <p className="muted" style={{ margin: '8px 0 0', fontSize: 10 }}>
                    Make sure the draft below answers each of these. Wrong or incomplete? Fix it in{' '}
                    <a href="#edit-opportunity" style={{ textDecoration: 'underline' }}>Requirements</a>.
                  </p>
                </>
              )}
            </div>

            <form action={saveManagerOutreachDraftAction} style={{ padding: '14px 0 18px' }}>
              <input type="hidden" name="opportunity_id" value={opportunity.id} />

              <div className="admin-form-grid-two" style={{ marginBottom: 12 }}>
                <label style={{ display: 'grid', gap: 7 }}>
                  <span className="admin-field-label">Recommended Channel</span>
                  <select
                    name="outreach_channel"
                    defaultValue={opportunity.outreach_channel ?? 'other'}
                    className="admin-input"
                  >
                    {MANAGER_OUTREACH_CHANNELS.map((channel) => (
                      <option key={channel} value={channel}>
                        {MANAGER_OUTREACH_CHANNEL_LABELS[channel]}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: 7 }}>
                  <span className="admin-field-label">Subject</span>
                  <input
                    name="outreach_subject"
                    defaultValue={opportunity.outreach_subject ?? ''}
                    className="admin-input"
                    placeholder="Email/application subject"
                  />
                </label>
              </div>

              <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
                <span className="admin-field-label">Prepared Draft</span>
                <textarea
                  name="outreach_draft"
                  rows={14}
                  defaultValue={opportunity.outreach_draft ?? ''}
                  className="admin-input"
                  style={{ minHeight: 300, resize: 'vertical', lineHeight: 1.6 }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <span className="muted" style={{ fontSize: 10 }}>
                  Saving edits does not contact anyone.
                </span>
                <button type="submit" className="admin-btn-primary">Save Draft</button>
              </div>
            </form>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div className="admin-section-title" style={{ marginBottom: 10 }}>Assets To Send</div>
              {(opportunity.outreach_assets?.length ?? 0) === 0 ? (
                <p className="muted" style={{ fontSize: 11, margin: 0 }}>No supporting assets selected.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {opportunity.outreach_assets?.map((asset) => (
                    <Link
                      key={`${asset.kind}:${asset.url}`}
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-btn-ghost"
                      title={asset.note}
                    >
                      {asset.label} ↗
                    </Link>
                  ))}
                </div>
              )}

              <form action={prepareManagerOutreachAction} style={{ marginTop: 14 }}>
                <input type="hidden" name="opportunity_id" value={opportunity.id} />
                <button type="submit" className="admin-btn-ghost">Refresh Prep</button>
              </form>
            </div>

            {status === 'outreach_ready' && (opportunity.outreach_missing_items?.length ?? 0) === 0 && opportunity.outreach_channel && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 18, paddingTop: 18 }}>
                <div className="admin-section-title" style={{ marginBottom: 8 }}>
                  Send / Record Submission
                </div>
                <p className="muted" style={{ margin: '0 0 14px', fontSize: 11, lineHeight: 1.6 }}>
                  {opportunity.outreach_channel === 'email'
                    ? 'This will send the saved draft through the existing Resend mail transport. Review the recipient, subject, copy, and assets above first.'
                    : 'Complete the DM/application/form/call outside Manager first, then use this button to record exactly what was submitted and advance the pipeline.'}
                </p>

                {asks.length === 0 ? (
                  <p className="muted" style={{ margin: 0, fontSize: 11, lineHeight: 1.6 }}>
                    Locked: add what they asked for to{' '}
                    <a href="#edit-opportunity" style={{ textDecoration: 'underline' }}>Requirements</a>{' '}
                    first.
                  </p>
                ) : (
                <form action={dispatchManagerOutreachAction}>
                  <input type="hidden" name="opportunity_id" value={opportunity.id} />

                  <fieldset style={{ border: 0, padding: 0, margin: '0 0 14px', display: 'grid', gap: 8 }}>
                    <legend className="admin-field-label" style={{ marginBottom: 8 }}>My message covers everything they asked for</legend>
                    {asks.map((ask, index) => (
                      <label key={`${index}:${ask}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12, lineHeight: 1.5 }}>
                        <input
                          type="checkbox"
                          name="ask_covered"
                          value={String(index)}
                          required
                          style={{ marginTop: 3 }}
                        />
                        <span>{ask}</span>
                      </label>
                    ))}
                  </fieldset>

                  <div className="admin-form-grid-two" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'grid', gap: 7 }}>
                      <span className="admin-field-label">Channel</span>
                      <div className="admin-input" style={{ display: 'flex', alignItems: 'center' }}>
                        {MANAGER_OUTREACH_CHANNEL_LABELS[opportunity.outreach_channel]}
                      </div>
                    </div>

                    <label style={{ display: 'grid', gap: 7 }}>
                      <span className="admin-field-label">Follow-up Date</span>
                      <input
                        name="follow_up_on"
                        type="date"
                        defaultValue={opportunity.next_action_at ?? defaultManagerFollowUpDate()}
                        className="admin-input"
                      />
                    </label>
                  </div>

                  {opportunity.outreach_channel !== 'email' && (
                    <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
                      <span className="admin-field-label">Message You Sent</span>
                      <textarea
                        name="sent_message"
                        rows={10}
                        defaultValue={opportunity.outreach_draft ?? ''}
                        className="admin-input"
                        style={{ minHeight: 220, resize: 'vertical', lineHeight: 1.6 }}
                      />
                      <span className="muted" style={{ fontSize: 10 }}>
                        Paste or edit this to match what actually went out. Manager will preserve this copy in the activity timeline.
                      </span>
                    </label>
                  )}

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 14, color: 'var(--muted)', fontSize: 11, lineHeight: 1.5 }}>
                    <input
                      type="checkbox"
                      name="confirm_dispatch"
                      value="yes"
                      required
                      style={{ marginTop: 2 }}
                    />
                    <span>
                      {opportunity.outreach_channel === 'email'
                        ? 'I reviewed the saved recipient, subject, draft, and assets. Send this email now.'
                        : 'I completed this outreach externally. Record the message above exactly as sent and schedule follow-up.'}
                    </span>
                  </label>

                  <button type="submit" className="admin-btn-primary">
                    {managerDispatchActionLabel(opportunity.outreach_channel)}
                  </button>
                </form>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {followUpEligible && followUpDraft && opportunity.outreach_channel && (
        <section className="admin-section" style={{ marginBottom: 16 }}>
          <div className="admin-section-header">
            <span className="admin-section-title">Follow-up</span>
            <span
              className="muted"
              style={{
                color:
                  followUpUrgency === 'overdue'
                    ? '#e85d75'
                    : followUpUrgency === 'due'
                      ? 'var(--gold)'
                      : undefined,
              }}
            >
              {opportunity.next_action_at
                ? `${followUpUrgency === 'overdue' ? 'Overdue' : followUpUrgency === 'due' ? 'Due today' : 'Scheduled'} · ${opportunity.next_action_at}`
                : 'Not scheduled'}
            </span>
          </div>

          <p className="muted" style={{ margin: '14px 0', fontSize: 11, lineHeight: 1.6 }}>
            This draft is based on the original opportunity and outreach route. Edit it before sending or recording the follow-up.
            {opportunity.outreach_channel === 'email'
              ? ' Email follow-ups use the existing Resend transport.'
              : ' Complete this follow-up externally, then record it here.'}
          </p>

          <form action={dispatchManagerFollowUpAction}>
            <input type="hidden" name="opportunity_id" value={opportunity.id} />

            <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
              <span className="admin-field-label">Follow-up Draft</span>
              <textarea
                name="follow_up_draft"
                rows={10}
                defaultValue={followUpDraft}
                className="admin-input"
                style={{ minHeight: 220, resize: 'vertical', lineHeight: 1.6 }}
              />
            </label>

            <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
              <div style={{ display: 'grid', gap: 7 }}>
                <span className="admin-field-label">Channel</span>
                <div className="admin-input" style={{ display: 'flex', alignItems: 'center' }}>
                  {MANAGER_OUTREACH_CHANNEL_LABELS[opportunity.outreach_channel]}
                </div>
              </div>

              <label style={{ display: 'grid', gap: 7 }}>
                <span className="admin-field-label">Next Check If No Response</span>
                <input
                  name="next_follow_up_on"
                  type="date"
                  defaultValue={defaultManagerSecondFollowUpDate()}
                  className="admin-input"
                />
              </label>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 14, color: 'var(--muted)', fontSize: 11, lineHeight: 1.5 }}>
              <input
                type="checkbox"
                name="confirm_follow_up"
                value="yes"
                required
                style={{ marginTop: 2 }}
              />
              <span>
                {opportunity.outreach_channel === 'email'
                  ? 'I reviewed this follow-up. Send it now and record it in Manager.'
                  : 'I completed this follow-up externally. Record the saved copy and schedule the next check.'}
              </span>
            </label>

            <button type="submit" className="admin-btn-primary">
              {managerFollowUpActionLabel(opportunity.outreach_channel)}
            </button>
          </form>
        </section>
      )}

      <section className="admin-section" style={{ marginBottom: 16 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">Activity Timeline</span>
          <span className="muted">{activities.length} entries</span>
        </div>

        <form action={addManagerOpportunityActivityAction} style={{ padding: '16px 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 18 }}>
          <input type="hidden" name="opportunity_id" value={opportunity.id} />
          <div className="admin-form-grid-two" style={{ marginBottom: 12 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="admin-field-label">Activity Type</span>
              <select name="activity_type" defaultValue="note" className="admin-input">
                {MANAGER_ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {MANAGER_ACTIVITY_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="admin-field-label">When</span>
              <input
                name="occurred_at"
                type="datetime-local"
                className="admin-input"
              />
              <span className="muted" style={{ fontSize: 10 }}>
                Leave blank to use now.
              </span>
            </label>
          </div>

          <label style={{ display: 'grid', gap: 7, marginBottom: 12 }}>
            <span className="admin-field-label">Details</span>
            <textarea
              name="body"
              rows={3}
              className="admin-input"
              placeholder="What happened? Who replied? What needs to happen next?"
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 10 }}>
              Response clears the scheduled follow-up. Negotiation moves the opportunity to Negotiating. Other manual activity does not change pipeline status unless noted.
            </span>
            <button type="submit" className="admin-btn-primary">Add Activity</button>
          </div>
        </form>

        {activities.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            No activity has been recorded yet.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 0 }}>
            {activities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px minmax(0, 1fr)',
                  gap: 18,
                  padding: '14px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ color: 'var(--gold)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 5 }}>
                    {MANAGER_ACTIVITY_TYPE_LABELS[activity.activity_type] ?? activity.activity_type}
                  </div>
                  <div className="muted" style={{ fontSize: 10 }}>
                    {fmtTimestamp(activity.occurred_at)}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: activity.body ? 5 : 0 }}>
                    {activity.title}
                  </strong>
                  {activity.body && (
                    <p className="muted" style={{ margin: 0, fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {activity.body}
                    </p>
                  )}
                  {activity.from_status && activity.to_status && (
                    <div className="muted" style={{ marginTop: 5, fontSize: 10 }}>
                      {activity.from_status} → {activity.to_status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div id="edit-opportunity">
        <ManagerOpportunityForm
          action={updateManagerOpportunityAction}
          mode="edit"
          value={opportunity}
        />
      </div>
    </div>
  )
}
