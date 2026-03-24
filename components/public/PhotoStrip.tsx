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

const STRIP_PHOTOS = [
  { src: '/photos/PlexMix19-DJBAE.JPEG', alt: 'DJ B.A.E. on the decks', credit: 'Shot by Pook' },
  { src: '/photos/IMG_1118.JPG.jpeg', alt: 'DJ B.A.E. portrait', credit: 'Shot by G' },
  { src: '/photos/93857B7F-E4CA-4F51-BD81-68031362370D.JPG', alt: 'DJ B.A.E. at the event', credit: 'Shot by Ki' },
  { src: '/photos/IMG_1120.JPG.jpeg', alt: 'DJ B.A.E. smiling portrait', credit: 'Shot by G' },
  { src: '/photos/outdoor-night-set-pook.png', alt: 'DJ B.A.E. performing outdoors at night', credit: 'Shot by Pook' },
]

export default function PhotoStrip() {
  return (
    <div className="photo-strip">
      {STRIP_PHOTOS.map(({ src, alt, credit }, i) => (
        <div key={i} className="photo-strip-slot photo-slot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div className="photo-credit">{credit}</div>
        </div>
      ))}
    </div>
  )
}
