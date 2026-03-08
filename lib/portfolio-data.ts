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
    id: 'work-1',
    title: 'Residency Launch Series',
    category: 'Club Residency',
    year: '2025',
    location: 'Chicago, IL',
    summary: 'A recurring nightlife series built around crowd pacing, recognizable transitions, and a tighter visual brand direction.',
    highlights: ['Monthly run', 'High-energy open format', 'Venue-driven curation'],
  },
  {
    id: 'work-2',
    title: 'Private Celebration Run',
    category: 'Private Events',
    year: '2025',
    location: 'Indianapolis, IN',
    summary: 'A package of private bookings designed around custom room reads, clean MC support, and flexible event pacing.',
    highlights: ['Weddings + birthdays', 'Clean transitions', 'Guest-request management'],
  },
  {
    id: 'work-3',
    title: 'Branded Day Party Concept',
    category: 'Brand / Lifestyle',
    year: '2024',
    location: 'Chicago, IL',
    summary: 'Music direction and event shaping for a branded day-party concept balancing familiarity, discovery, and social energy.',
    highlights: ['Brand-aligned music curation', 'Lifestyle audience', 'Cross-genre set design'],
  },
]

export const PORTFOLIO_HIGHLIGHTS = [
  'Live booking workflow from inquiry to client record',
  'Content-managed homepage copy through a custom admin editor',
  'Public/private separation between bookings and events',
  'Press kit generated from the same site content and showcase data',
]
