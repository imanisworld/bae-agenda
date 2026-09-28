import type { Metadata } from 'next'
import LabListeningStation, { type ListeningMix } from '@/components/public/LabListeningStation'
import { getPublishedMixes } from '@/lib/db/mixes'

const LAB_OG_IMAGE = '/photos/images/outside.jpg'
const LAB_TITLE = 'DJ B.A.E. Mixes | Bae’s in the Lab'

export const metadata: Metadata = {
  title: { absolute: LAB_TITLE },
  alternates: { canonical: '/lab' },
  description: 'Listen to DJ B.A.E. mixes, open-format sets, mashups, and edits from Bae’s in the Lab.',
  openGraph: {
    title: LAB_TITLE,
    description: 'DJ B.A.E. mixes, open-format sets, mashups, and edits from Bae’s in the Lab.',
    url: 'https://thebaeagenda.com/lab',
    images: [{ url: LAB_OG_IMAGE, width: 1565, height: 1037, alt: 'DJ B.A.E. performing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: LAB_TITLE,
    description: 'DJ B.A.E. mixes, open-format sets, mashups, and edits from Bae’s in the Lab.',
    images: [LAB_OG_IMAGE],
  },
}

export default async function LabPage() {
  const mixes = await getPublishedMixes()
  const listeningMixes: ListeningMix[] = mixes.map((mix) => ({
    id: mix.id,
    title: mix.title,
    description: mix.description,
    genre: mix.genre,
    embed_url: mix.embed_url,
    cover_url: mix.cover_url,
    duration: mix.duration,
  }))

  return (
    <div className="lab-experience">
      <LabListeningStation mixes={listeningMixes} />
    </div>
  )
}
