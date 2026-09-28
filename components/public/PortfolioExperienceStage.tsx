'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PortfolioArchive from '@/components/public/PortfolioArchive'
import PortfolioArchiveHero, { type ArchivePrint } from '@/components/public/PortfolioArchiveHero'
import PortfolioMediaLightbox, {
  type PortfolioArchiveEntry,
  type PortfolioArchiveMedia,
} from '@/components/public/PortfolioMediaLightbox'

type PortfolioStats = {
  total: number
  cities: number
  yearsActive: string
}

export default function PortfolioExperienceStage({
  prints,
  entries,
  media,
  stats,
  instagramUrl,
}: {
  prints: ArchivePrint[]
  entries: PortfolioArchiveEntry[]
  media: PortfolioArchiveMedia[]
  stats: PortfolioStats
  instagramUrl?: string
}) {
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<PortfolioArchiveEntry | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  const mediaByEntry = useMemo(() => {
    const grouped = new Map<string, PortfolioArchiveMedia[]>()
    media.forEach((item) => {
      const list = grouped.get(item.portfolio_entry_id) ?? []
      list.push(item)
      grouped.set(item.portfolio_entry_id, list)
    })
    return grouped
  }, [media])

  const closeArchive = useCallback(() => {
    setArchiveOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById('portfolio-explore-archive')?.focus()
    })
  }, [])

  const openEntry = useCallback((entryId: string) => {
    const entry = entries.find((item) => item.id === entryId)
    if (entry) setSelectedEntry(entry)
  }, [entries])

  useEffect(() => {
    if (!archiveOpen) return
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !selectedEntry) closeArchive()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [archiveOpen, closeArchive, selectedEntry])

  return (
    <section className="portfolio-experience" aria-label="Portfolio and past work">
      <PortfolioArchiveHero
        prints={prints}
        onExplore={() => setArchiveOpen(true)}
        onOpenEntry={openEntry}
        instagramUrl={instagramUrl}
      />

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
            <PortfolioArchive entries={entries} media={media} onOpenEntry={openEntry} />
          </div>
        </div>
      ) : null}

      {selectedEntry ? (
        <PortfolioMediaLightbox
          key={selectedEntry.id}
          entry={selectedEntry}
          media={mediaByEntry.get(selectedEntry.id) ?? []}
          onClose={() => setSelectedEntry(null)}
        />
      ) : null}
    </section>
  )
}
