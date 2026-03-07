/**
 * SHARED UTILITIES
 * Formatting helpers used across public and admin UI.
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

// ---- Tailwind class merging --------------------------------
// Merges Tailwind classes and resolves conflicts.
// Usage: cn('text-sm text-red-500', condition && 'text-blue-500')
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---- Date formatting ---------------------------------------
export function formatDate(date: string | Date, pattern = 'MMM d, yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern)
}

export function formatDateShort(date: string | Date) {
  return formatDate(date, 'MMM d')
}

export function formatDateLong(date: string | Date) {
  return formatDate(date, 'EEEE, MMMM d, yyyy')
}

export function formatRelative(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

// ---- Currency formatting -----------------------------------
export function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ---- Text helpers ------------------------------------------
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function truncate(text: string, length = 100) {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '…'
}

export function initials(firstName: string, lastName?: string | null) {
  return [firstName[0], lastName?.[0]].filter(Boolean).join('').toUpperCase()
}
