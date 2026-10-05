import {
  MANAGER_OPPORTUNITY_STATUSES,
  MANAGER_OPPORTUNITY_TYPE_LABELS,
  MANAGER_OPPORTUNITY_TYPES,
  MANAGER_SOURCE_TYPE_LABELS,
  MANAGER_SOURCE_TYPES,
  MANAGER_STATUS_LABELS,
  type ManagerOpportunityStatus,
  type ManagerOpportunityType,
  type ManagerSourceType,
} from '@/lib/manager'

export interface ManagerOpportunityFormValue {
  id?: string
  title?: string | null
  organization?: string | null
  venue_name?: string | null
  opportunity_type?: ManagerOpportunityType | null
  source_type?: ManagerSourceType | null
  status?: ManagerOpportunityStatus | null
  source_url?: string | null
  source_reference?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  location_address?: string | null
  location_city?: string | null
  location_state?: string | null
  location_country?: string | null
  event_date?: string | null
  application_deadline?: string | null
  compensation_min?: number | null
  compensation_max?: number | null
  compensation_notes?: string | null
  expected_work_hours?: number | null
  estimated_total_hours?: number | null
  estimated_net_pay?: number | null
  effective_hourly_rate?: number | null
  economics_basis?: 'unknown' | 'on_site_gross' | 'all_in_gross' | 'all_in_net' | null
  travel_minutes?: number | null
  travel_miles?: number | null
  travel_cost_estimate?: number | null
  travel_covered?: boolean | null
  lodging_provided?: boolean | null
  equipment_notes?: string | null
  requirements?: string | null
  why_fit?: string | null
  risk_notes?: string | null
  internal_notes?: string | null
  recommended_demo?: string | null
  recommended_demo_reason?: string | null
  fit_score?: number | null
  next_action?: string | null
  next_action_at?: string | null
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    minHeight: 48,
    padding: '11px 13px',
    border: '1px solid var(--border)',
    borderRadius: 10,
    background: 'var(--off-black)',
    color: 'var(--white)',
    fontSize: 13,
    fontFamily: 'DM Sans, sans-serif',
  }
}

function textAreaStyle(): React.CSSProperties {
  return {
    ...inputStyle(),
    minHeight: 112,
    resize: 'vertical',
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="admin-section-title">{children}</span>
}

export default function ManagerOpportunityForm({
  action,
  value = {},
  mode,
}: {
  action: (formData: FormData) => void | Promise<void>
  value?: ManagerOpportunityFormValue
  mode: 'create' | 'edit'
}) {
  const isEdit = mode === 'edit'

  return (
    <form action={action}>
      {value.id && <input type="hidden" name="id" value={value.id} />}

      <section className="admin-section" style={{ padding: 24, marginBottom: 16 }}>
        <div className="admin-section-header" style={{ margin: '-24px -24px 22px' }}>
          <span className="admin-section-title">Opportunity</span>
          <span className="muted">{isEdit ? 'Pipeline record' : 'Manual lead entry'}</span>
        </div>

        <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Title *</FieldLabel>
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={value.title ?? ''}
              placeholder="Nike brand activation, club residency, festival open call..."
              style={inputStyle()}
            />
          </label>

          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Organization / Brand</FieldLabel>
            <input
              name="organization"
              maxLength={200}
              defaultValue={value.organization ?? ''}
              placeholder="Brand, promoter, company, university..."
              style={inputStyle()}
            />
          </label>
        </div>

        <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Type</FieldLabel>
            <select
              name="opportunity_type"
              defaultValue={value.opportunity_type ?? 'dj_gig'}
              style={inputStyle()}
            >
              {MANAGER_OPPORTUNITY_TYPES.map((type) => (
                <option key={type} value={type}>{MANAGER_OPPORTUNITY_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Source</FieldLabel>
            <select
              name="source_type"
              defaultValue={value.source_type ?? 'manual'}
              style={inputStyle()}
            >
              {MANAGER_SOURCE_TYPES.map((type) => (
                <option key={type} value={type}>{MANAGER_SOURCE_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </label>
        </div>

        {isEdit ? (
          <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <FieldLabel>Status</FieldLabel>
              <select name="status" defaultValue={value.status ?? 'found'} style={inputStyle()}>
                {MANAGER_OPPORTUNITY_STATUSES.map((status) => (
                  <option key={status} value={status}>{MANAGER_STATUS_LABELS[status]}</option>
                ))}
              </select>
            </label>

            <div style={{ display: 'grid', gap: 7 }}>
              <FieldLabel>Fit Score</FieldLabel>
              <div
                style={{
                  ...inputStyle(),
                  display: 'flex',
                  alignItems: 'center',
                  color: value.fit_score === null || value.fit_score === undefined ? 'var(--muted)' : 'var(--white)',
                }}
              >
                {value.fit_score === null || value.fit_score === undefined
                  ? 'Calculated automatically'
                  : `${value.fit_score}/100 · recalculates on save`}
              </div>
              <input type="hidden" name="fit_score" value={value.fit_score ?? ''} />
            </div>
          </div>
        ) : (
          <input type="hidden" name="status" value="found" />
        )}

        <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Venue</FieldLabel>
            <input name="venue_name" defaultValue={value.venue_name ?? ''} style={inputStyle()} />
          </label>

          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Source URL</FieldLabel>
            <input
              name="source_url"
              type="url"
              defaultValue={value.source_url ?? ''}
              placeholder="https://..."
              style={inputStyle()}
            />
          </label>
        </div>

        <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
          <FieldLabel>Source Reference</FieldLabel>
          <input
            name="source_reference"
            defaultValue={value.source_reference ?? ''}
            placeholder="Post title, account handle, referral name, search note..."
            style={inputStyle()}
          />
        </label>
      </section>

      <section className="admin-section" style={{ padding: 24, marginBottom: 16 }}>
        <div className="admin-section-header" style={{ margin: '-24px -24px 22px' }}>
          <span className="admin-section-title">Date + Location</span>
        </div>

        <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Event Date</FieldLabel>
            <input name="event_date" type="date" defaultValue={value.event_date ?? ''} style={inputStyle()} />
          </label>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Application Deadline</FieldLabel>
            <input
              name="application_deadline"
              type="date"
              defaultValue={value.application_deadline ?? ''}
              style={inputStyle()}
            />
          </label>
        </div>

        <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
          <FieldLabel>Address</FieldLabel>
          <input name="location_address" defaultValue={value.location_address ?? ''} style={inputStyle()} />
        </label>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 14,
          }}
        >
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>City</FieldLabel>
            <input name="location_city" defaultValue={value.location_city ?? ''} style={inputStyle()} />
          </label>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>State</FieldLabel>
            <input name="location_state" defaultValue={value.location_state ?? ''} style={inputStyle()} />
          </label>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Country</FieldLabel>
            <input name="location_country" defaultValue={value.location_country ?? 'US'} style={inputStyle()} />
          </label>
        </div>
      </section>

      <section className="admin-section" style={{ padding: 24, marginBottom: 16 }}>
        <div className="admin-section-header" style={{ margin: '-24px -24px 22px' }}>
          <span className="admin-section-title">Money + Travel</span>
        </div>

        <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Pay Minimum</FieldLabel>
            <input
              name="compensation_min"
              type="number"
              min={0}
              step="0.01"
              defaultValue={value.compensation_min ?? ''}
              style={inputStyle()}
            />
          </label>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Pay Maximum</FieldLabel>
            <input
              name="compensation_max"
              type="number"
              min={0}
              step="0.01"
              defaultValue={value.compensation_max ?? ''}
              style={inputStyle()}
            />
          </label>
        </div>

        <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
          <FieldLabel>Compensation Notes</FieldLabel>
          <textarea
            name="compensation_notes"
            rows={3}
            defaultValue={value.compensation_notes ?? ''}
            placeholder="Flat fee, hourly, plus tips, travel reimbursement, product only, negotiable..."
            style={textAreaStyle()}
          />
        </label>

        <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
          <FieldLabel>Expected Work Hours</FieldLabel>
          <input
            name="expected_work_hours"
            type="number"
            min={0.25}
            step="0.25"
            defaultValue={value.expected_work_hours ?? ''}
            placeholder="Setup + performance + teardown, excluding travel"
            style={inputStyle()}
          />
          <span className="muted" style={{ fontSize: 11 }}>
            Use the total time you expect to be working on-site. Travel is added separately.
          </span>
        </label>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 14,
            marginBottom: 16,
          }}
        >
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>One-way Travel Minutes</FieldLabel>
            <input
              name="travel_minutes"
              type="number"
              min={0}
              step={1}
              defaultValue={value.travel_minutes ?? ''}
              style={inputStyle()}
            />
          </label>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Travel Miles</FieldLabel>
            <input
              name="travel_miles"
              type="number"
              min={0}
              step="0.1"
              defaultValue={value.travel_miles ?? ''}
              style={inputStyle()}
            />
          </label>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Out-of-pocket Travel Cost</FieldLabel>
            <input
              name="travel_cost_estimate"
              type="number"
              min={0}
              step="0.01"
              defaultValue={value.travel_cost_estimate ?? ''}
              style={inputStyle()}
            />
          </label>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 9, color: 'var(--muted)', fontSize: 12 }}>
            <input name="travel_covered" type="checkbox" defaultChecked={Boolean(value.travel_covered)} />
            Travel covered
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 9, color: 'var(--muted)', fontSize: 12 }}>
            <input name="lodging_provided" type="checkbox" defaultChecked={Boolean(value.lodging_provided)} />
            Lodging provided
          </label>
        </div>
      </section>

      <section className="admin-section" style={{ padding: 24, marginBottom: 16 }}>
        <div className="admin-section-header" style={{ margin: '-24px -24px 22px' }}>
          <span className="admin-section-title">Contact + Requirements</span>
        </div>

        <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Contact Name</FieldLabel>
            <input name="contact_name" defaultValue={value.contact_name ?? ''} style={inputStyle()} />
          </label>
          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Contact Email</FieldLabel>
            <input name="contact_email" type="email" defaultValue={value.contact_email ?? ''} style={inputStyle()} />
          </label>
        </div>

        <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
          <FieldLabel>Contact Phone</FieldLabel>
          <input name="contact_phone" type="tel" defaultValue={value.contact_phone ?? ''} style={inputStyle()} />
        </label>

        <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
          <FieldLabel>Requirements</FieldLabel>
          <textarea name="requirements" rows={5} defaultValue={value.requirements ?? ''} style={textAreaStyle()} />
        </label>

        <label style={{ display: 'grid', gap: 7 }}>
          <FieldLabel>Equipment Notes</FieldLabel>
          <textarea name="equipment_notes" rows={4} defaultValue={value.equipment_notes ?? ''} style={textAreaStyle()} />
        </label>
      </section>

      {isEdit && (
        <section className="admin-section" style={{ padding: 24, marginBottom: 16 }}>
          <div className="admin-section-header" style={{ margin: '-24px -24px 22px' }}>
            <span className="admin-section-title">Manager Assessment</span>
          </div>

          <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
            <FieldLabel>Recommended Demo Mix</FieldLabel>
            <input
              name="recommended_demo"
              defaultValue={value.recommended_demo ?? ''}
              placeholder="Open Format / Nightlife, Lounge / House, Clean Event..."
              style={inputStyle()}
            />
          </label>

          <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
            <FieldLabel>Why This Mix</FieldLabel>
            <textarea
              name="recommended_demo_reason"
              rows={3}
              defaultValue={value.recommended_demo_reason ?? ''}
              placeholder="Why this demo best matches the audience, venue, or opportunity..."
              style={textAreaStyle()}
            />
          </label>

          <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
            <FieldLabel>Why It Fits</FieldLabel>
            <textarea name="why_fit" rows={4} defaultValue={value.why_fit ?? ''} style={textAreaStyle()} />
          </label>

          <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
            <FieldLabel>Risk / Legitimacy Notes</FieldLabel>
            <textarea name="risk_notes" rows={4} defaultValue={value.risk_notes ?? ''} style={textAreaStyle()} />
          </label>

          <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <FieldLabel>Next Action</FieldLabel>
              <input name="next_action" defaultValue={value.next_action ?? ''} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: 7 }}>
              <FieldLabel>Next Action Date</FieldLabel>
              <input name="next_action_at" type="date" defaultValue={value.next_action_at ?? ''} style={inputStyle()} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 7 }}>
            <FieldLabel>Internal Notes</FieldLabel>
            <textarea name="internal_notes" rows={5} defaultValue={value.internal_notes ?? ''} style={textAreaStyle()} />
          </label>
        </section>
      )}

      {!isEdit && (
        <>
          <input type="hidden" name="why_fit" value="" />
          <input type="hidden" name="risk_notes" value="" />
          <input type="hidden" name="internal_notes" value="" />
          <input type="hidden" name="recommended_demo" value="" />
          <input type="hidden" name="recommended_demo_reason" value="" />
          <input type="hidden" name="fit_score" value="" />
          <input type="hidden" name="next_action" value="" />
          <input type="hidden" name="next_action_at" value="" />
        </>
      )}

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn-primary">
          {isEdit ? 'Save Opportunity' : 'Add Opportunity'}
        </button>
        <a href="/admin/manager" className="admin-btn-ghost">Cancel</a>
      </div>
    </form>
  )
}
