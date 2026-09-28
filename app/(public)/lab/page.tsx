import type { Metadata } from 'next'
import LabListeningStation, { type ListeningMix } from '@/components/public/LabListeningStation'
import { getPublishedMixes } from '@/lib/db/mixes'

export const metadata: Metadata = {
  title: 'Lab',
  alternates: { canonical: '/lab' },
  description: 'Bae’s in the Lab — published SoundCloud mixes from DJ B.A.E. on a crate-and-turntable listening station.',
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
