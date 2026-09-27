export interface SelectedWorkItem {
  id: string
  title: string
  category: string
  year: string
  location: string
  summary: string
  highlights: string[]
}

export const SELECTED_WORK: SelectedWorkItem[] = [
  {
    id: 'work-chi-chis',
    title: "Chi Chi's",
    category: 'Recurring Night',
    year: '2025',
    location: 'Indianapolis, IN',
    summary: "A recurring nightlife series centering Black queer women — parties open to everyone. Built on community, good music, and a room that knows how to move. Started May 8, 2025.",
    highlights: ['Monthly run', 'Community-centered', 'Blind Tiger Indy'],
  },
  {
    id: 'work-bae-billions',
    title: 'Bae & Billion$',
    category: 'Show / Series',
    year: '2024',
    location: 'Indianapolis, IN',
    summary: 'A social function for melomaniacs with taste. Mixes, conversations, reviews, and more — a space built for people who take music seriously.',
    highlights: ['Live DJ sets', 'Music conversations', 'Community screening'],
  },
  {
    id: 'work-1',
    title: 'Club Plex',
    category: 'Nightlife',
    year: '2024–2025',
    location: 'Indianapolis, IN',
    summary: 'DJ appearances at Club Plex in Indianapolis, with open-format sets built around the room and the crowd.',
    highlights: ['Nightlife', 'Open format', 'Indianapolis'],
  },
]

// ── DJ Portfolio — Gig History ──────────────────────────────────────────────

export interface GigItem {
  id:       string
  title:    string
  venue:    string
  city:     string
  date:     string      // display string, e.g. "May 8, 2025"
  year:     string
  tags:     string[]
  featured: boolean
}

export const GIG_HISTORY: GigItem[] = [
  {
    id:       'gig-chi-chis',
    title:    "Chi Chi's",
    venue:    'Blind Tiger Indy',
    city:     'Indianapolis, IN',
    date:     'May 2025 — Ongoing',
    year:     '2025',
    tags:     ['Recurring Night', 'Community', 'Open Format'],
    featured: true,
  },
  {
    id:       'gig-bae-billions',
    title:    'Bae & Billion$',
    venue:    'Various',
    city:     'Indianapolis, IN',
    date:     '2024',
    year:     '2024',
    tags:     ['Show / Series', 'Music Culture', 'Live Sets'],
    featured: true,
  },
  {
    id:       'gig-club-plex',
    title:    'Club Plex',
    venue:    'Club Plex',
    city:     'Indianapolis, IN',
    date:     '2024 — 2025',
    year:     '2024',
    tags:     ['Open Format', 'Nightlife'],
    featured: false,
  },
]

// ── Press Photos ────────────────────────────────────────────────────────────

export interface PressPhoto {
  id:  string
  src: string
  alt: string
}

export const PRESS_PHOTOS: PressPhoto[] = [
  {
    id:  'press-plex-mix',
    src: '/photos/PlexMix19-DJBAE.JPEG',
    alt: 'DJ B.A.E. performing at Club Plex Mix 19',
  },
]

// ── Website Build Highlights ────────────────────────────────────────────────

export const PORTFOLIO_HIGHLIGHTS = [
  'Live booking workflow from inquiry to client record',
  'Content-managed homepage copy through a custom admin editor',
  'Public/private separation between bookings and events',
  'Press kit generated from the same site content and showcase data',
]
