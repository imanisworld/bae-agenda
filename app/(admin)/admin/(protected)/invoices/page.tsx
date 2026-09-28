import type { CSSProperties } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import SendInvoiceButton from '@/components/admin/SendInvoiceButton'
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton'
import { restoreInvoiceDraftAction, voidInvoiceAction } from '@/app/actions/invoices'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatInvoiceDueDate } from '@/lib/invoices'

export const dynamic = 'force-dynamic'

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void'
type InvoiceFilterKey = 'all' | InvoiceStatus

interface InvoiceRow {
  id: string
  booking_id: string
  status: InvoiceStatus
  invoice_number: string
  event_name: string | null
  client_name: string | null
  client_email: string | null
  total_amount: number
  deposit_amount: number
  balance_due: number
  due_date: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

const FILTERS: Array<{ key: InvoiceFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'void', label: 'Void' },
]

function fmtCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

function fmtDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function matchesInvoiceSearch(invoice: InvoiceRow, query: string) {
  if (!query) return true
  const haystack = [
    invoice.invoice_number,
    invoice.client_name,
    invoice.client_email,
    invoice.event_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(query.toLowerCase())
}

function invoiceListHref(status: InvoiceFilterKey, query = '') {
  const params = new URLSearchParams()
  if (status !== 'all') params.set('status', status)
  if (query) params.set('q', query)
  const suffix = params.toString()
  return `/admin/invoices${suffix ? `?${suffix}` : ''}`
}

async function getInvoices(): Promise<InvoiceRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('invoices')
      .select('id, booking_id, status, invoice_number, event_name, client_name, client_email, total_amount, deposit_amount, balance_due, due_date, sent_at, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message || 'Unable to load invoices.')
    return (data ?? []) as InvoiceRow[]
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to load invoices.')
  }
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string | string[]; q?: string | string[] }>
}) {
  const invoices = await getInvoices()
  const params = searchParams ? await searchParams : undefined
  const requestedStatus = singleParam(params?.status)
  const query = singleParam(params?.q).trim()
  const activeStatus: InvoiceFilterKey = FILTERS.some((filter) => filter.key === requestedStatus)
    ? requestedStatus as InvoiceFilterKey
    : 'all'

  const searchedInvoices = invoices.filter((invoice) => matchesInvoiceSearch(invoice, query))
  const visibleInvoices = activeStatus === 'all'
    ? searchedInvoices
    : searchedInvoices.filter((invoice) => invoice.status === activeStatus)

  const outstanding = invoices
    .filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'void')
    .reduce((sum, invoice) => sum + Number(invoice.balance_due ?? 0), 0)

  const paidTotal = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + Number(invoice.total_amount ?? 0), 0)

  return (
    <div className="admin-page">
      <PageHeader
        title="Invoices"
        subtitle={invoices.length ? `${invoices.length} total · ${fmtCurrency(outstanding)} outstanding` : 'Create and manage client invoices'}
        action={{ label: 'Create Invoice', href: '/admin/invoices/new' }}
      />

      {invoices.length > 0 && (
        <div className="admin-summary-grid">
          <div className="admin-money-card" style={{ '--admin-money-color': '#d9bc89' } as CSSProperties}>
            <span>Outstanding</span>
            <strong>{fmtCurrency(outstanding)}</strong>
          </div>
          <div className="admin-money-card" style={{ '--admin-money-color': '#86d8a8' } as CSSProperties}>
            <span>Paid</span>
            <strong>{fmtCurrency(paidTotal)}</strong>
          </div>
          <div className="admin-money-card">
            <span>Drafts</span>
            <strong>{invoices.filter((invoice) => invoice.status === 'draft').length}</strong>
          </div>
        </div>
      )}

      <div className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">
            {query ? `Invoice Register · ${visibleInvoices.length} matching` : 'Invoice Register'}
          </span>
        </div>

        {invoices.length > 0 && (
          <div className="admin-list-tools">
            <form method="GET" action="/admin/invoices" className="admin-search-form">
              {activeStatus !== 'all' ? <input type="hidden" name="status" value={activeStatus} /> : null}
              <input
                id="invoice-search"
                type="search"
                aria-label="Search invoices"
                name="q"
                defaultValue={query}
                className="admin-search-input"
                placeholder="Search invoice, client, email, or event…"
              />
              <button type="submit" className="admin-search-submit">Search</button>
              {query ? (
                <Link href={invoiceListHref(activeStatus)} className="admin-search-clear">
                  Clear
                </Link>
              ) : null}
            </form>

            <nav aria-label="Filter invoices by status" className="admin-filter-chips">
              {FILTERS.map((filter) => {
                const count = filter.key === 'all'
                  ? searchedInvoices.length
                  : searchedInvoices.filter((invoice) => invoice.status === filter.key).length
                const active = filter.key === activeStatus

                return (
                  <Link
                    key={filter.key}
                    href={invoiceListHref(filter.key, query)}
                    className={active ? 'admin-filter-chip admin-filter-chip-active' : 'admin-filter-chip'}
                    aria-current={active ? 'true' : undefined}
                  >
                    {filter.label}
                    <span className="admin-filter-chip-count">{count}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}

        {invoices.length === 0 ? (
          <AdminEmptyState
            title="No invoices yet"
            desc="Create an invoice from an existing booking. The booking supplies the client, event, quote, deposit, and balance."
            action={{ label: 'Create First Invoice', href: '/admin/invoices/new' }}
          />
        ) : visibleInvoices.length === 0 ? (
          <AdminEmptyState
            title={query ? 'No matching invoices' : `No ${activeStatus} invoices`}
            desc={query ? `Nothing matches “${query}” in this view.` : 'Nothing matches this filter right now.'}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stack invoices-admin-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client / Event</th>
                  <th>Total</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>Sent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td data-label="Invoice">
                      <div className="invoice-number">#{invoice.invoice_number}</div>
                      <div className="muted">{fmtDate(invoice.created_at)}</div>
                    </td>
                    <td data-label="Client / Event">
                      <div>{invoice.client_name ?? 'Client'}</div>
                      <div className="muted">{invoice.event_name ?? 'Event'}</div>
                    </td>
                    <td data-label="Total">{fmtCurrency(Number(invoice.total_amount ?? 0))}</td>
                    <td data-label="Balance">
                      <span className={Number(invoice.balance_due ?? 0) > 0 ? 'invoice-balance-due' : ''}>
                        {fmtCurrency(Number(invoice.balance_due ?? 0))}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={`invoice-status invoice-status--${invoice.status}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td data-label="Due" className="muted">
                      {formatInvoiceDueDate(invoice.due_date) ?? '—'}
                    </td>
                    <td data-label="Sent" className="muted">{fmtDate(invoice.sent_at)}</td>
                    <td data-label="Actions">
                      <div className="invoice-actions">
                        <Link href={`/admin/bookings/${invoice.booking_id}/invoice`} className="admin-btn-ghost">
                          Open
                        </Link>
                        {invoice.status !== 'paid' && invoice.status !== 'void' && (
                          <Link href={`/admin/bookings/${invoice.booking_id}/invoice/edit`} className="admin-btn-ghost">
                            Edit
                          </Link>
                        )}
                        <a href={`/api/invoice/${invoice.booking_id}`} download className="admin-btn-ghost">
                          PDF
                        </a>
                        {invoice.status !== 'paid' && invoice.status !== 'void' && (
                          <>
                            <SendInvoiceButton
                              bookingId={invoice.booking_id}
                              clientEmail={invoice.client_email}
                              className="admin-btn-ghost"
                              label={invoice.sent_at ? 'Resend' : 'Send'}
                            />
                            {invoice.status === 'sent' && Number(invoice.balance_due ?? 0) > 0 && (
                              <SendInvoiceButton
                                bookingId={invoice.booking_id}
                                clientEmail={invoice.client_email}
                                className="admin-btn-ghost"
                                label="Reminder"
                                mode="reminder"
                              />
                            )}
                            <form action={voidInvoiceAction}>
                              <input type="hidden" name="booking_id" value={invoice.booking_id} />
                              <ConfirmSubmitButton
                                message="Void this invoice? You can restore it later, but it will stop being active."
                                className="admin-btn-danger"
                              >
                                Void
                              </ConfirmSubmitButton>
                            </form>
                          </>
                        )}
                        {invoice.status === 'void' && (
                          <form action={restoreInvoiceDraftAction}>
                            <input type="hidden" name="booking_id" value={invoice.booking_id} />
                            <button type="submit" className="admin-btn-ghost">
                              Restore
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
