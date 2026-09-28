import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import AdminNotice from '@/components/admin/AdminNotice'
import { updateInvoiceDetailsAction } from '@/app/actions/invoices'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface InvoiceEditRow {
  booking_id: string
  status: 'draft' | 'sent' | 'paid' | 'void'
  invoice_number: string
  event_name: string | null
  client_name: string | null
  client_email: string | null
  total_amount: number
  deposit_amount: number
  balance_due: number
}

function getErrorMessage(errorParam: string | string[] | undefined) {
  if (!errorParam) return null
  return Array.isArray(errorParam) ? errorParam[0] ?? null : errorParam
}

async function getInvoice(bookingId: string): Promise<InvoiceEditRow | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('invoices')
    .select('booking_id, status, invoice_number, event_name, client_name, client_email, total_amount, deposit_amount, balance_due')
    .eq('booking_id', bookingId)
    .maybeSingle()

  return (data as InvoiceEditRow | null) ?? null
}

export default async function EditInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ error?: string | string[] }>
}) {
  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) notFound()

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const errorMessage = getErrorMessage(resolvedSearchParams?.error)
  const locked = invoice.status === 'paid' || invoice.status === 'void'

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Edit Invoice"
        subtitle={`#${invoice.invoice_number} · invoice-only changes do not rewrite the booking`}
        action={{ label: 'Back to Invoice', href: `/admin/bookings/${id}/invoice` }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}

      {locked && (
        <AdminNotice
          message={`${invoice.status === 'paid' ? 'Paid' : 'Void'} invoices are locked. Restore a void invoice to Draft before editing.`}
        />
      )}

      <form action={updateInvoiceDetailsAction} className="admin-section invoice-edit-form">
        <input type="hidden" name="booking_id" value={id} />

        <div className="admin-section-header">
          <span className="admin-section-title">Client & Event</span>
          <span className={`invoice-status invoice-status--${invoice.status}`}>
            {invoice.status}
          </span>
        </div>

        <div className="invoice-edit-body">
          <div className="admin-form-grid-two">
            <label>
              <span className="admin-field-label">Client Name</span>
              <input
                name="client_name"
                required
                defaultValue={invoice.client_name ?? ''}
                disabled={locked}
              />
            </label>

            <label>
              <span className="admin-field-label">Client Email</span>
              <input
                name="client_email"
                type="email"
                required
                defaultValue={invoice.client_email ?? ''}
                disabled={locked}
              />
            </label>
          </div>

          <label>
            <span className="admin-field-label">Event / Invoice Description</span>
            <input
              name="event_name"
              required
              defaultValue={invoice.event_name ?? ''}
              disabled={locked}
            />
          </label>

          <div className="admin-form-grid-two">
            <label>
              <span className="admin-field-label">Invoice Total</span>
              <input
                name="total_amount"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={Number(invoice.total_amount ?? 0)}
                disabled={locked}
              />
            </label>

            <label>
              <span className="admin-field-label">Deposit / Credit</span>
              <input
                name="deposit_amount"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={Number(invoice.deposit_amount ?? 0)}
                disabled={locked}
              />
            </label>
          </div>

          <div className="invoice-edit-summary">
            <span>Current balance</span>
            <strong>
              {Number(invoice.balance_due ?? 0).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}
            </strong>
            <p>
              Saving recalculates the balance. If this invoice was already sent, editing it resets it to Draft so you can review and resend the corrected version.
            </p>
          </div>

          <div className="admin-form-actions">
            {!locked && (
              <button type="submit" className="admin-btn-primary">
                Save Invoice Changes
              </button>
            )}
            <Link href={`/admin/bookings/${id}/invoice`} className="admin-btn-ghost">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
