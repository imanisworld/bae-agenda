# REFERENCE.md

## Project Intent
This project is becoming a full app, not just a static site.

The long-term goal is one cohesive system with:
- a public-facing DJ / brand website
- a private admin dashboard
- one codebase
- one place to manage content, bookings, events, and payment status

The app should reduce dependence on third-party dashboards and tools as much as possible.

## What the Public Site Needs To Do
The public side should feel like an immersive DJ visual experience.

It should be:
- dark
- futuristic
- cinematic
- interactive
- polished
- premium
- memorable

It should not feel like:
- a generic portfolio
- a stiff resume site
- a template
- a link hub

The public site should support:
- DJ bookings
- personal brand presence
- mixes / media
- events
- job portfolio value

## What the Private Admin Needs To Do
The private side should make the site easy to run.

It should allow:
- viewing and managing bookings
- tracking payment status
- managing events
- viewing client/contact records
- adding notes
- updating public-facing content
- eventually reducing manual code edits for routine updates

The goal is to make the app feel like one system, not separate disconnected tools.

## Brand / Identity Notes
The site needs to hold both sides of me in one identity:
- DJ / creative
- builder / technical / systems thinker

That duality is a strength and should feel intentional, not split.

## Core Brand Statement
"I play songs you didn’t know you needed to hear again or for the first time in ways you haven’t heard before."

This should be treated as core brand language.

## Visual Direction
Preferred visual direction:
- immersive DJ visual experience
- dark background
- electric purple accents
- subtle gold accents
- clean white text
- minimal but atmospheric
- motion used intentionally
- slightly mysterious
- futuristic but elegant

## Interaction Direction
The experience should feel alive and tactile.

Good interaction ideas:
- subtle click pulse
- soft glow interactions
- hover lift on cards
- active scroll-aware nav
- subtle mouse-reactive hero motion
- cinematic section reveals
- ambient motion in hero

Avoid:
- clutter
- too many effects
- gimmicks
- anything that feels cheesy or game-like unless intentionally designed

## Public Site Pages / Areas
Likely public areas:
- Home
- About
- Mixes
- Events
- Book
- Connect / Contact

Potential later additions:
- Gallery / media
- Press kit / EPK
- Resume / tech profile crossover section
- Selected projects / technical work

## Admin Areas
Likely admin areas:
- Dashboard
- Bookings
- Events
- Clients
- Payments
- Notes
- Site content
- Settings (later)

## Data / Content Ideas
Key data the app will likely need:
- events
- bookings
- clients
- payments
- site content

Possible useful fields:
- event title
- venue
- event date
- event status
- public/private visibility
- booking status
- deposit paid
- final paid
- total amount
- client name
- client email
- notes
- featured flag

## Current Static Site Notes
The current static site is valuable as:
- a design reference
- a visual direction reference
- a copy/content source
- a source for reusable sections and styling ideas

The current static site should not be treated as the final architecture.

## Reusable Concepts From Current Version
Likely reusable:
- homepage layout direction
- hero concept
- vinyl / motion visual direction
- about copy
- mixes section concept
- events layout concept
- booking section concept
- tech / built-from-scratch concept
- general visual palette

## Things To Improve In The App Version
- stronger information architecture
- real content/data flow
- actual admin editing capability
- booking workflow
- payment tracking
- less manual updating
- stronger code organization
- better long-term maintainability

## Portfolio / Hiring Manager Angle
This project should also serve as a portfolio piece.

It should communicate:
- frontend skill
- interaction design thinking
- system design thinking
- practical data modeling
- admin workflow thinking
- product thinking
- accessibility and performance awareness

It should not just look good.
It should feel like a real product built with intention.

## Future Nice-to-Haves
- custom media uploader
- richer mix/media embeds
- better event publishing workflow
- richer analytics later
- role-based access later if ever needed
- customer inquiry pipeline
- calendar views
- reminders / follow-up workflow
- reusable CMS-like content blocks

## Decision Principles
When making decisions:
- prefer clarity over complexity
- prefer one cohesive system over many scattered tools
- prefer maintainability over cleverness
- prefer strong user experience over adding more features
- prefer subtle premium motion over flashy effects
- prefer realistic solo-builder architecture

## storage discipline
- The repository should remain lightweight and focused on code.
- Do NOT store large files in the repo: videos, raw DJ sets, music libraries, Blender project files, large exports
- Recommended locations for large media: YouTube / Vimeo (mix videos), Cloud storage (renders / archives), CDN / object storage (site assets later)
- < 500 MB ideally < 1 GB maximum