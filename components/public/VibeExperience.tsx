'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './VibeExperience.module.css'

type Vibe = {
  id: string
  label: string
  eyebrow: string
  headline: string
  description: string
  sound: string[]
  energy: string
  fits: string[]
  bookingType: string
  portfolioCategory: string
}

const VIBES: Vibe[] = [
  {
    id: 'rnb',
    label: '90s + 2000s R&B',
    eyebrow: 'Sing it before the hook lands',
    headline: 'Familiar, warm, and still moving.',
    description: 'For rooms that want the records everybody knows without turning the night into a nostalgia playlist.',
    sound: ['R&B', 'Hip-Hop', 'Slow Jams', 'Edits'],
    energy: 'Warm-up → singalong → bounce',
    fits: ['Birthdays', 'Day parties', 'Lounges'],
    bookingType: 'Birthday / Private Party',
    portfolioCategory: 'Private + Social',
  },
  {
    id: 'girls-night',
    label: 'Girls’ Night',
    eyebrow: 'Pretty, loud, no dead air',
    headline: 'Big hooks. Sharp transitions. Room-first energy.',
    description: 'A playful open-format lane built for people who came to dance, sing, and stay longer than they planned.',
    sound: ['R&B', 'Hip-Hop', 'Club', 'Throwbacks'],
    energy: 'Flirty → loud → hands up',
    fits: ['Nightlife', 'Birthdays', 'Branded events'],
    bookingType: 'Club / Venue Night',
    portfolioCategory: 'Nightlife',
  },
  {
    id: 'cookout',
    label: 'Cookout / Day Party',
    eyebrow: 'Sun out, everybody outside',
    headline: 'Easy first. Then somebody starts dancing.',
    description: 'Music that can hold conversation early and still turn into a real party once the room is ready.',
    sound: ['Hip-Hop', 'R&B', 'Funk', 'House'],
    energy: 'Easy → social → dance floor',
    fits: ['Community events', 'Day parties', 'Outdoor events'],
    bookingType: 'Brunch / Day Party',
    portfolioCategory: 'Community + Culture',
  },
  {
    id: 'grown',
    label: 'Grown & Sexy',
    eyebrow: 'No rush',
    headline: 'A slow burn with enough edge to keep it interesting.',
    description: 'For rooms that need texture, pacing, and grown energy instead of nonstop peak-hour records.',
    sound: ['R&B', 'Soul', 'Hip-Hop', 'House'],
    energy: 'Low glow → groove → late-night',
    fits: ['Lounges', 'Dinners', 'Milestone events'],
    bookingType: 'Birthday / Private Party',
    portfolioCategory: 'Private + Social',
  },
  {
    id: 'open-format',
    label: 'Open Format',
    eyebrow: 'Read the room',
    headline: 'Different genres. One night that still makes sense.',
    description: 'The lane for mixed crowds, changing energy, and events where the music has to move without feeling random.',
    sound: ['Hip-Hop', 'R&B', 'House', 'Club'],
    energy: 'Adaptive → layered → peak',
    fits: ['Private events', 'Corporate', 'Nightlife'],
    bookingType: 'Corporate Event',
    portfolioCategory: 'Corporate + Brand',
  },
  {
    id: 'global-club',
    label: 'Global / Club',
    eyebrow: 'Left turn, right record',
    headline: 'Rhythm-forward without losing the room.',
    description: 'A more adventurous lane for crowds that want movement, edits, and genre shifts beyond the obvious choices.',
    sound: ['Baile', 'House', 'Juke', 'Club edits'],
    energy: 'Percussive → kinetic → release',
    fits: ['Creative events', 'Nightlife', 'Fashion / art'],
    bookingType: 'Club / Venue Night',
    portfolioCategory: 'Nightlife',
  },
]

const PROJECTS = [
  {
    kicker: 'Mashup Series',
    title: 'Songs That Should Kiss',
    copy: 'Unexpected records put together because the connection is too good to leave alone.',
    href: '/lab',
    action: 'Hear the experiments',
  },
  {
    kicker: 'Recurring Night',
    title: 'Chi Chi’s',
    copy: 'A nightlife series built around community, good music, and a room that knows how to move.',
    href: '/portfolio',
    action: 'See past work',
  },
]

export default function VibeExperience() {
  const [selectedId, setSelectedId] = useState(VIBES[0].id)
  const selected = VIBES.find((vibe) => vibe.id === selectedId) ?? VIBES[0]

  return (
    <>
      <section className={styles.section} aria-labelledby="vibe-heading">
        <div className={styles.inner}>
          <div className={styles.intro}>
            <span className={styles.kicker}>Choose the room</span>
            <h2 id="vibe-heading">What are we doing tonight?</h2>
            <p>
              Pick a lane. This is not a fixed playlist — it&apos;s how DJ B.A.E. thinks about pacing, context, and the crowd.
            </p>
          </div>

          <div className={styles.selector} role="tablist" aria-label="Choose a vibe">
            {VIBES.map((vibe) => {
              const active = vibe.id === selected.id
              return (
                <button
                  key={vibe.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={active ? styles.tabActive : styles.tab}
                  onClick={() => setSelectedId(vibe.id)}
                >
                  {vibe.label}
                </button>
              )
            })}
          </div>

          <div className={styles.stage}>
            <div className={styles.stageNumber} aria-hidden="true">
              {String(VIBES.findIndex((vibe) => vibe.id === selected.id) + 1).padStart(2, '0')}
            </div>

            <div className={styles.stageCopy}>
              <span className={styles.stageEyebrow}>{selected.eyebrow}</span>
              <h3>{selected.headline}</h3>
              <p>{selected.description}</p>

              <div className={styles.metaGrid}>
                <div>
                  <span className={styles.metaLabel}>Sound</span>
                  <div className={styles.chips}>
                    {selected.sound.map((item) => <span key={item}>{item}</span>)}
                  </div>
                </div>
                <div>
                  <span className={styles.metaLabel}>Energy</span>
                  <strong>{selected.energy}</strong>
                </div>
                <div>
                  <span className={styles.metaLabel}>Works for</span>
                  <strong>{selected.fits.join(' · ')}</strong>
                </div>
              </div>

              <div className={styles.actions}>
                <Link href="/lab" className="btn-primary">Hear the range →</Link>
                <Link
                  href={`/portfolio?category=${encodeURIComponent(selected.portfolioCategory)}`}
                  className="btn-ghost"
                >
                  See the proof
                </Link>
                <Link href={`/book?type=${encodeURIComponent(selected.bookingType)}`} className={styles.textLink}>Book this kind of room</Link>
              </div>
            </div>

            <div className={styles.signal} aria-hidden="true">
              <div className={styles.signalLine} />
              <div className={styles.signalLine} />
              <div className={styles.signalLine} />
              <div className={styles.signalLine} />
              <div className={styles.signalLine} />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.projects} aria-labelledby="projects-heading">
        <div className={styles.inner}>
          <div className={styles.projectsHeader}>
            <div>
              <span className={styles.kicker}>From the booth</span>
              <h2 id="projects-heading">Not just gigs.</h2>
            </div>
            <p>Recurring nights, mashups, and listening projects are part of the same point of view.</p>
          </div>

          <div className={styles.projectGrid}>
            {PROJECTS.map((project, index) => (
              <Link key={project.title} href={project.href} className={styles.projectCard}>
                <span className={styles.projectIndex}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.projectKicker}>{project.kicker}</span>
                <h3>{project.title}</h3>
                <p>{project.copy}</p>
                <span className={styles.projectAction}>{project.action} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
