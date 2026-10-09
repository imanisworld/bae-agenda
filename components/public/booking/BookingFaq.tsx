/**
 * BOOKING FAQ
 * The questions clients actually ask before booking, answered on the page
 * that does the conversion work. Native <details> accordion — no JS needed.
 * Rendered below the booking form on /book.
 */

export const BOOKING_FAQ = [
  {
    question: 'How far in advance should I book?',
    answer:
      'As early as you can — weekend and holiday dates go first. If your date is coming up soon, send it anyway; the form checks the calendar in real time.',
  },
  {
    question: 'What happens after I send the inquiry?',
    answer:
      'I’ll reply with availability and a quote based on your event. Sending the form does not charge you or hold the date; it just gets the conversation started.',
  },
  {
    question: 'How does payment work?',
    answer:
      'Once the details are confirmed, a deposit holds your date. The remaining balance is due before the event. Invoices and payment details come by email. If you need an updated balance or receipt, contact me directly.',
  },
  {
    question: 'What kinds of events do you play?',
    answer:
      'Weddings, private parties, corporate events, club nights, brand activations, festivals, and everything in between.',
  },
  {
    question: 'Do you travel?',
    answer:
      'Yes. I’m based in Indianapolis with roots in Chicago, and I travel. Add your city to the request and I’ll include travel in the quote.',
  },
  {
    question: 'Can you play my must-have songs?',
    answer:
      'Absolutely. Send your must-plays and do-not-plays. I work open-format across house, hip-hop, R&B, Latin, soca, jungle, juke, ballroom, and more, then shape the set around the room.',
  },
] as const

export default function BookingFaq() {
  return (
    <section aria-label="Booking questions" style={{ background: 'var(--off-black)' }}>
      <div className="section-container" style={{ maxWidth: '680px', paddingTop: 0, paddingBottom: '96px' }}>
        <div style={{ marginBottom: '28px' }}>
          <span className="section-label">Booking FAQ</span>
          <h2
            style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: 'clamp(22px, 3.5vw, 32px)',
              fontWeight: 600,
              color: 'var(--white)',
              lineHeight: 1.15,
              margin: '12px 0 0',
            }}
          >
            Common Questions
          </h2>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {BOOKING_FAQ.map((item) => (
            <details key={item.question} className="booking-faq-item">
              <summary className="booking-faq-question">{item.question}</summary>
              <p className="booking-faq-answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
