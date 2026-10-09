# ROUTES.md

Every page and endpoint the app serves, grouped by who uses it. Keep this in
step with `app/` when pages are added, moved or removed.

---

# Public site

Main nav (dock): Home, Events, Lab, Portfolio, Meet, Book.
More menu and footer: Contact, Built, Press Kit, Privacy, Terms, Accessibility.

The unfinished Client Portal is temporarily unlinked from public navigation and booking copy. Its routes and code remain available for internal testing; hiding its links does not disable direct URL access.

| Route | What it is |
| --- | --- |
| `/` | Homepage |
| `/events` | Upcoming sets, club nights and appearances |
| `/events/[slug]` | One event, with its flyer and past-event media |
| `/lab` | Bae's in the Lab: mixes, mashups and edits (live from SoundCloud playlists) |
| `/portfolio` | Gig history, featured events and press |
| `/meet` | About DJ B.A.E. |
| `/book` | Booking form, Contact + FAQ tab, and approved client reviews |
| `/built` | Custom web development for artists and brands |
| `/press-kit` | Bio, booking info and selected work |
| `/privacy` | Privacy and cookies |
| `/terms` | Booking, payment and site terms |
| `/accessibility` | Accessibility information |

## Redirects

| From | To |
| --- | --- |
| `/mixes` | `/lab` |
| `/connect` | `/book#contact` (the Book page reads the hash and opens the Contact + FAQ tab) |
| `/experience`, `/gigs` | `/portfolio` (permanent, in `next.config.ts`) |

---

# Client pages

| Route | What it is |
| --- | --- |
| `/pay/[id]` | Deposit payment page for one booking (link shared with the client) |
| `/portal/login` | Unlisted client portal phone sign-in (not ready for public use) |
| `/portal/verify` | Unlisted phone verification step (not ready for public use) |
| `/portal` | Client's bookings |
| `/portal/bookings/[id]` | One booking: details, payments, change or cancel requests |

---

# Control room (admin)

Every `/admin/*` page except `/admin/login` needs an allowlisted admin login.
Signed-out visitors are sent to `/admin/login` (see `proxy.ts`).
`/admin` and `/admin-demo` redirect to the dashboard.

| Route | What it is |
| --- | --- |
| `/admin/login` | Admin sign-in |
| `/admin/dashboard` | Overview; cards open the matching page |
| `/admin/manager` | Manager: opportunities pipeline |
| `/admin/manager/opportunities/new`, `/[id]` | Add or work an opportunity |
| `/admin/manager/sources` | Sources watchlist |
| `/admin/manager/profile` | Manager profile used for fit scoring and outreach |
| `/admin/bookings` | All bookings |
| `/admin/bookings/new` | Add a booking (client email optional) |
| `/admin/bookings/[id]` | One booking: workflow, "Got Paid?", payments, emails, notes |
| `/admin/bookings/[id]/invoice` | Invoice preview, download and send |
| `/admin/bookings/[id]/invoice/edit` | Edit the invoice snapshot |
| `/admin/invoices` | Invoice register and the blank fillable invoice |
| `/admin/invoices/new` | Create an invoice from a booking |
| `/admin/events`, `/new`, `/[id]` | Events, flyers, media, and "Invoice this event" |
| `/admin/mixes`, `/new`, `/[id]` | Mixes |
| `/admin/portfolio`, `/new`, `/[id]` | Portfolio entries |
| `/admin/clients`, `/[id]` | Clients |
| `/admin/payments` | Payments across all bookings |
| `/admin/reviews` | Approve or remove submitted reviews |
| `/admin/content` | Editable site copy |
| `/admin/w9` | Saved W-9 details and PDF |

---

# API

| Route | What it does |
| --- | --- |
| `POST /api/booking` | Public booking form submission |
| `/api/booking/blocked-dates`, `/api/booking/check-availability` | Date availability for the booking form |
| `/api/invoice/[id]` | Invoice PDF for a booking (admin) |
| `/api/invoice/[id]/send` | Email the invoice or a reminder (admin) |
| `/api/invoice/blank` | Blank fillable invoice PDF (admin) |
| `/api/w9` | W-9 PDF (admin) |
| `/api/cron/payment-reminders` | Daily payment reminder cron (`vercel.json`, 15:00 UTC) |
| `/api/stripe/webhook` | Stripe payment events |
| `/api/resend/webhook` | Email delivery events (sent, delivered, bounced, complained) |
| `/api/instagram/webhook` | Instagram webhook |
| `/api/notify-signup` | Signup notifications |
| `/api/client-errors` | Browser error reports |
| `/api/health` | Health check |
