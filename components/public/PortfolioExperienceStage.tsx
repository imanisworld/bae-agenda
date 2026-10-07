'use client'

import { useEffect, useRef, useState } from 'react'
import InstagramEmbeds from '@/components/public/InstagramEmbeds'
import PortfolioArchive from '@/components/public/PortfolioArchive'
import PortfolioArchiveHero, { type ArchivePrint } from '@/components/public/PortfolioArchiveHero'
import type { PortfolioEventForExperience, RelatedListeningMix } from '@/lib/portfolio-experience'

type PortfolioStats = {
  total: number
  cities: number
  yearsActive: string
}

export default function PortfolioExperienceStage({
  prints,
  entries,
  stats,
  mixes,
  instagramUrl,
  instagramPosts = [],
}: {
  prints: ArchivePrint[]
  entries: PortfolioEventForExperience[]
  stats: PortfolioStats
  mixes: RelatedListeningMix[]
  instagramUrl?: string
  instagramPosts?: string[]
}) {
  const [archiveOpen, setArchiveOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  function closeArchive() {
    setArchiveOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById('portfolio-explore-archive')?.focus()
    })
  }

  useEffect(() => {
    if (!archiveOpen) return
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeArchive()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [archiveOpen])

  return (
    <section className="portfolio-experience" aria-label="Portfolio and past work">
      <PortfolioArchiveHero prints={prints} onExplore={() => setArchiveOpen(true)} instagramUrl={instagramUrl} />

      <div className="portfolio-experience-stats" aria-label="Portfolio summary">
        <span><strong>{stats.total || '—'}</strong> events</span>
        <span><strong>{stats.cities || '—'}</strong> cities</span>
        <span><strong>{stats.yearsActive}</strong> active years</span>
      </div>

      {archiveOpen ? (
        <div
          className="experience-drawer experience-drawer--open"
          role="dialog"
          aria-modal="false"
          aria-label="Full portfolio archive"
        >
          <div className="experience-drawer-bar">
            <div>
              <span>Past Work</span>
              <strong>Full Archive</strong>
            </div>
            <button ref={closeButtonRef} type="button" onClick={closeArchive} aria-label="Close archive">Close ×</button>
          </div>
          <div className="experience-drawer-scroll">
            <InstagramEmbeds posts={instagramPosts} profileUrl={instagramUrl} />
            <PortfolioArchive entries={entries} mixes={mixes} />
          </div>
        </div>
      ) : null}
    </section>
  )
}
