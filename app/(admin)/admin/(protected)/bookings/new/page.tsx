import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import AdminNotice from '@/components/admin/AdminNotice'
import EventLocationFields from '@/components/admin/EventLocationFields'
import { createAdminBookingAction } from '@/app/actions/bookings'
import { EVENT_TYPES, PACKAGES } from '@/lib/constants'

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

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[] }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const errorMessage = getErrorMessage(resolvedSearchParams?.error)

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="New Booking"
        subtitle="Add a client booking directly to the control room."
        action={{ label: 'Back to Bookings', href: '/admin/bookings' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}

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
                <input name="first_name" required autoComplete="given-name" style={inputStyle()} />
              </label>
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Last Name</span>
                <input name="last_name" autoComplete="family-name" style={inputStyle()} />
              </label>
            </div>

            <div className="admin-form-grid-two">
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Email *</span>
                <input name="email" type="email" required autoComplete="email" style={inputStyle()} />
              </label>
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Phone</span>
                <input name="phone" type="tel" autoComplete="tel" style={inputStyle()} />
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
                <input name="event_date" type="date" required style={inputStyle()} />
              </label>
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="admin-field-label">Start Time *</span>
                <input name="event_time" type="time" step={900} required style={inputStyle()} />
              </label>
            </div>

            <label style={{ display: 'grid', gap: '7px', maxWidth: 'calc(50% - 6px)' }}>
              <span className="admin-field-label">End Time</span>
              <input name="event_end_time" type="time" step={900} style={inputStyle()} />
            </label>

            <EventLocationFields
              initialCity="Indianapolis, IN"
              initialTimeZone="America/Indiana/Indianapolis"
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
                <input name="hours" type="number" min="0.5" step="0.5" style={inputStyle()} />
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
              <Link href="/admin/bookings" className="admin-btn-ghost">
                Cancel
              </Link>
            </div>
          </div>
        </section>
      </form>
    </div>
  )
}
