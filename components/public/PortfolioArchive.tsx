'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  allPortfolioCategories,
  portfolioCategories,
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

function EventDetail({
  entry,
  mixes,
  onClose,
}: {
  entry: PortfolioEventForExperience
  mixes: RelatedListeningMix[]
  onClose: () => void
}) {
  const categories = portfolioCategories(entry)
  const related = relatedListening(entry, mixes)
  const bookingType = bookingTypeFor(categories)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${entry.event_name} details`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2400,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 560px)',
        background: 'rgba(7,5,5,0.72)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <button
        type="button"
        aria-label="Close event details"
        onClick={onClose}
        style={{ border: 0, background: 'transparent', cursor: 'default' }}
      />
      <aside
        style={{
          height: '100%',
          overflowY: 'auto',
          background: 'var(--off-black)',
          borderLeft: '1px solid rgba(246,241,232,0.12)',
          boxShadow: '-28px 0 80px rgba(0,0,0,0.32)',
        }}
      >
        {entry.photo_url ? (
          <div style={{ position: 'relative', minHeight: 'min(42vh, 420px)' }}>
            <Image
              src={entry.photo_url}
              alt={entry.event_name}
              fill
              sizes="(max-width: 700px) 100vw, 560px"
              style={{ objectFit: 'cover' }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, var(--off-black), transparent 55%)',
              }}
            />
          </div>
        ) : null}

        <div style={{ padding: '24px clamp(20px, 4vw, 34px) 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
            <div>
              <span style={{ color: 'var(--gold)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Archive record
              </span>
              <h3
                style={{
                  margin: '8px 0 0',
                  fontFamily: 'Conthrax, sans-serif',
                  fontSize: 'clamp(25px, 4vw, 40px)',
                  lineHeight: 1,
                }}
              >
                {entry.event_name}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              style={{ minWidth: 'unset', padding: '8px 11px', flexShrink: 0 }}
            >
              Close ×
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '1px',
              marginTop: '24px',
              background: 'var(--border)',
              border: '1px solid var(--border)',
            }}
          >
            {[
              ['When', displayDate(entry.date, entry.year)],
              ['Where', entry.venue || entry.city],
              ['Location', [entry.city, entry.state].filter(Boolean).join(', ')],
              ['Type', categories.join(' · ')],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '13px', background: 'var(--surface)' }}>
                <div style={{ color: 'var(--muted)', fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '5px' }}>
                  {label}
                </div>
                <div style={{ color: 'var(--white)', fontSize: '12px', lineHeight: 1.55 }}>{value || '—'}</div>
              </div>
            ))}
          </div>

          {entry.tags.length > 0 ? (
            <div style={{ marginTop: '20px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '9px' }}>
                Archive tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {entry.tags.map((tag) => <TagChip key={tag} label={tag} />)}
              </div>
            </div>
          ) : null}

          {entry.notes ? (
            <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--muted)', fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Notes
              </div>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px', lineHeight: 1.75 }}>{entry.notes}</p>
            </div>
          ) : null}

          <div style={{ marginTop: '26px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--gold)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Related listening
            </div>
            <p style={{ margin: '0 0 13px', color: 'var(--muted)', fontSize: '11px', lineHeight: 1.65 }}>
              Suggested from the event&apos;s archive tags and mix metadata. These are not claimed to be recordings from this event.
            </p>

            {related.length > 0 ? (
              <div style={{ display: 'grid', gap: '7px' }}>
                {related.map((mix) => (
                  <Link
                    key={mix.id}
                    href={relatedListeningHref(mix)}
                    style={{
                      display: 'grid',
                      gap: '3px',
                      padding: '11px 12px',
                      border: '1px solid var(--border)',
                      color: 'inherit',
                      textDecoration: 'none',
                      background: 'rgba(246,241,232,0.02)',
                    }}
                  >
                    <strong style={{ fontSize: '12px', fontWeight: 500 }}>{mix.title}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: '10px' }}>{mix.genre || 'Open format'} · Open in the Lab →</span>
                  </Link>
                ))}
              </div>
            ) : (
              <Link href="/lab" className="btn-ghost">Explore the Lab →</Link>
            )}
          </div>

          <div style={{ marginTop: '26px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href={`/book?type=${encodeURIComponent(bookingType)}`} className="btn-primary">
              Plan something similar →
            </Link>
            <Link href="/lab" className="btn-ghost">Hear more</Link>
          </div>
        </div>
      </aside>

      <style jsx>{`
        @media (max-width: 720px) {
          div[role='dialog'] {
            grid-template-columns: 1fr !important;
          }
          div[role='dialog'] > button {
            display: none;
          }
          div[role='dialog'] > aside {
            border-left: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function PortfolioArchive({
  entries,
  mixes,
}: {
  entries: PortfolioEventForExperience[]
  mixes: RelatedListeningMix[]
}) {
  const [city, setCity] = useState<string | null>(null)
  const [category, setCategory] = useState<PortfolioCategory | null>(null)
  const [tag, setTag] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<PortfolioEventForExperience | null>(null)

  const cities = useMemo(() => {
    const seen = new Set<string>()
    entries.forEach((entry) => seen.add(entry.city.split(',')[0].trim()))
    return [...seen].sort()
  }, [entries])

  const categories = useMemo(() => allPortfolioCategories(entries), [entries])

  const tags = useMemo(() => {
    const seen = new Set<string>()
    entries.forEach((entry) => entry.tags.forEach((value) => seen.add(value)))
    return [...seen].sort()
  }, [entries])

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (city && !entry.city.startsWith(city)) return false
      if (category && !portfolioCategories(entry).includes(category)) return false
      if (tag && !entry.tags.includes(tag)) return false
      return true
    })
  }, [entries, city, category, tag])

  const allYears = useMemo(
    () => [...new Set(filtered.map((entry) => entry.year))].sort((a, b) => b - a),
    [filtered]
  )

  const hasFilters = city !== null || category !== null || tag !== null
  const visibleYears = expanded || hasFilters ? allYears : allYears.slice(0, COLLAPSED_YEARS)

  function clearFilters() {
    setCity(null)
    setCategory(null)
    setTag(null)
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

        {cities.length > 1 && tags.length > 0 ? (
          <span style={{ width: '1px', height: '18px', background: 'var(--border)', flexShrink: 0 }} />
        ) : null}

        {tags.slice(0, 10).map((value) => (
          <button
            key={value}
            type="button"
            style={tag === value ? filterBtnActive : filterBtnBase}
            onClick={() => setTag(tag === value ? null : value)}
          >
            {value}
          </button>
        ))}

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
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className="portfolio-year-row"
                        onClick={() => setSelected(entry)}
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
                          </div>
                        </div>

                        <div className="portfolio-year-meta" style={{ textAlign: 'right', flexShrink: 0, minWidth: 0 }}>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{entry.city}</div>
                          <div style={{ fontSize: '10px', color: 'var(--gold)', marginTop: '4px' }}>Open record →</div>
                        </div>
                      </button>
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

      {selected ? <EventDetail entry={selected} mixes={mixes} onClose={() => setSelected(null)} /> : null}
    </section>
  )
}
