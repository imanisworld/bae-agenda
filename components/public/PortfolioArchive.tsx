'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, type CSSProperties } from 'react'
import {
  allPortfolioCategories,
  portfolioCategories,
  portfolioProof,
  relatedListening,
  relatedListeningHref,
  type PortfolioCategory,
  type PortfolioEventForExperience,
  type RelatedListeningMix,
} from '@/lib/portfolio-experience'

function TagChip({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: '9px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--gold)',
      background: 'rgba(196,165,116,0.06)',
      border: '1px solid rgba(196,165,116,0.18)',
      padding: '4px 7px',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

const filterBtnBase: CSSProperties = {
  fontSize: '10px',
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  padding: '9px 13px',
  minHeight: '40px',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--muted)',
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
  transition: 'border-color 180ms ease, color 180ms ease, background 180ms ease',
  whiteSpace: 'nowrap',
}

const filterBtnActive: CSSProperties = {
  ...filterBtnBase,
  borderColor: 'var(--gold)',
  color: 'var(--white)',
  background: 'rgba(196,165,116,0.08)',
}

const COLLAPSED_YEARS = 3

function displayDate(value: string | null | undefined, year: number) {
  if (!value) return String(year)
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return String(year)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function bookingTypeFor(categories: PortfolioCategory[]) {
  if (categories.includes('Nightlife')) return 'Club / Venue Night'
  if (categories.includes('Corporate + Brand')) return 'Corporate Event'
  if (categories.includes('Private + Social')) return 'Birthday / Private Party'
  return 'Other'
}

function InlineEventDetail({
  entry,
  entries,
  mixes,
}: {
  entry: PortfolioEventForExperience
  entries: PortfolioEventForExperience[]
  mixes: RelatedListeningMix[]
}) {
  const categories = portfolioCategories(entry)
  const proof = portfolioProof(entry, entries)
  const related = relatedListening(entry, mixes, 2)
  const bookingType = bookingTypeFor(categories)
  const place = [entry.venue, [entry.city, entry.state].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '22px',
        padding: '20px',
        margin: '0 0 10px',
        border: '1px solid rgba(196,165,116,.18)',
        background: 'rgba(196,165,116,.035)',
      }}
    >
      {entry.photo_url ? (
        <div style={{ position: 'relative', minHeight: '220px', overflow: 'hidden' }}>
          <Image
            src={entry.photo_url}
            alt={entry.event_name}
            fill
            sizes="(max-width: 720px) 100vw, 320px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      ) : null}

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)',
          }}
        >
          {[
            ['When', displayDate(entry.date, entry.year)],
            ['Place', place || entry.city],
            ['Type', categories.join(' · ')],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '11px 12px', background: 'var(--surface)' }}>
              <div style={{ color: 'var(--muted)', fontSize: '8px', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: '4px' }}>
                {label}
              </div>
              <div style={{ color: 'var(--white)', fontSize: '11px', lineHeight: 1.5 }}>{value || '—'}</div>
            </div>
          ))}
        </div>

        {proof.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: '14px' }}>
            {proof.map((label) => (
              <span
                key={label}
                style={{
                  padding: '6px 9px',
                  border: '1px solid rgba(196,165,116,.34)',
                  background: 'rgba(196,165,116,.09)',
                  color: 'var(--gold)',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}

        {entry.notes ? (
          <p style={{ margin: '16px 0 0', color: 'var(--muted)', fontSize: '12px', lineHeight: 1.7 }}>
            {entry.notes}
          </p>
        ) : null}

        {related.length > 0 ? (
          <div style={{ marginTop: '18px' }}>
            <div style={{ color: 'var(--gold)', fontSize: '8px', letterSpacing: '.17em', textTransform: 'uppercase', marginBottom: '7px' }}>
              Related listening
            </div>
            <p style={{ margin: '0 0 9px', color: 'var(--muted)', fontSize: '10px', lineHeight: 1.55 }}>
              Matched from archive tags + mix metadata, not claimed as an event recording.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {related.map((mix) => (
                <Link
                  key={mix.id}
                  href={relatedListeningHref(mix)}
                  className="btn-ghost"
                  style={{ minWidth: 0 }}
                >
                  {mix.title} →
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: '18px' }}>
          <Link href={`/book?type=${encodeURIComponent(bookingType)}&from=${encodeURIComponent(`portfolio:${entry.id}`)}`} className="btn-primary">
            Plan something similar →
          </Link>
        </div>
      </div>

    </div>
  )
}

export default function PortfolioArchive({
  entries,
  mixes,
  initialCategory = null,
}: {
  entries: PortfolioEventForExperience[]
  mixes: RelatedListeningMix[]
  initialCategory?: PortfolioCategory | null
}) {
  const [city, setCity] = useState<string | null>(null)
  const [category, setCategory] = useState<PortfolioCategory | null>(initialCategory)
  const [expanded, setExpanded] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const cities = useMemo(() => {
    const seen = new Set<string>()
    entries.forEach((entry) => seen.add(entry.city.split(',')[0].trim()))
    return [...seen].sort()
  }, [entries])

  const categories = useMemo(() => allPortfolioCategories(entries), [entries])


  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (city && !entry.city.startsWith(city)) return false
      if (category && !portfolioCategories(entry).includes(category)) return false
      return true
    })
  }, [entries, city, category])

  const allYears = useMemo(
    () => [...new Set(filtered.map((entry) => entry.year))].sort((a, b) => b - a),
    [filtered]
  )

  const hasFilters = city !== null || category !== null
  const visibleYears = expanded || hasFilters ? allYears : allYears.slice(0, COLLAPSED_YEARS)

  function clearFilters() {
    setCity(null)
    setCategory(null)
  }

  return (
    <section style={{ marginBottom: '80px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div>
          <div className="hardware-heading" style={{ marginBottom: '6px' }}>
            <span className="section-label">Full Archive</span>
          </div>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px' }}>
            Browse by the kind of room or event you&apos;re planning, then open any record for context.
          </p>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {categories.length > 0 ? (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ color: 'var(--muted)', fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Event type
          </div>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            {categories.map((value) => (
              <button
                key={value}
                type="button"
                style={category === value ? filterBtnActive : filterBtnBase}
                onClick={() => setCategory(category === value ? null : value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className="portfolio-filter-bar"
        style={{
          display: 'flex',
          gap: '7px',
          flexWrap: 'wrap',
          alignItems: 'center',
          paddingBottom: '22px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {cities.length > 1 ? cities.map((value) => (
          <button
            key={value}
            type="button"
            style={city === value ? filterBtnActive : filterBtnBase}
            onClick={() => setCity(city === value ? null : value)}
          >
            {value}
          </button>
        )) : null}

        {hasFilters ? (
          <button
            type="button"
            style={{ ...filterBtnBase, color: 'var(--gold)', borderColor: 'transparent' }}
            onClick={clearFilters}
          >
            Clear ×
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
          No events match these filters.
        </div>
      ) : (
        <>
          {visibleYears.map((year) => {
            const yearEntries = filtered.filter((entry) => entry.year === year)
            return (
              <div
                key={year}
                className="portfolio-year-group"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'clamp(60px, 8vw, 96px) 1fr',
                  gap: '0 32px',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '32px',
                  paddingBottom: '32px',
                  alignItems: 'start',
                }}
              >
                <div
                  className="portfolio-year-label"
                  style={{
                    fontFamily: 'Conthrax, sans-serif',
                    fontSize: 'clamp(24px, 3.5vw, 40px)',
                    color: 'rgba(250,248,243,0.12)',
                    lineHeight: 1,
                    paddingTop: '4px',
                    position: 'sticky',
                    top: '88px',
                  }}
                >
                  {year}
                </div>

                <div className="portfolio-year-events" style={{ display: 'grid', gap: '0', minWidth: 0 }}>
                  {yearEntries.map((entry, index) => {
                    const entryCategories = portfolioCategories(entry)
                    const proof = portfolioProof(entry, entries)
                    return (
                      <div key={entry.id}>
                        <button
                        type="button"
                        className="portfolio-year-row"
                        onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
                        style={{
                          width: '100%',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '14px 0',
                          border: 0,
                          borderBottom: index < yearEntries.length - 1
                            ? '1px solid rgba(255,255,255,0.06)'
                            : 'none',
                          background: 'transparent',
                          color: 'inherit',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 'clamp(13px, 1.8vw, 15px)',
                              color: entry.featured ? 'var(--white)' : 'rgba(250,248,243,0.82)',
                              fontWeight: entry.featured ? 500 : 300,
                              marginBottom: '6px',
                              lineHeight: 1.4,
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {entry.event_name}
                            {entry.featured ? (
                              <span style={{ marginLeft: '8px', color: 'var(--gold)', fontSize: '9px' }}>★</span>
                            ) : null}
                          </div>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {entryCategories.slice(0, 2).map((value) => <TagChip key={value} label={value} />)}
                            {proof.slice(0, 1).map((value) => (
                              <span
                                key={value}
                                style={{
                                  fontSize: '9px',
                                  letterSpacing: '.08em',
                                  textTransform: 'uppercase',
                                  color: 'var(--white)',
                                  padding: '4px 7px',
                                  border: '1px solid rgba(246,241,232,.18)',
                                  background: 'rgba(246,241,232,.04)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {value}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="portfolio-year-meta" style={{ textAlign: 'right', flexShrink: 0, minWidth: 0 }}>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{entry.city}</div>
                          <div style={{ fontSize: '10px', color: 'var(--gold)', marginTop: '4px' }}>{selectedId === entry.id ? 'Close ↑' : 'Details ↓'}</div>
                        </div>
                        </button>
                        {selectedId === entry.id ? <InlineEventDetail entry={entry} entries={entries} mixes={mixes} /> : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {!hasFilters && allYears.length > COLLAPSED_YEARS ? (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                style={filterBtnBase}
              >
                {expanded ? 'Show less ↑' : `Show all ${filtered.length} events ↓`}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
