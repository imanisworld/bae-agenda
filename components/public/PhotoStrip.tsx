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

const STRIP_SLOTS: StripSlot[] = [
  { slot: 1, label: 'crowd or dance floor' },
  { slot: 2, label: 'closeup of hands on decks' },
  { slot: 3, label: 'wide venue shot'          },
  { slot: 4, label: 'profile / candid'         },
  { slot: 5, label: 'lighting or atmosphere'   },
]

export default function PhotoStrip() {
  return (
    <div
      className="photo-strip"
      aria-hidden="true"   // decorative — screen readers skip
    >
      {STRIP_SLOTS.map(({ slot, label }) => (
        <div
          key={slot}
          className="photo-strip-slot photo-slot"
        >
          {/*
            ── TO ADD A REAL PHOTO ──────────────────────────────────
            Remove the photo-placeholder div below and add:

            <img
              src={`/photos/strip-${slot}.jpg`}
              alt={`DJ B.A.E. — ${label}`}
            />

            or with Next.js Image for optimization:

            import Image from 'next/image'
            <Image
              src={`/photos/strip-${slot}.jpg`}
              alt={`DJ B.A.E. — ${label}`}
              fill
              sizes="20vw"
              style={{ objectFit: 'cover' }}
            />
            ─────────────────────────────────────────────────────────
          */}
          <div className="photo-placeholder">
            <span className="photo-placeholder-label">Strip {slot}</span>
            <span className="photo-placeholder-label" style={{ opacity: 0.55 }}>{label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
