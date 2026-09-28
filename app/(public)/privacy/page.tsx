import type { Metadata } from 'next'
import UtilityPageShell, { UtilitySection } from '@/components/public/UtilityPageShell'
import { DEFAULT_BOOKING_EMAIL } from '@/lib/content-schema'

export const metadata: Metadata = {
  title: 'Privacy & Cookies',
  alternates: {
    canonical: '/privacy',
  },
  description: 'Privacy and cookie information for thebaeagenda.com and The Bae Agenda client portal.',
}

export default function PrivacyPage() {
  return (
    <UtilityPageShell
      eyebrow="Privacy"
      title="Privacy & Cookies"
      currentPath="/privacy"
      intro={
        <>
          <p>
            The Bae Agenda collects only the information needed to run the site, respond to booking inquiries,
            manage client records, send booking communications, track invoices and payments, operate the client portal,
            and honor mix-notification requests.
          </p>
          <p><strong>Effective September 28, 2026.</strong></p>
        </>
      }
    >
      <UtilitySection title="Information you provide">
        <p>
          Booking and contact forms may collect your name, email address, phone number, event details, venue or city,
          requested services, notes, and other information you choose to submit.
        </p>
        <p>
          If a booking is created directly by DJ B.A.E. in the admin system, the same kinds of client and event details
          may be stored so the booking can be managed consistently.
        </p>
      </UtilitySection>

      <UtilitySection title="Client portal and verification">
        <p>
          The client portal uses a phone number to locate eligible booking records and to send a one-time verification code.
          Portal sessions and verification records are used to provide secure access without requiring a password.
        </p>
        <p>
          Clients may use the portal to review booking and payment information and submit update or cancellation requests.
          Those requests do not automatically change a booking.
        </p>
      </UtilitySection>

      <UtilitySection title="Invoices, payments, and business records">
        <p>
          Booking records may include quotes, deposits, invoice details, payment status, payment method, payment history,
          due dates, and internal administrative notes. Full payment-card numbers are not stored by this site.
        </p>
        <p>
          Booking and payment records may be retained as reasonably needed for business operations, accounting,
          security, recordkeeping, and resolving questions about a booking.
        </p>
      </UtilitySection>

      <UtilitySection title="Emails, texts, and delivery records">
        <p>
          Contact information may be used to send inquiry receipts, booking confirmations, invoices, payment reminders,
          event-related follow-ups, review requests, portal verification codes, and replies to client requests.
        </p>
        <p>
          Basic delivery metadata may be recorded so failed or delivered messages can be tracked and support issues can be diagnosed.
        </p>
      </UtilitySection>

      <UtilitySection title="Cookies, browser storage, and analytics">
        <p>
          Essential cookies or browser storage may be used for sessions and site behavior. The booking form stores an unfinished
          booking draft in your browser for up to 14 days so an accidental reload does not erase it. The Lab may also cache public
          mix data in browser storage to reduce repeated requests. These browser-stored items stay on the device unless the browser
          or user clears them.
        </p>
        <p>
          The site uses Vercel Analytics and Speed Insights to understand aggregate traffic, browser or device patterns,
          performance, and site reliability.
        </p>
        <p>
          Embedded or linked third-party media, including SoundCloud or YouTube when present, may set their own cookies
          or collect information under their own privacy practices.
        </p>
      </UtilitySection>

      <UtilitySection title="Service providers">
        <p>
          Current providers include Vercel for hosting, analytics, and performance monitoring; Supabase for database, authentication,
          and storage; Resend for email delivery; Stripe for card-payment processing; Upstash for rate limiting; and SoundCloud or
          YouTube for media features. Twilio may be used for text-message delivery when SMS features are enabled.
        </p>
        <p>
          Information is shared with those providers only as needed to operate the relevant service. Full payment-card numbers are
          handled by the payment processor and are not stored by this site.
        </p>
        <p>
          Personal information is not sold to advertisers.
        </p>
      </UtilitySection>

      <UtilitySection title="Mix notification requests">
        <p>
          If you use a “Notify Me” form for new mixes, the submitted email address is sent to The Bae Agenda&apos;s business inbox
          so the requested notification can be managed. That submission does not create a site account.
        </p>
      </UtilitySection>

      <UtilitySection title="Your choices and requests">
        <p>
          You may ask about personal information associated with your booking, request a correction, or ask whether information
          can be deleted when it is no longer required for an active booking or legitimate business recordkeeping need.
        </p>
      </UtilitySection>

      <UtilitySection title="Contact">
        <p>
          For privacy questions or requests related to information you submitted, email{' '}
          <a href={`mailto:${DEFAULT_BOOKING_EMAIL}`} className="inline-link">
            {DEFAULT_BOOKING_EMAIL}
          </a>.
        </p>
      </UtilitySection>
    </UtilityPageShell>
  )
}
