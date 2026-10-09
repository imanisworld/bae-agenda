/**
 * APP CONSTANTS
 * Centralized values used across the codebase.
 * Avoids magic strings scattered throughout components.
 */

// ---- Navigation --------------------------------------------
export const PUBLIC_NAV = [
  { label: 'Home',      href: '/'          },
  { label: 'Events',    href: '/events'    },
  { label: 'Lab',       href: '/lab'       },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Meet',      href: '/meet'      },
  { label: 'Book',      href: '/book'      },
] as const

/** Pages that exist outside the dock. Shown in the More menu and the footer. */
export const PUBLIC_SECONDARY_NAV = [
  { label: 'Contact',       href: '/book#contact' },
  { label: 'Built',         href: '/built'        },
  { label: 'Press Kit',     href: '/press-kit'    },
] as const

export const PUBLIC_LEGAL_NAV = [
  { label: 'Privacy',       href: '/privacy'       },
  { label: 'Terms',         href: '/terms'         },
  { label: 'Accessibility', href: '/accessibility' },
] as const

export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '⊞'  },
  { label: 'Manager',   href: '/admin/manager',   icon: 'MG' },
  { label: 'Bookings',  href: '/admin/bookings',  icon: '📋' },
  { label: 'Invoices',  href: '/admin/invoices',  icon: 'INV' },
  { label: 'Events',    href: '/admin/events',    icon: '📅' },
  { label: 'Mixes',     href: '/admin/mixes',     icon: '🎚️' },
  { label: 'Portfolio', href: '/admin/portfolio', icon: '🎤' },
  { label: 'Clients',   href: '/admin/clients',   icon: '👤' },
  { label: 'Payments',  href: '/admin/payments',  icon: '💰' },
  { label: 'Reviews',   href: '/admin/reviews',   icon: '★'  },
  { label: 'Content',   href: '/admin/content',   icon: '✏️' },
  { label: 'W-9',       href: '/admin/w9',        icon: '📄' },
] as const

// ---- Booking -----------------------------------------------
export const BOOKING_STATUSES = ['inquiry', 'confirmed', 'completed', 'cancelled'] as const
export const BOOKING_LIFECYCLE_STATUSES = ['new', 'contacted', 'negotiating', 'confirmed', 'completed', 'lost'] as const
export const BOOKING_WORKFLOW_PAYMENT_STATUSES = ['unpaid', 'deposit_requested', 'deposit_paid', 'balance_requested', 'paid'] as const

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  inquiry:   'Inquiry',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const BOOKING_LIFECYCLE_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  negotiating: 'Negotiating',
  confirmed: 'Confirmed',
  completed: 'Completed',
  lost: 'Lost',
}

// CSS color values for the Badge component (inline styles, not Tailwind utilities)
export const BOOKING_STATUS_COLORS: Record<string, string> = {
  inquiry:   'var(--gold)',
  confirmed: 'var(--violet)',
  completed: '#34d399',
  cancelled: '#e85d75',
}

export const BOOKING_WORKFLOW_PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Unpaid',
  deposit_requested: 'Deposit Requested',
  deposit_paid: 'Deposit Paid',
  balance_requested: 'Balance Requested',
  paid: 'Paid',
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
export const PAYMENT_METHODS = ['cash', 'venmo', 'zelle', 'cash_app', 'stripe', 'check', 'ach', 'other'] as const
export const PAYMENT_TYPES   = ['deposit', 'balance', 'full', 'refund'] as const

// ---- Socials -----------------------------------------------
// ---- Lab crates ------------------------------------------
// Public SoundCloud playlists the Lab reads live. Add a track to one of these
// on SoundCloud and it appears in the Lab — no admin entry needed.
export const LAB_CRATES = [
  { key: 'mixes',   label: 'Mixes / Full Sets',        url: 'https://soundcloud.com/deejaybae/sets/mixes'   },
  { key: 'mashups', label: 'Mashups / Experiments',     url: 'https://soundcloud.com/deejaybae/sets/mashups' },
] as const

export const SOCIALS = [
  { label: 'Instagram', url: 'https://www.instagram.com/dj_b.a.e/',                      icon: 'IG' },
  { label: 'TikTok',    url: 'https://www.tiktok.com/@djbae1',                            icon: 'TT' },
  { label: 'YouTube',   url: 'https://www.youtube.com/@djb.a.e',                         icon: 'YT' },
  { label: 'SoundCloud',url: 'https://soundcloud.com/deejaybae',                           icon: 'SC' },
  { label: 'Facebook',  url: 'https://www.facebook.com/480641485716491',                  icon: 'FB' },
  { label: 'dot.cards', url: 'https://dot.cards/djbae',                                   icon: 'DC' },
] as const
