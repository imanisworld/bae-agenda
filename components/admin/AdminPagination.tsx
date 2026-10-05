import Link from 'next/link'
import { ADMIN_PAGE_SIZE } from '@/lib/admin-pagination'

interface AdminPaginationProps {
  pathname: string
  page: number
  totalPages: number
  totalItems: number
  pageSize?: number
  params?: Record<string, string | undefined>
  hash?: string
}

function pageHref(
  pathname: string,
  targetPage: number,
  params: Record<string, string | undefined>,
  hash?: string,
) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value)
  }

  if (targetPage > 1) query.set('page', String(targetPage))

  const suffix = query.toString()
  return `${pathname}${suffix ? `?${suffix}` : ''}${hash ? `#${hash}` : ''}`
}

export default function AdminPagination({
  pathname,
  page,
  totalPages,
  totalItems,
  pageSize = ADMIN_PAGE_SIZE,
  params = {},
  hash,
}: AdminPaginationProps) {
  if (totalItems === 0 || totalPages <= 1) return null

  const firstItem = (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, totalItems)

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        paddingTop: 16,
      }}
    >
      <span className="muted" style={{ fontSize: 11 }}>
        {firstItem}–{lastItem} of {totalItems} · Page {page} of {totalPages}
      </span>

      <div style={{ display: 'flex', gap: 8 }}>
        {page > 1 ? (
          <Link
            href={pageHref(pathname, page - 1, params, hash)}
            className="admin-btn-ghost"
          >
            Previous
          </Link>
        ) : (
          <span className="admin-btn-ghost" aria-disabled="true" style={{ opacity: 0.45 }}>
            Previous
          </span>
        )}

        {page < totalPages ? (
          <Link
            href={pageHref(pathname, page + 1, params, hash)}
            className="admin-btn-ghost"
          >
            Next
          </Link>
        ) : (
          <span className="admin-btn-ghost" aria-disabled="true" style={{ opacity: 0.45 }}>
            Next
          </span>
        )}
      </div>
    </nav>
  )
}
