import { describe, expect, it } from 'vitest'
import { normalizeAdminPage, paginateRows } from './admin-pagination'

describe('admin pagination', () => {
  it('normalizes invalid page values to page one', () => {
    expect(normalizeAdminPage(undefined)).toBe(1)
    expect(normalizeAdminPage('0')).toBe(1)
    expect(normalizeAdminPage('-2')).toBe(1)
    expect(normalizeAdminPage('abc')).toBe(1)
    expect(normalizeAdminPage(['3', '4'])).toBe(3)
  })

  it('returns 25 rows per page by default', () => {
    const rows = Array.from({ length: 61 }, (_, index) => index + 1)
    const result = paginateRows(rows, 2)

    expect(result.items).toEqual(Array.from({ length: 25 }, (_, index) => index + 26))
    expect(result.page).toBe(2)
    expect(result.totalPages).toBe(3)
    expect(result.totalItems).toBe(61)
    expect(result.startIndex).toBe(25)
    expect(result.endIndex).toBe(50)
  })

  it('clamps page requests past the final page', () => {
    const result = paginateRows(['a', 'b', 'c'], 9, 2)

    expect(result.page).toBe(2)
    expect(result.items).toEqual(['c'])
  })
})
