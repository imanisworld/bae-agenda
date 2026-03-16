/**
 * APP CONSTANTS
 * Centralized values used across the codebase.
 * Avoids magic strings scattered throughout components.
 */

// ---- Navigation --------------------------------------------
export const PUBLIC_NAV = [
  { label: 'Home',    href: '/'         },
  { label: 'Mixes',   href: '/#mixes'   },
  { label: 'Events',  href: '/#events'  },
  { label: 'Meet',    href: '/meet'     },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Book',    href: '/book' },
  { label: 'Connect', href: '/#connect' },
] as const

export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '⊞'  },
  { label: 'Bookings',  href: '/admin/bookings',  icon: '📋' },
  { label: 'Events',    href: '/admin/events',    icon: '📅' },
  { label: 'Mixes',     href: '/admin/mixes',     icon: '🎚️' },
  { label: 'Clients',   href: '/admin/clients',   icon: '👤' },
  { label: 'Payments',  href: '/admin/payments',  icon: '💰' },
  { label: 'Content',   href: '/admin/content',   icon: '✏️' },
] as const

// ---- Booking -----------------------------------------------
export const BOOKING_STATUSES = ['inquiry', 'confirmed', 'completed', 'cancelled'] as const

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  inquiry:   'Inquiry',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// CSS color values for the Badge component (inline styles, not Tailwind utilities)
export const BOOKING_STATUS_COLORS: Record<string, string> = {
  inquiry:   'var(--gold)',
  confirmed: 'var(--violet)',
  completed: '#34d399',
  cancelled: '#e85d75',
}

// ---- Packages ----------------------------------------------
export const PACKAGES = [
  { name: '$300 / Hour', price: 300, hours: 1, desc: 'Simple hourly booking for events that need flexible timing and a clean rate up front.' },
  { name: 'Pick Your Event', price: null, hours: 1, desc: 'Tell us what you are planning and we will build the right format, timing, and setup around it.' },
] as const

// ---- Event Types -------------------------------------------
export const EVENT_TYPES = [
  'Birthday / Private Party',
  'Wedding',
  'Corporate Event',
  'Club / Venue Night',
  'Brunch / Day Party',
  'Other',
] as const

// ---- Payment -----------------------------------------------
export const PAYMENT_METHODS = ['cash', 'venmo', 'zelle', 'stripe', 'check', 'ach', 'other'] as const
export const PAYMENT_TYPES   = ['deposit', 'balance', 'full', 'refund'] as const

// ---- Socials -----------------------------------------------
export const SOCIALS = [
  { label: 'Instagram', url: 'https://www.instagram.com/dj_b.a.e/',                      icon: '📸' },
  { label: 'TikTok',    url: 'https://www.tiktok.com/@djbae1',                            icon: '🎵' },
  { label: 'YouTube',   url: 'https://www.youtube.com/channel/UCjEiMW5l_Go9vSHudx5VPEw', icon: '▶️' },
  { label: 'SoundCloud',url: 'https://soundcloud.com/deejaybae',                           icon: '☁️' },
  { label: 'Facebook',  url: 'https://www.facebook.com/480641485716491',                  icon: '👤' },
  { label: 'dot.cards', url: 'https://dot.cards/djbae',                                   icon: '🔗' },
] as const
