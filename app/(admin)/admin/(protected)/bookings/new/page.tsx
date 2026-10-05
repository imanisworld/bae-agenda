import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import AdminNotice from '@/components/admin/AdminNotice'
import EventLocationFields from '@/components/admin/EventLocationFields'
import { createAdminBookingAction } from '@/app/actions/bookings'
import { EVENT_TYPES, PACKAGES } from '@/lib/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildManagerBookingPrefill, type ManagerBookingSource } from '@/lib/manager-booking'

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    minHeight: '48px',
    padding: '11px 13px',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    background: 'var(--off-black)',
    color: 'var(--white)',
    fontSize: '13px',
    fontFamily: 'DM Sans, sans-serif',
  }
}

function getErrorMessage(errorParam: string | string[] | undefined) {
  if (!errorParam) return null
  return Array.isArray(errorParam) ? errorParam[0] ?? null : errorParam
}

function getStringParam(value: string | string[] | undefined) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function isUuid(value: string | null): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

async function getManagerOpportunity(id: string | null) {
  if (!isUuid(id)) return null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('manager_opportunities')
    .select('id, title, organization, venue_name, contact_name, contact_email, contact_phone, location_city, location_state, event_date, expected_work_hours, compensation_min, source_url, linked_booking_id')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return data as ManagerBookingSource
}

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[]; opportunity?: string | string[] }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const errorMessage = getErrorMessage(resolvedSearchParams?.error)
  const opportunityId = getStringParam(resolvedSearchParams?.opportunity)
  const managerOpportunity = await getManagerOpportunity(opportunityId)
  const prefill = managerOpportunity ? buildManagerBookingPrefill(managerOpportunity) : null
  const backHref = managerOpportunity
    ? `/admin/manager/opportunities/${managerOpportunity.id}`
    : '/admin/bookings'

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="New Booking"
        subtitle={managerOpportunity ? 'Review the Manager lead, fill any missing booking details, then create the booking.' : 'Add a client booking directly to the control room.'}
        action={{ label: managerOpportunity ? 'Back to Opportunity' : 'Back to Bookings', href: backHref }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}

      {managerOpportunity && (
        <div className="admin-preview-banner" style={{ marginBottom: '18px' }}>
          <span className="admin-preview-mark" aria-hidden="true">↗</span>
          <div>
            <div className="admin-preview-title">Prefilled from Manager</div>
            <p>
              Known details were copied from {managerOpportunity.title}. Missing client, time, or pricing details must still be reviewed before saving.
            </p>
          </div>
        </div>
      )}

      <div className="admin-preview-banner" style={{ marginBottom: '18px' }}>
        <span className="admin-preview-mark" aria-hidden="true">+</span>
        <div>
          <div className="admin-preview-title">Private admin record</div>
          <p>
            Creating this booking does not email the client or publish a public event.
            Review it first, then confirm the booking or create an Event when you are ready.
          </p>
        </div>
      </div>

      <form action={createAdminBookingAction} className="admin-form-grid">
        {managerOpportunity && (
          <input type="hidden" name="manager_opportunity_id" value={managerOpportunity.id} />
        )}
        <section className="admin-section" style={{ padding: '24px' }}>
          <div className="admin-section-header" style={{ padding: 0, marginBottom: '20px' }}>
            <div>
              <span className="admin-section-title">Client</span>
              <p className="muted" style={{ margin: '6px 0 0', fontSize: '12px', lineHeight: 1.6 }}>
                Existing clients are matched by email so you do not create duplicates.
              </p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-form-grid-two">
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">First Name *</span>
                <input name="first_name" required autoComplete="given-name" defaultValue={prefill?.firstName ?? ''} style={inputStyle()} />
              </label>
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Last Name</span>
                <input name="last_name" autoComplete="family-name" defaultValue={prefill?.lastName ?? ''} style={inputStyle()} />
              </label>
            </div>

            <div className="admin-form-grid-two">
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Email *</span>
                <input name="email" type="email" required autoComplete="email" defaultValue={prefill?.email ?? ''} style={inputStyle()} />
              </label>
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Phone</span>
                <input name="phone" type="tel" autoComplete="tel" defaultValue={prefill?.phone ?? ''} style={inputStyle()} />
              </label>
            </div>
          </div>
        </section>

        <section className="admin-section" style={{ padding: '24px' }}>
          <div className="admin-section-header" style={{ padding: 0, marginBottom: '20px' }}>
            <div>
              <span className="admin-section-title">Event Details</span>
              <p className="muted" style={{ margin: '6px 0 0', fontSize: '12px', lineHeight: 1.6 }}>
                These are the private booking details. They can later be copied into a public Event.
              </p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-form-grid-two">
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Event Name *</span>
                <input
                  name="event_name"
                  required
                  placeholder="60th Birthday, Wedding Reception…"
                  defaultValue={prefill?.eventName ?? ''}
                  style={inputStyle()}
                />
              </label>

              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Event Type</span>
                <select name="event_type" defaultValue="" style={inputStyle()}>
                  <option value="">Select type</option>
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-form-grid-two">
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Event Date *</span>
                <input name="event_date" type="date" required defaultValue={prefill?.eventDate ?? ''} style={inputStyle()} />
              </label>
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Start Time *</span>
                <input name="event_time" type="time" step={900} required style={inputStyle()} />
              </label>
            </div>

            <label style={{ display: 'grid', gap: '7px', maxWidth: 'calc(50% - 6px)' }}>
              <span className="admin-field-label">End Time</span>
              <input name="event_end_time" type="time" step={900} style={inputStyle()} />
              <span className="muted" style={{ fontSize: '11px', lineHeight: 1.5 }}>
                If the end time is earlier than the start time, it is treated as the next day.
              </span>
            </label>

            <EventLocationFields
              initialVenue={prefill?.venue ?? ''}
              initialCity={prefill?.city || 'Indianapolis, IN'}
              initialTimeZone={prefill?.timeZone || (prefill?.city ? '' : 'America/Indiana/Indianapolis')}
            />
          </div>
        </section>

        <section className="admin-section" style={{ padding: '24px' }}>
          <div className="admin-section-header" style={{ padding: 0, marginBottom: '20px' }}>
            <div>
              <span className="admin-section-title">Pricing & Scope</span>
              <p className="muted" style={{ margin: '6px 0 0', fontSize: '12px', lineHeight: 1.6 }}>
                Add what you know now. Quote and deposit can be changed later before invoicing.
              </p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-form-grid-two">
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Package</span>
                <input
                  name="package"
                  list="admin-booking-package-options"
                  placeholder="Package or custom service"
                  style={inputStyle()}
                />
                <datalist id="admin-booking-package-options">
                  {PACKAGES.map((pkg) => <option key={pkg.name} value={pkg.name} />)}
                </datalist>
              </label>

              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Hours</span>
                <input name="hours" type="number" min="0.5" step="0.5" defaultValue={prefill?.hours ?? ''} style={inputStyle()} />
              </label>
            </div>

            <div className="admin-form-grid-two">
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Quote</span>
                <input
                  name="quote"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  defaultValue={prefill?.quote ?? ''}
                  style={inputStyle()}
                />
              </label>

              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Deposit Amount</span>
                <input
                  name="deposit_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  style={inputStyle()}
                />
              </label>
            </div>

            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-field-label">Internal / Booking Notes</span>
              <textarea
                name="notes"
                rows={5}
                placeholder="Setup details, client requests, source of booking, follow-up notes…"
                defaultValue={prefill?.notes ?? ''}
                style={{ ...inputStyle(), minHeight: '120px', resize: 'vertical' }}
              />
            </label>
          </div>
        </section>

        <section className="admin-section" style={{ padding: '20px 24px' }}>
          <div className="admin-form-grid-two-wide" style={{ alignItems: 'center' }}>
            <div>
              <span className="admin-field-label">Initial Status</span>
              <strong style={{ display: 'block', color: 'var(--white)', fontSize: '14px', marginBottom: '5px' }}>
                New inquiry
              </strong>
              <p className="muted" style={{ margin: 0, fontSize: '11px', lineHeight: 1.6 }}>
                No confirmation email or invoice is sent automatically. Open the booking afterward and confirm it when ready.
              </p>
            </div>

            <div className="admin-form-actions" style={{ justifyContent: 'flex-end' }}>
              <button type="submit" className="admin-btn-primary">
                Create Booking
              </button>
              <Link href={backHref} className="admin-btn-ghost">
                Cancel
              </Link>
            </div>
          </div>
        </section>
      </form>
    </div>
  )
}
