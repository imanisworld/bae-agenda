# ROADMAP_DETAILED.md

## Phase 0 — Foundation and Recovery
Purpose:
Stabilize project setup, deployment, Git, and environment configuration.

Complete when:
- Git is healthy
- repo points to the correct remote
- Vercel is connected
- Supabase env vars are correct
- accidental home-folder Git repo is gone
- app deploys successfully

Notes:
This phase is mostly complete.

---

## Phase 1 — Public Site Stabilization
Purpose:
Make the public website feel intentional, navigable, and editable.

Tasks:
- connect header nav links to page section ids
- enable smooth scrolling
- confirm hero section hierarchy
- restore custom cursor
- restore subtle hero movement / parallax
- restore richer contrast and glow
- restore music-inspired micro-interactions
- ensure homepage sections have clean spacing and alignment
- ensure fallback content exists for missing database content

Done when:
- homepage feels strong visually
- homepage navigation works
- homepage does not feel flat
- homepage can safely render with or without database content

---

## Phase 2 — Content Management Layer
Purpose:
Make core website copy editable without opening Supabase directly.

Tasks:
- build `/admin/content`
- use `site_content` as editable source of truth
- support editing:
  - hero_title
  - hero_subtitle
  - primary CTA
  - secondary CTA
  - about quote
  - social links
  - booking email
- seed missing rows gracefully
- wire homepage to read from `site_content`
- add fallback content if records are missing

Done when:
- admin can update homepage copy and links
- public homepage reflects changes from admin
- Supabase dashboard is no longer needed for routine content edits

---

## Phase 3 — Events System
Purpose:
Make events manageable and visible on the site.

Tasks:
- confirm `events` table schema
- build admin events page
- support:
  - create event
  - edit event
  - delete event
  - toggle public
  - toggle featured
- show public upcoming events on homepage
- create or improve `/events` page
- add empty state when no events exist

Done when:
- event updates happen through admin
- public site reads events from database
- no manual code edits are needed for event updates

---

## Phase 4 — Mixes System
Purpose:
Make mixes manageable and keep the site musically alive.

Tasks:
- confirm `mixes` schema
- build admin mixes page
- support:
  - title
  - platform URL
  - cover image
  - genre or tag
  - featured flag
- wire homepage / mixes page to read from `mixes`
- add clean placeholders if missing

Done when:
- mixes can be updated from admin
- public site reads real mix data
- “Listen to Mixes” feels connected to real content

---

## Phase 5 — Booking Intake
Purpose:
Make the website receive real booking inquiries.

Tasks:
- build or stabilize booking form
- save submissions into `bookings`
- assign default status:
  - inquiry
- capture:
  - name
  - email
  - phone
  - event date
  - event type
  - location
  - notes
- show entries in admin bookings page
- confirm public submission works in production

Done when:
- someone can submit a booking inquiry
- it appears in admin
- no external form tool is needed

---

## Phase 6 — Dashboard With Meaning
Purpose:
Turn the admin dashboard into a real control panel.

Tasks:
- summary cards:
  - new inquiries
  - confirmed bookings
  - upcoming events
  - payments due
- recent bookings list
- upcoming events list
- payment reminders list
- use real data where possible
- use graceful placeholders otherwise

Done when:
- dashboard answers “what needs my attention?”
- dashboard feels useful, not decorative

---

## Phase 7 — Clients and Payments
Purpose:
Make the business side operational.

Tasks:
- build clients page
- build payments page
- relate bookings to clients
- track deposit / final / paid / unpaid
- show useful badges and statuses
- add notes support

Done when:
- booking and payment status can be managed internally
- admin replaces scattered notes/spreadsheets for core workflows

---

## Phase 8 — Expenses / Tax Support
Purpose:
Reduce tax pain later without trying to become full accounting software.

Tasks:
- create `expenses` workflow if not already done
- categorize expenses
- support simple reports
- show:
  - revenue totals
  - expense totals
  - rough net
- allow export-friendly structure

Done when:
- system can help prepare tax info
- no need to reconstruct everything from memory later

---

## Phase 9 — Auth Cleanup
Purpose:
Replace temporary shortcuts with real secure auth.

Tasks:
- remove admin bypass
- stabilize login flow
- confirm session persistence
- protect `/admin`
- confirm unauthorized access is blocked
- verify production login works reliably

Done when:
- admin is properly protected
- temporary bypass code is removed
- auth no longer blocks normal use

---

## Phase 10 — Launch Readiness
Purpose:
Prepare for real domain cutover.

Tasks:
- mobile QA
- copy polish
- CTA polish
- social links check
- fallback states check
- remove dev-only helpers
- test Vercel production
- connect GoDaddy domain when ready

Done when:
- site can replace old version safely
- you can actually use admin weekly
- the public experience feels complete enough to share

---

## V2 / Later
These are later, not now:

- FullCalendar admin calendar
- React Email notifications
- invoices
- contracts
- client portal
- analytics
- advanced media library
- role-based permissions
- automation/reminders