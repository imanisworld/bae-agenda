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
    category: 'Ongoing Dates',
    year: '2024–2025',
    location: 'Indianapolis, IN',
    summary: 'Recurring DJ dates at Club Plex — an invite-based nightlife community in Indianapolis. Open format sets built around the room and the crowd, not a set list.',
    highlights: ['Ongoing dates', 'Open format', 'Community venue'],
  },
]

export const PORTFOLIO_HIGHLIGHTS = [
  'Live booking workflow from inquiry to client record',
  'Content-managed homepage copy through a custom admin editor',
  'Public/private separation between bookings and events',
  'Press kit generated from the same site content and showcase data',
]
