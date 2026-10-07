# Product / Design Reference

## Project Intent

The Bae Agenda is a working DJ business application, not a static portfolio site.

It combines:

- public DJ brand / booking experience
- Events, Portfolio, Lab, Press Kit, reviews, and contact flows
- booking → invoice → payment → event workflow
- client-facing portal/payment experiences
- protected admin tools
- DJ Manager for lead discovery, relationships, outreach preparation, follow-up, and warm rebooks

Keep it feeling like one system rather than a collection of unrelated tools.

## Public-Site Goal

The public site should feel:

- intentional
- editorial
- modern
- premium
- tactile where interaction adds meaning
- unmistakably DJ B.A.E.

It should not feel like:

- a generic DJ template
- a résumé site
- a link hub
- a dashboard disguised as a website
- an interaction demo with too many controls

The best interactions should demonstrate taste, make proof easier to browse, or shorten the path to booking.

## Current Visual Direction

Preserve the current system:

- dark / moody base
- burgundy and warm neutral tones
- gold / chrome hardware accents
- strong photography
- generous whitespace
- restrained typography and copy
- subtle physical/tactile motion

Do not reintroduce the old electric-purple direction unless explicitly requested.

## Interaction Direction

Prefer:

- one clear interaction per purpose
- mobile swipe/snap where it improves browsing
- inline expansion over unnecessary modal/drawer stacks
- subtle hover/motion feedback
- existing player and navigation patterns
- reduced-motion support

Avoid:

- duplicated selectors
- multiple CTAs that lead to the same place
- decorative interactions that add no information
- nested drawers/modals
- large walls of filters
- fake “smart” behavior unsupported by real data

## Content / Proof Principles

Show proof instead of generic claims.

Useful proof includes:

- real past events
- stored event categories/locations/dates
- repeat or recurring work when verified
- real mixes and mashups
- real reviews
- related listening when clearly labeled as a recommendation

Do not imply that a mix was recorded at an event unless that is verified.

Do not invent:

- event facts
- client history
- dates
- pay
- contacts
- testimonials
- music provenance

## Current Public Information Architecture

Primary public areas include:

- Home
- Events
- Lab
- Portfolio
- Meet
- Book
- Press Kit / contact / secondary flows

Do not create replacement pages for working sections without a clear product reason.

## Current Private/Admin Direction

Admin should remain operational and task-focused.

Core areas include:

- Dashboard
- Manager
- Bookings
- Invoices
- Events
- Clients
- Payments
- Mixes
- Portfolio
- Reviews
- Content

Preserve the existing Booking → Invoice → Payment → Event workflow.

Manager work should follow its dedicated Manager docs rather than this design reference.

## Active Public Prototype

PR #142 is a draft/local-review experiment only.

Its current simplify-first direction is:

- homepage vibe selector
- two focused “From the Booth” project cards
- Portfolio browsing by useful event type/city
- inline event details
- related listening based on real metadata
- Lab lanes clarified as full sets vs mashups/experiments
- booking links that prefill the existing form
- mobile swipe/snap where useful

Do not restore previously removed prototype layers unless local testing proves they are necessary.

## Product / Engineering Principles

When deciding what to change:

- simplify before adding
- reuse before duplicating
- prefer one source of truth
- prefer maintainability over cleverness
- prefer strong UX over feature count
- keep public copy compact
- keep mobile first-class
- keep the repository lightweight
- keep large media out of git
- use existing external media/storage paths where appropriate

A change should make the site more distinctive, easier to understand, easier to use, or easier to maintain. If it does none of those, it probably should not be added.
