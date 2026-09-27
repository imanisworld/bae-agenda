/**
 * CONTENT SCHEMA
 * Single source of truth for editable site content fields.
 * Used by both the admin editor and the public site (for defaults).
 *
 * When adding a new editable field:
 *   1. Add it here.
 *   2. It appears in /admin/content automatically.
 *   3. Update the relevant public component to read it.
 */

export type FieldType = 'text' | 'textarea' | 'url' | 'email'

export const DEFAULT_BOOKING_EMAIL = 'baebookings@proton.me'

export interface ContentField {
  key:     string
  label:   string
  hint?:   string
  type:    FieldType
  default: string
}

export interface ContentGroup {
  title:  string
  fields: ContentField[]
}

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    title: 'Hero',
    fields: [
      {
        key:     'hero_title',
        label:   'Hero Title',
        hint:    'Main headline displayed on the homepage',
        type:    'text',
        default: 'THE BAE AGENDA',
      },
      {
        key:     'hero_subtitle',
        label:   'Hero Subtitle',
        hint:    'Tagline beneath the headline',
        type:    'textarea',
        default: 'From intimate gatherings to club takeovers — music is always the agenda.',
      },
    ],
  },
  {
    title: 'About',
    fields: [
      {
        key:     'about_quote',
        label:   'Bio / About',
        hint:    'Short bio shown in the Built section',
        type:    'textarea',
        default: 'From the South Side of Chicago, DJ B.A.E. brings a sound shaped by genre-defying curiosity. Her artistic journey deepened during her years in Boston, where the intersection of visual art and music helped ignite her creative fire. Now based in Indianapolis, DJ B.A.E. is known for genre-fluid sets that move between hip-hop, R&B, bass, house, juke, ATL bass, Jersey and Baltimore club, jungle, baile, and underground edits with intention and cultural awareness. With over five years behind the decks, she has played everything from art shows to community events and festivals. A graduate of Deckademics, she continues to sharpen her turntablism and scratching while holding down a professional career as an IT specialist with a degree in Computer Engineering. Whether activating a dancefloor, curating community spaces, or blending edits made by underground artists and friends, DJ B.A.E. is more than a DJ: she is a connector, a technician, and a vessel for the stories living in the music.',
      },
    ],
  },
  {
    title: 'Social Links',
    fields: [
      {
        key:     'instagram_url',
        label:   'Instagram URL',
        type:    'url',
        default: 'https://www.instagram.com/dj_b.a.e/',
      },
      {
        key:     'soundcloud_url',
        label:   'SoundCloud URL',
        type:    'url',
        default: 'https://soundcloud.com/deejaybae',
      },
      {
        key:     'youtube_url',
        label:   'YouTube URL',
        type:    'url',
        default: 'https://www.youtube.com/channel/UCjEiMW5l_Go9vSHudx5VPEw',
      },
    ],
  },
  {
    title: 'Contact',
    fields: [
      {
        key:     'booking_email',
        label:   'Booking Email',
        hint:    'Email address for booking inquiries',
        type:    'email',
        default: DEFAULT_BOOKING_EMAIL,
      },
    ],
  },
]

// ── Convenience helpers ────────────────────────────────────────────────────────

/** All fields as a flat array */
export const CONTENT_FIELDS: ContentField[] =
  CONTENT_GROUPS.flatMap(g => g.fields)

/** key → default value map for use as fallback on the public site */
export const CONTENT_DEFAULTS: Record<string, string> =
  Object.fromEntries(CONTENT_FIELDS.map(f => [f.key, f.default]))

/** All field keys as a typed array */
export const CONTENT_KEYS = CONTENT_FIELDS.map(f => f.key)
