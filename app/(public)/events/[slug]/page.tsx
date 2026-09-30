import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EventPoster, { eventArtwork } from '@/components/public/EventPoster'
import { getPublicEventBySlug } from '@/lib/db/events'
import { isValidTimeZone } from '@/lib/date-time'
import { isUpcomingEventRecord } from '@/lib/event-schedule'
import styles from './page.module.css'

const SITE_URL = 'https://thebaeagenda.com'

function eventDateLabel(eventDate: string, timeZone: string | null) {
  const zone = timeZone && isValidTimeZone(timeZone) ? timeZone : 'UTC'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: zone,
  }).format(new Date(eventDate))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const event = await getPublicEventBySlug(slug)

  if (!event) {
    return {
      title: 'Event Not Found | DJ B.A.E.',
      robots: { index: false, follow: false },
    }
  }

  const canonical = `/events/${event.slug}`
  const date = eventDateLabel(event.event_date, event.event_timezone)
  const location = [event.venue, event.city].filter(Boolean).join(', ')
  const description =
    event.show_description && event.description
      ? event.description
      : `${event.title} — ${[date, location].filter(Boolean).join(' · ')}. DJ B.A.E.`
  const title = `${event.title} | DJ B.A.E.`
  const image = `${SITE_URL}${eventArtwork(event)}`

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      siteName: 'DJ B.A.E. | The Bae Agenda',
      locale: 'en_US',
      type: 'website',
      title,
      description,
      url: `${SITE_URL}${canonical}`,
      images: [{ url: image, alt: `${event.title} — DJ B.A.E.` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getPublicEventBySlug(slug)
  if (!event) notFound()

  const past = !isUpcomingEventRecord(event, new Date())
  const validTimeZone = Boolean(event.event_timezone && isValidTimeZone(event.event_timezone))
  const hasLocation = Boolean(event.venue || event.city)
  const canonicalUrl = `${SITE_URL}/events/${event.slug}`

  const eventJsonLd =
    validTimeZone && hasLocation
      ? {
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: event.title,
          startDate: event.event_date,
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          url: canonicalUrl,
          image: [`${SITE_URL}${eventArtwork(event)}`],
          ...(event.show_description && event.description ? { description: event.description } : {}),
          location: {
            '@type': 'Place',
            ...(event.venue ? { name: event.venue } : {}),
            ...(event.city
              ? {
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: event.city,
                  },
                }
              : {}),
          },
          performer: {
            '@type': 'Person',
            '@id': `${SITE_URL}/#dj-bae`,
            name: 'DJ B.A.E.',
            url: SITE_URL,
          },
        }
      : null

  return (
    <section className={styles.page} aria-labelledby="event-detail-title">
      {eventJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(eventJsonLd).replace(/</g, '\\u003c'),
          }}
        />
      ) : null}

      <div className={styles.toolbar}>
        <Link href="/events" className={styles.back}>
          <span aria-hidden="true">←</span> All events
        </Link>
        <span className="section-label" id="event-detail-title">Event details</span>
      </div>

      <EventPoster event={event} priority past={past} headingLevel="h1" />

      <div className={styles.actions}>
        <Link href="/events" className="btn-ghost">Back to events</Link>
        <Link href="/book" className="btn-primary">Book DJ B.A.E.</Link>
      </div>
    </section>
  )
}
