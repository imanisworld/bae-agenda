import type { Metadata } from 'next'
import MixesSection from '@/components/public/MixesSection'

export const metadata: Metadata = {
  title: 'Lab',
  description: 'Bae’s in the Lab. A coming-soon space for recent sets, new drops, and whatever is cooking next from DJ B.A.E.',
  openGraph: {
    title: 'Lab | DJ B.A.E.',
    description: 'Bae’s in the Lab. A coming-soon space for recent sets, new drops, and whatever is cooking next from DJ B.A.E.',
    url: 'https://thebaeagenda.com/lab',
    images: [{ url: '/photos/images/logo.JPG', alt: 'DJ B.A.E. logo artwork' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lab | DJ B.A.E.',
    description: 'Bae’s in the Lab. A coming-soon space for recent sets, new drops, and whatever is cooking next from DJ B.A.E.',
    images: ['/photos/images/logo.JPG'],
  },
}

export default function LabPage() {
  return (
    <div style={{ background: 'var(--off-black)', paddingTop: '68px' }}>
      <MixesSection sectionId={undefined} variant="page" />
    </div>
  )
}
