import type { Metadata } from 'next'
import LabListeningStation, { type ListeningMix } from '@/components/public/LabListeningStation'
import LabContextRail from '@/components/public/LabContextRail'
import { getPublishedMixes } from '@/lib/db/mixes'

/** Served from cache and rebuilt in the background at most every 5 minutes; admin saves refresh it immediately (revalidatePath). */
export const revalidate = 300

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

export default async function LabPage({
  searchParams,
}: {
  searchParams?: Promise<{ listen?: string | string[] }>
}) {
  const params = searchParams ? await searchParams : {}
  const initialTrackUrl = Array.isArray(params.listen) ? params.listen[0] : params.listen
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
      <LabContextRail mixes={listeningMixes} />
      <LabListeningStation mixes={listeningMixes} initialTrackUrl={initialTrackUrl || null} />
    </div>
  )
}
