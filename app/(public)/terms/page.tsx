import type { Metadata } from 'next'
import UtilityPageShell, { UtilitySection } from '@/components/public/UtilityPageShell'
import { DEFAULT_BOOKING_EMAIL } from '@/lib/content-schema'

export const metadata: Metadata = {
  title: 'Booking & Site Terms',
  alternates: {
    canonical: '/terms',
  },
  description: 'Booking, payment, and site terms for DJ B.A.E. and The Bae Agenda.',
}

export default function TermsPage() {
  return (
    <UtilityPageShell
      eyebrow="Terms"
      title="Booking & Site Terms"
      currentPath="/terms"
      intro={
        <>
          <p>
            These terms explain the general booking, payment, client-portal, and website rules used by The Bae Agenda.
            A specific written quote, invoice, or agreed booking term controls if it says something different.
          </p>
          <p><strong>Effective September 28, 2026.</strong></p>
        </>
      }
    >
      <UtilitySection title="Inquiries and booking confirmation">
        <p>
          Submitting an inquiry does not reserve a date. A booking becomes confirmed only after the event details,
          pricing, and booking status have been accepted and any required deposit has been received.
        </p>
      </UtilitySection>

      <UtilitySection title="Quotes, invoices, and payment">
        <p>
          Quotes and invoices may include service line items, deposits or credits, payment terms, and a due date.
          Unless the written invoice says otherwise, the deposit is non-refundable, the remaining balance is due on or before
          the event date, and the final balance must be paid before the event.
        </p>
        <p>
          Payment records shown in the client portal reflect payments recorded by The Bae Agenda and may take time to update
          after a transfer or other offline payment.
        </p>
      </UtilitySection>

      <UtilitySection title="Changes, cancellations, and rescheduling">
        <p>
          Clients can request booking changes, rescheduling, or cancellation through the client portal or by contacting DJ B.A.E.
          A request does not automatically modify or cancel the booking. Changes are effective only after they are reviewed and confirmed in writing.
        </p>
        <p>
          Unless a written quote or invoice says otherwise, required deposits are non-refundable. Any refund, rescheduling credit,
          cancellation charge, or other exception is handled according to the written terms for that booking and the circumstances involved.
        </p>
      </UtilitySection>

      <UtilitySection title="Timing, overtime, travel, and scope changes">
        <p>
          The quoted service window, location, setup requirements, and requested services are part of the booking scope.
          Added performance time, major schedule changes, additional equipment or services, parking, tolls, or travel outside the quoted scope
          may require an updated quote or invoice.
        </p>
        <p>
          Overtime is not guaranteed and depends on availability, venue limits, and agreement on any additional charge.
        </p>
      </UtilitySection>

      <UtilitySection title="Venue access, setup, and event conditions">
        <p>
          Clients are responsible for providing accurate venue information and reasonable access for load-in, setup, performance, and breakdown.
          The venue must permit the contracted services and provide any agreed power, space, access, or other event requirements.
        </p>
      </UtilitySection>

      <UtilitySection title="Events outside either party's reasonable control">
        <p>
          If performance becomes impossible or materially unsafe because of severe weather, venue closure, government action, major outage,
          illness or emergency, or another circumstance outside reasonable control, the parties will communicate promptly and address
          rescheduling, credits, refunds, or other next steps under the written booking terms and the circumstances involved.
        </p>
      </UtilitySection>

      <UtilitySection title="Event details and client responsibilities">
        <p>
          Clients are responsible for providing accurate event timing, venue, access, setup, contact, and logistical information.
          Material changes to timing, location, scope, or requested services may require an updated quote or invoice.
        </p>
      </UtilitySection>

      <UtilitySection title="Client portal">
        <p>
          Portal access is intended only for the client associated with the booking. Verification codes and portal links should not
          be shared with someone who is not authorized to view the booking.
        </p>
      </UtilitySection>

      <UtilitySection title="Website content">
        <p>
          Site content, branding, photography, graphics, mixes, and other original materials remain the property of their respective
          owners and may not be copied or republished without permission except where ordinary sharing features allow it.
        </p>
      </UtilitySection>

      <UtilitySection title="Site availability">
        <p>
          The website and client portal may occasionally be unavailable for maintenance, provider outages, or other technical reasons.
          If an online feature is unavailable, booking questions and requests can still be handled by direct contact.
        </p>
      </UtilitySection>

      <UtilitySection title="Contact">
        <p>
          Questions about a booking, invoice, or these terms can be sent to{' '}
          <a href={`mailto:${DEFAULT_BOOKING_EMAIL}`} className="inline-link">
            {DEFAULT_BOOKING_EMAIL}
          </a>.
        </p>
      </UtilitySection>
    </UtilityPageShell>
  )
}
