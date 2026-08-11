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
import Image from 'next/image'
import PerformanceClip from '@/components/public/PerformanceClip'

const STRIP_ITEMS = [
  { kind: 'image' as const, src: '/photos/PlexMix19-DJBAE.JPEG', alt: 'DJ B.A.E. on the decks', credit: 'Shot by Pook' },
  { kind: 'image' as const, src: '/photos/IMG_1118.JPG.jpeg', alt: 'DJ B.A.E. portrait', credit: 'Shot by G' },
  { kind: 'image' as const, src: '/photos/93857B7F-E4CA-4F51-BD81-68031362370D.JPG', alt: 'DJ B.A.E. at the event', credit: 'Shot by Ki' },
  { kind: 'image' as const, src: '/photos/IMG_1120.JPG.jpeg', alt: 'DJ B.A.E. smiling portrait', credit: 'Shot by G' },
  { kind: 'video' as const, src: '/videos/e67f0964-8763-4658-bbba-4cc322727d68.mp4', alt: 'DJ B.A.E. performing an outdoor evening set', credit: '' },
]

export default function PhotoStrip() {
  return (
    <div className="photo-strip">
      {STRIP_ITEMS.map(({ kind, src, alt, credit }, i) => (
        <div key={i} className="photo-strip-slot photo-slot" style={{ position: 'relative' }}>
          {kind === 'video' ? (
            <PerformanceClip src={src} ariaLabel={alt} />
          ) : (
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 800px) 33vw, 20vw"
              style={{ objectFit: 'cover', display: 'block' }}
            />
          )}
          {credit && <div className="photo-credit">{credit}</div>}
        </div>
      ))}
    </div>
  )
}
