export const ADMIN_PAGE_SIZE = 25

type PageParam = string | string[] | undefined

export function normalizeAdminPage(value: PageParam) {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number.parseInt(raw ?? '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function paginateRows<T>(rows: T[], requestedPage: number, pageSize = ADMIN_PAGE_SIZE) {
  const safePageSize = Math.max(1, Math.floor(pageSize))
  const totalItems = rows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const page = Math.min(Math.max(1, Math.floor(requestedPage)), totalPages)
  const startIndex = (page - 1) * safePageSize
  const endIndex = Math.min(startIndex + safePageSize, totalItems)

  return {
    items: rows.slice(startIndex, endIndex),
    page,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
  }
}
