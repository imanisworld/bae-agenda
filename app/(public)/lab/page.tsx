import type { Metadata } from 'next'
import LabListeningStation, { type ListeningMix } from '@/components/public/LabListeningStation'
import { getPublishedMixes } from '@/lib/db/mixes'

export const metadata: Metadata = {
  title: 'Lab',
  alternates: { canonical: '/lab' },
  description: 'Bae’s in the Lab — published SoundCloud mixes, physical listening-station interaction, and work in progress from DJ B.A.E.',
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
  }))

  return (
    <main style={{ background: '#0e0b0a', paddingTop: 'calc(var(--nav-height) + var(--safe-top))' }}>
      <LabListeningStation mixes={listeningMixes} />
    </main>
  )
}
