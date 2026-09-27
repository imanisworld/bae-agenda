'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { EVENT_TYPES } from '@/lib/constants'
import { DimensionalStage, EditorialStage } from './direction-stages'
import { ListeningStation } from './listening-station'
import styles from './application-map.module.css'

export type ApprovedMix = {
  id: string
  title: string
  genre: string | null
  coverUrl: string | null
  embedUrl: string | null
}

export type ApprovedEvent = {
  id: string
  title: string
  date: string
  time: string | null
  venue: string | null
  city: string | null
  status: string
}

const studies = [
  {
    id: 'home',
    number: '01',
    label: 'Home',
    route: 'Home',
    signature: 'Editorial Cutout',
    note: 'Giant BAE, one performance photograph, and Selector · Genre Bender · Sound Architect. After Dark is the restraint: no control deck, crate, or light switch. The photograph can still shift.',
    limit: 'Shift left, shift right, and the Live Energy circle stay on Direction 01. They are exploration controls, not this hero.',
  },
  {
    id: 'events',
    number: '02',
    label: 'Upcoming Events',
    route: 'Upcoming Events',
    signature: 'Event on the photograph',
    note: 'Hard to miss. The name, date, clock time when the timezone is verified, venue and city when they are on the record, and status sit on the photograph.',
    limit: 'No field-name table. No second facts panel. No invented date. If nothing is published, the photograph says so.',
  },
  {
    id: 'lab',
    number: '03',
    label: 'Lab',
    route: 'Lab',
    signature: 'Listening station',
    note: 'The Control Deck’s platter, tonearm, and sleeve shelf, without the mixer. Published mixes play from SoundCloud. Unreleased sleeves say Coming Soon, In the Lab, or Work in Progress, and they do not play.',
    limit: 'Tone, pitch, A/B/C pads, scanner, and barcode stay on Direction 05.',
  },
  {
    id: 'portfolio',
    number: '04',
    label: 'Portfolio',
    route: 'Past work',
    signature: 'Nightlife Archive',
    note: 'Past work. A nightlife photograph sits behind layered archive prints. Upcoming dates do not live here.',
    limit: '',
  },
  {
    id: 'meet',
    number: '05',
    label: 'Meet',
    route: 'Meet',
    signature: 'Dimensional Identity',
    note: 'The portrait, Meet DJ B.A.E., the phone, the press kit, and a way into booking. The portrait tilts with the pointer and settles.',
    limit: 'Turn left, center, and turn right stay on Direction 03.',
  },
  {
    id: 'book',
    number: '06',
    label: 'Book + Contact',
    route: 'Book + Contact',
    signature: 'Inquiry',
    note: 'One quieter page. The booking inquiry and the contact lines share the same ink, type, and metals.',
    limit: 'No platter, dial, crate, or scanner.',
  },
] as const

type StudyId = (typeof studies)[number]['id']

const materials = [
  { name: 'Ink', color: '#0e0b0a' },
  { name: 'Espresso', color: '#161210' },
  { name: 'Oxblood', color: '#8f2d3c' },
  { name: 'Champagne', color: '#f6f1e8' },
  { name: 'Gold', color: '#c4a574' },
  { name: 'Copper', color: '#c4844a' },
] as const

const meetCopy = {
  kicker: 'Indianapolis',
  lines: ['Meet', 'DJ B.A.E.'] as const,
  detail: 'DJ B.A.E. moves between club sets, private events, branded experiences, and community nights without flattening the personality of the room.',
}

const archivePrints = [
  { src: '/photos/PlexMix19-DJBAE.JPEG', alt: 'DJ B.A.E. performing at Club Plex', title: 'Club Plex', index: '001' },
  { src: '/photos/IMG_1120.JPG.jpeg', alt: 'DJ B.A.E. event photograph', title: 'Event photograph', index: '002' },
  { src: '/photos/images/outside.jpg', alt: 'DJ B.A.E. performing', title: 'Outside', index: '003' },
] as const

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

export function ApplicationMap({
  mixes,
  events,
}: {
  mixes: ApprovedMix[]
  events: ApprovedEvent[]
}) {
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = useState<StudyId>('home')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const current = studies.find((study) => study.id === active) ?? studies[0]

  function moveTab(nextIndex: number) {
    const next = studies[nextIndex]
    if (!next) return
    setActive(next.id)
    tabRefs.current[nextIndex]?.focus()
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        moveTab((index + 1) % studies.length)
        break
      case 'ArrowLeft':
        event.preventDefault()
        moveTab((index - 1 + studies.length) % studies.length)
        break
      case 'Home':
        event.preventDefault()
        moveTab(0)
        break
      case 'End':
        event.preventDefault()
        moveTab(studies.length - 1)
        break
      default:
        break
    }
  }

  return (
    <section className={styles.map} id="application-map" aria-labelledby="application-map-title">
      <p className={styles.kicker}>Application map</p>
      <h2 className={styles.title} id="application-map-title">Approved plan.</h2>
      <p className={styles.copy}>
        Home, upcoming dates, the lab, past work, then meet, then book and contact. One treatment each. Directions, the system study, and the playground stay exploration. This does not change the live site.
      </p>

      <ul className={styles.materials}>
        {materials.map((item) => (
          <li key={item.name}>
            <span className={styles.swatch} style={{ background: item.color }} aria-hidden="true" />
            {item.name}
          </li>
        ))}
      </ul>
      <p className={styles.shared}>
        Ink, espresso, oxblood, champagne, gold, and copper. Burgundy stays in the oxblood already used here. Editorial type, physical shadow, the same settle, real photographs, and a reduced-motion path on every study.
      </p>

      <div className={styles.picker} role="tablist" aria-label="Page assignments">
        {studies.map((study, index) => {
          const selected = active === study.id
          return (
            <button
              key={study.id}
              ref={(node) => { tabRefs.current[index] = node }}
              id={`map-tab-${study.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="application-map-stage"
              tabIndex={selected ? 0 : -1}
              className={selected ? styles.tabActive : styles.tab}
              onClick={() => setActive(study.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              <span>{study.route}</span>
              <strong>{study.label}</strong>
            </button>
          )
        })}
      </div>

      <div className={styles.meta}>
        <span>{current.number}</span>
        <div>
          <strong>{current.signature}</strong>
          <p>{current.note}</p>
          {current.limit ? <p className={styles.limit}>{current.limit}</p> : null}
        </div>
      </div>

      <div className={styles.frame} role="tabpanel" id="application-map-stage" aria-labelledby={`map-tab-${active}`}>
        <StudyStage
          id={active}
          reduced={reduced}
          mixes={mixes}
          events={events}
          onBook={() => setActive('book')}
        />
      </div>
    </section>
  )
}

function StudyStage({
  id,
  reduced,
  mixes,
  events,
  onBook,
}: {
  id: StudyId
  reduced: boolean
  mixes: ApprovedMix[]
  events: ApprovedEvent[]
  onBook: () => void
}) {
  switch (id) {
    case 'home':
      return <EditorialStage controls={false} />
    case 'events':
      return <UpcomingEvents events={events} />
    case 'lab':
      return <ListeningStation mixes={mixes} reduced={reduced} />
    case 'portfolio':
      return <PortfolioPlate />
    case 'meet':
      return <MeetStudy onBook={onBook} />
    case 'book':
      return <BookContact />
    default: {
      const exhaustive: never = id
      throw new Error(`Unknown page study: ${exhaustive}`)
    }
  }
}

function UpcomingEvents({ events }: { events: ApprovedEvent[] }) {
  return (
    <div className={styles.poster}>
      <Image
        src="/photos/PlexMix19-DJBAE.JPEG"
        alt=""
        fill
        sizes="(max-width: 800px) 100vw, 1180px"
        className={styles.posterPhoto}
      />
      <div className={styles.posterShade} />
      <div className={styles.posterBeam} aria-hidden="true" />
      <div className={styles.posterCopy}>
        <h3>Upcoming Events</h3>
        {events.length === 0 ? (
          <p className={styles.posterEmpty}>No public date is posted.</p>
        ) : (
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <h4>{event.title}</h4>
                <span>{event.date}</span>
                {event.time ? <span>{event.time}</span> : null}
                {event.venue ? <span>{event.venue}</span> : null}
                {event.city ? <span>{event.city}</span> : null}
                <em>{event.status}</em>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function MeetStudy({ onBook }: { onBook: () => void }) {
  return (
    <DimensionalStage copy={meetCopy} controls={false} phone>
      <div className={styles.meetActions}>
        <a className={styles.pressKit} href="/press-kit">Open Press Kit</a>
        <button type="button" className={styles.bookLink} onClick={onBook}>
          Book DJ B.A.E.
        </button>
      </div>
    </DimensionalStage>
  )
}

function BookContact() {
  const [held, setHeld] = useState(false)

  function holdInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHeld(true)
  }

  return (
    <div className={styles.book}>
      <div className={styles.bookIntro}>
        <p>Book + Contact</p>
        <h3>Book DJ B.A.E.</h3>
        <span>Inquiry, contact, and the booking form. Same ink, type, and metals.</span>
        <dl>
          <div>
            <dt>Bookings</dt>
            <dd><a href="mailto:baebookings@proton.me">baebookings@proton.me</a></dd>
          </div>
          <div>
            <dt>Web inquiries</dt>
            <dd><a href="mailto:imanicru@pm.me">imanicru@pm.me</a></dd>
          </div>
        </dl>
      </div>
      <form className={styles.inquiry} onSubmit={holdInquiry}>
        <div className={styles.inquiryRow}>
          <label>
            First name
            <input name="first_name" autoComplete="given-name" required />
          </label>
          <label>
            Last name
            <input name="last_name" autoComplete="family-name" />
          </label>
        </div>
        <div className={styles.inquiryRow}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" inputMode="email" required />
          </label>
          <label>
            Phone
            <input name="phone" type="tel" autoComplete="tel" inputMode="tel" />
          </label>
        </div>
        <label>
          Event type
          <select name="event_type" defaultValue="">
            <option value="">Select a type</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <div className={styles.inquiryRow}>
          <label>
            Event date
            <input name="event_date" type="date" required />
          </label>
          <label>
            City
            <input name="city" autoComplete="address-level2" />
          </label>
        </div>
        <label>
          Event name
          <input name="event_name" autoComplete="off" required />
        </label>
        <button type="submit">Send inquiry</button>
        {held ? <p role="status">Held on this page. Nothing was sent.</p> : null}
      </form>
    </div>
  )
}

function PortfolioPlate() {
  return (
    <div className={styles.portfolio}>
      <Image
        src="/photos/outdoor-night-set-pook.png"
        alt=""
        fill
        sizes="(max-width: 800px) 100vw, 1180px"
        className={styles.portfolioGround}
      />
      <div className={styles.portfolioShade} />
      <div className={styles.portfolioCopy}>
        <p>Portfolio</p>
        <h3>Past work</h3>
        <span>Collected prints over a nightlife photograph.</span>
      </div>
      <ul className={styles.archivePrints}>
        {archivePrints.map((print) => (
          <li key={print.src}>
            <Image src={print.src} alt={print.alt} fill sizes="240px" />
            <span>{print.index}</span>
            <strong>{print.title}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

