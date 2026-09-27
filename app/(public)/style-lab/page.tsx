import Image from 'next/image'
import styles from './page.module.css'

const collage = [
  { src: '/photos/PlexMix19-DJBAE.JPEG', alt: 'DJ B.A.E. performing at Club Plex', className: styles.collageOne },
  { src: '/photos/outdoor-night-set-pook.png', alt: 'DJ B.A.E. performing outdoors at night', className: styles.collageTwo },
  { src: '/photos/IMG_1120.JPG.jpeg', alt: 'DJ B.A.E. event photograph', className: styles.collageThree },
]

export default function StyleLabPage() {
  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.kicker}>THE BAE AGENDA · STYLE LAB 001</p>
        <h1>Make the photos part of the identity.</h1>
        <p className={styles.lede}>
          Not a redesign. Three ways the existing B.A.E. photography can stop behaving like standard website cards.
        </p>
      </header>

      <section className={styles.experiment}>
        <div className={styles.labelRow}>
          <span>01</span>
          <p>Editorial cutout</p>
        </div>

        <div className={styles.editorialStage}>
          <div className={styles.editorialWord} aria-hidden="true">BAE</div>
          <div className={styles.editorialPhoto}>
            <Image
              src="/photos/images/outside.jpg"
              alt="DJ B.A.E. performing"
              fill
              sizes="(max-width: 800px) 90vw, 46vw"
              priority
            />
          </div>
          <div className={styles.editorialCopy}>
            <p>SELECTOR · GENRE BENDER</p>
            <h2>Sound<br />Architect</h2>
            <span>Indianapolis · Open format</span>
          </div>
          <div className={styles.editorialStamp}>LIVE<br />ENERGY</div>
        </div>
      </section>

      <section className={styles.experiment}>
        <div className={styles.labelRow}>
          <span>02</span>
          <p>Nightlife collage</p>
        </div>

        <div className={styles.collageStage}>
          <div className={styles.collageHeadline}>
            <span>FROM THE ARCHIVE</span>
            <h2>Rooms.<br />Crowds.<br />Moments.</h2>
          </div>

          {collage.map((item) => (
            <figure key={item.src} className={item.className}>
              <Image src={item.src} alt={item.alt} fill sizes="40vw" />
            </figure>
          ))}

          <div className={styles.ticket}>
            <span>DJ B.A.E.</span>
            <strong>70 EVENTS</strong>
            <small>2018 — 2026</small>
          </div>
          <p className={styles.sideNote}>not a gallery. an archive.</p>
        </div>
      </section>

      <section className={styles.experiment}>
        <div className={styles.labelRow}>
          <span>03</span>
          <p>Dimensional identity</p>
        </div>

        <div className={styles.dimensionStage}>
          <div className={styles.glow} />
          <div className={styles.logoObject}>
            <Image src="/photos/images/logo.JPG" alt="DJ B.A.E. logo" fill sizes="34vw" />
          </div>
          <div className={styles.phoneObject}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/images/phone%203d%20.gif" alt="Animated 3D phone" />
          </div>
          <div className={styles.dimensionCopy}>
            <p>IDENTITY IN MOTION</p>
            <h2>Objects can move.<br />The site doesn&apos;t have to.</h2>
            <span>
              One or two dimensional brand moments can carry the personality while the rest stays clean and grown.
            </span>
          </div>
        </div>
      </section>

      <section className={styles.direction}>
        <p className={styles.kicker}>THE SYSTEM I WOULD BUILD FROM THIS</p>
        <div className={styles.directionGrid}>
          <article><span>Photography</span><h3>Break the rectangle.</h3><p>Cutouts, masks, overlap, crop with intention.</p></article>
          <article><span>Typography</span><h3>Let type touch the image.</h3><p>Behind it, through it, across it — not always above it.</p></article>
          <article><span>Motion</span><h3>Use less, but make it count.</h3><p>Slow drift, depth, reveal, one memorable moving object.</p></article>
          <article><span>Archive</span><h3>Make the work feel collected.</h3><p>Posters, receipts, contact sheets, releases — not cards.</p></article>
        </div>
      </section>
    </main>
  )
}
