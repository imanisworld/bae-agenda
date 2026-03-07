# V1_SCOPE.md

## Purpose
Version 1 of this app should deliver a working public website plus a private admin dashboard.

The goal of V1 is to create one cohesive system that:

- presents the DJ / brand publicly
- allows private management of bookings and events
- tracks key business information
- reduces dependence on multiple outside tools
- is realistic for a solo builder to complete

V1 should be useful, polished, and launchable.

It does NOT need to solve every future need.

## V1 Success Criteria
V1 is successful if:

- the public site feels strong and intentional
- the admin area is private and usable
- bookings can be captured and managed
- events can be created and shown publicly
- payment status can be tracked
- the system is clean enough to grow later

## In Scope: Public Website

### Homepage
Must include:
- hero section
- brand/about section
- featured mixes or media section
- featured or upcoming events section
- booking call to action
- contact/connect section

### Mixes
Must support:
- displaying featured mixes
- linking out to platforms like YouTube / SoundCloud

### Events
Must support:
- listing public upcoming events
- basic event details

### Booking
Must support:
- booking inquiry form
- submission into the system

### Contact / Connect
Must support:
- social/platform links
- direct contact pathways

## In Scope: Admin Dashboard

### Authentication
Must include:
- protected admin login
- authenticated access to admin routes only

### Dashboard
Must include:
- high-level overview of bookings/events
- basic summary counts or status visibility

### Bookings Management
Must support:
- create booking
- view bookings
- edit booking
- delete booking
- track booking status
- connect booking to a client
- add notes

### Events Management
Must support:
- create event
- view events
- edit event
- delete event
- mark whether event is public
- display public events on the website

### Clients
Must support:
- client name
- email
- phone if needed
- notes
- connection to bookings

### Payments
Must support:
- deposit paid status
- final payment paid status
- unpaid / partial / paid state
- optional amount fields

## In Scope: Data Model
V1 should likely include:
- events
- bookings
- clients
- payments

Optional if helpful:
- site_content

## Reuse From Current Static Site
V1 should reuse or adapt:
- current design direction
- current visual language
- brand copy where useful
- homepage layout inspiration
- mixes/events/booking section concepts
- immersive dark futuristic aesthetic

## Out of Scope for V1
The following should NOT be built in V1 unless clearly necessary:

- full CMS for every page
- custom media uploader
- advanced analytics
- invoices
- contracts
- customer portal
- multi-user roles
- automated reminders
- calendar sync with outside calendars
- blog/newsletter system
- AI-driven features
- complex search/filter systems
- advanced reporting dashboards

## UX Priorities
V1 should prioritize:
- clarity
- usability
- speed
- clean visual hierarchy
- maintainable architecture
- subtle premium interactions

## Technical Priorities
V1 should prioritize:
- clean routing
- clean database structure
- secure auth
- simple CRUD flows
- reusable components
- readable code
- strong portfolio quality

## Build Philosophy
For V1:
- prefer simple over clever
- prefer usable over exhaustive
- prefer strong fundamentals over extra features
- build a solid base for V2