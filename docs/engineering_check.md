# ENGINEERING_CHECKLIST.md

## Purpose
This file exists to keep the project stable, maintainable, and realistic.

The goal is not just to keep building features.
The goal is to build a system that remains:

- understandable
- performant
- secure
- not overbuilt
- safe to extend later

This checklist should be used regularly during development.

---

## 1. Architecture Sanity Check

Before adding a new feature, ask:

- Does this belong in V1?
- Does this reduce manual work?
- Does this belong in admin, public site, or both?
- Does this require a new table, or can an existing one support it?
- Does this add complexity without clear benefit?

If the answer is unclear, stop and simplify first.

---

## 2. Overbuilding Check

Signs the project is getting overbuilt:

- too many dependencies
- too many tables created before they are actually used
- too many pages without real workflows behind them
- adding tools before the base product works
- adding animations/effects before core UX works
- introducing advanced systems before CRUD flows are stable

Rule:
Build the smallest working version first.

---

## 3. Public Site Safety Check

The public site should never crash because of missing data.

Every public-facing section should have:
- a fallback state
- default copy
- empty-state handling
- safe rendering if Supabase returns nothing

Examples:
- no events → show a clean “no upcoming events” message
- no mixes → show placeholder card or hidden section
- no editable content row → use default hardcoded value

---

## 4. Admin Stability Check

The admin should not crash because of:
- missing rows
- missing auth session
- bad redirects
- broken imports
- missing optional data

Admin pages should:
- fail gracefully
- show placeholders when empty
- show useful empty states
- not assume all tables are populated yet

---

## 5. Auth Safety Check

Before launch:
- remove any temporary auth bypasses
- confirm admin routes are protected
- confirm login works in production, not just local
- confirm logout works
- confirm session persists across refresh
- confirm unauthorized users cannot access /admin pages

Temporary auth shortcuts must be clearly marked and removed before production.

---

## 6. Database Sanity Check

For every table:
- confirm the table is actually used
- confirm the app code matches the real column names
- confirm RLS policies exist where needed
- confirm sample/test data exists where useful
- confirm no duplicate or stale tables were accidentally created

Before adding a new table, ask:
- can an existing table handle this cleanly?
- is this needed now, or later?

---

## 7. Query / Data Flow Check

For each feature:
- where does the data live?
- who writes it?
- who reads it?
- what happens when it is empty?
- what happens when it fails?

Example:
`site_content`
- admin writes
- public homepage reads
- fallback values exist if missing

---

## 8. Performance Check

The project should remain lightweight and responsive.

Watch for:
- too many client components
- too much JavaScript on the homepage
- large images or video in repo
- unnecessary rerenders
- heavy animation without reduced-motion support
- unnecessary database requests

Rules:
- prefer server rendering where it makes sense
- keep client-only code focused
- use lazy loading where helpful
- keep the homepage fast

---

## 9. Visual/Interaction Restraint Check

The brand should feel:
- premium
- immersive
- dark
- futuristic
- intentional

Avoid:
- too many flashy effects
- clutter
- gimmicky animation
- random glow everywhere
- noisy dashboard UI

Rule:
Motion should add atmosphere, not chaos.

---

## 10. Repository Hygiene Check

The repo should contain:
- code
- small optimized assets
- docs
- config

The repo should NOT contain:
- raw videos
- large exports
- Blender files
- music libraries
- screenshots unless actually needed

Check regularly:
- `.gitignore`
- repo size
- accidental temp files
- accidental local-only config

---

## 11. Production Readiness Check

Before connecting the real domain:

- homepage works
- navigation works
- admin auth works
- fallback states exist
- events render correctly
- booking flow works
- content editor works
- no temporary dev bypass remains
- no secrets are exposed
- Vercel deployment is green

---

## 12. Weekly Reality Check

Every so often ask:

- What can I do now from the admin that I used to need another website for?
- What still requires going into Supabase directly?
- What still feels manual?
- What is actually useful today vs theoretical later?

This keeps the project grounded in real use.

---

## 13. Definition of "Good Enough"
A feature is “good enough” when:
- it works reliably
- it has safe fallback behavior
- it is understandable
- it fits the roadmap
- it reduces manual work

A feature is NOT done just because it looks cool.

---

## 14. Launch Blocking Issues
These block launch:

- broken auth
- broken booking flow
- broken public site data rendering
- missing fallbacks
- exposed secrets
- broken mobile layout
- temporary bypass still active

---

## 15. Preferred Build Order Rule

Use this order whenever possible:

1. structure
2. data model
3. safe query
4. admin edit path
5. public read path
6. polish

Not:
1. polish
2. complexity
3. debug later