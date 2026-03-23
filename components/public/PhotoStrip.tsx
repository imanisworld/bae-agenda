/**
 * PHOTO STRIP — Server Component
 * A horizontal band of 5 DJ photos, displayed between sections.
 * No JS — hover scale handled via CSS (.photo-slot:hover img).
 *
 * ADDING PHOTOS — replace each photo-placeholder div with:
 *   <img src="/photos/strip-N.jpg" alt="DJ B.A.E. at [venue]" />
 *   or use Next.js <Image fill> for better performance.
 *   Recommended: landscape 800×600 or wider. Any aspect ratio works — object-fit covers.
 *
 * Photos 4 & 5 are hidden on mobile (max-width: 800px) via CSS.
 * On mobile: 3 photos at 180px height.
 * On desktop: 5 photos at 260px height.
 */

interface StripSlot {
  slot:  number
  label: string   // hint for which photo goes here
}

const STRIP_PHOTOS = [
  { src: '/photos/PlexMix19-DJBAE.JPEG',                        alt: 'DJ B.A.E. on the decks' },
  { src: '/photos/IMG_1118.JPG.jpeg',                           alt: 'DJ B.A.E. live set' },
  { src: '/photos/93857B7F-E4CA-4F51-BD81-68031362370D.JPG',   alt: 'DJ B.A.E. at the event' },
  { src: '/photos/IMG_1120.JPG.jpeg',                           alt: 'DJ B.A.E. performance' },
  // slot 5 — add another photo here when ready
]

export default function PhotoStrip() {
  return (
    <div
      className="photo-strip"
      aria-hidden="true"
    >
      {STRIP_PHOTOS.map(({ src, alt }, i) => (
        <div key={i} className="photo-strip-slot photo-slot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ))}
      {/* Slot 5 placeholder until 5th photo is added */}
      <div className="photo-strip-slot photo-slot">
        <div className="photo-placeholder">
          <span className="photo-placeholder-label" style={{ opacity: 0.4 }}>+ add photo</span>
        </div>
      </div>
    </div>
  )
}
