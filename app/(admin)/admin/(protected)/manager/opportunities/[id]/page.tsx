import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminNotice from '@/components/admin/AdminNotice'
import ManagerOpportunityForm, { type ManagerOpportunityFormValue } from '@/components/admin/ManagerOpportunityForm'
import ManagerStatusBadge from '@/components/admin/ManagerStatusBadge'
import PageHeader from '@/components/admin/PageHeader'
import { updateManagerOpportunityAction } from '@/app/actions/manager'
import {
  MANAGER_OPPORTUNITY_TYPE_LABELS,
  MANAGER_SOURCE_TYPE_LABELS,
  isManagerOpportunityStatus,
  isManagerOpportunityType,
  isManagerSourceType,
} from '@/lib/manager'
import { createAdminClient } from '@/lib/supabase/admin'

type ScoreComponent = { score?: number; max?: number; note?: string }

type OpportunityDetail = ManagerOpportunityFormValue & {
  id: string
  created_at: string
  applied_at: string | null
  last_contacted_at: string | null
  booked_at: string | null
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
}

function getMessage(value: string | string[] | undefined) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
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
  const opportunity = await getOpportunity(id)
  if (!opportunity) notFound()

  const errorMessage = getMessage(query?.error)
  const successMessage = getMessage(query?.success)
  const status = opportunity.status ?? 'found'
  const opportunityType = opportunity.opportunity_type ?? 'other'
  const sourceType = opportunity.source_type ?? 'other'

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
                  <strong style={{ fontSize: 12, fontWeight: 500 }}>{label}</strong>
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

      <ManagerOpportunityForm
        action={updateManagerOpportunityAction}
        mode="edit"
        value={opportunity}
      />
    </div>
  )
}
