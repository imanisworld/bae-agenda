# CLIENT PORTAL MVP

Purpose:
Give clients a simple, low-friction way to check their booking details and submit update or cancellation requests without exposing the admin panel.

This MVP is intentionally narrow.
It should feel like a private booking companion, not a second admin system.

---

## Product Goal

Clients should be able to:
- sign in with phone number plus a one-time code
- view their booking status and event details
- see payment progress and the existing payment link
- request an update or cancellation

Admin should be able to:
- keep using the current admin workflow
- review portal requests inside the existing booking detail workflow
- avoid managing passwords, support tickets, or a separate client CRM

---

## Why This Fits The Current App

The current codebase already has most of the right primitives:

- `clients` already stores `phone`, `email`, and booking relationships
- `bookings` already contains the event details a client would expect to see
- `payments` already supports deposit/balance history and status
- the public payment page at `/pay/[id]` already proves a booking-specific public surface can work
- admin booking detail already has notes, status, lifecycle, and payment context

That means the portal MVP can be mostly an access layer plus a small client-facing UI.

---

## MVP Scope

### 1. Sign-in

Use:
- phone number
- one-time verification code

Recommended behavior:
- client enters phone number
- app finds matching client record
- app sends a short numeric code by SMS
- client enters code
- app gets a short-lived portal session cookie

Keep it narrow:
- no passwords
- no full Supabase Auth migration for clients in v1
- no account settings page
- no multi-user household/team access in v1

Recommendation:
- use app-managed OTP records instead of mixing clients into the admin auth model
- one active code per phone number
- short expiration, for example 10 minutes
- basic rate limits by phone and IP

---

### 2. Client Portal Home

Route suggestion:
- `/portal`

First screen should show one primary booking card.

Recommended content:
- event name
- event date and timezone
- venue and city
- booking status
- lifecycle/payment status summary
- quote
- deposit amount
- amount received
- amount remaining
- payment CTA linking to existing `/pay/[id]`

If the client has multiple bookings:
- show a simple list
- default upcoming confirmed booking first
- allow tapping into a booking detail view

Do not add:
- invoices management
- downloadable contracts
- chat threads
- file uploads

---

### 3. Booking Detail View

Route suggestion:
- `/portal/bookings/[id]`

Recommended sections:
- event snapshot
- payment progress
- status timeline
- notes for the client

Timeline can stay very small:
- inquiry received
- confirmed
- deposit paid
- final payment requested
- completed

This aligns with the lean email flow already in the app.

---

### 4. Request Update / Cancellation

This is the key utility feature.

Client actions:
- request update
- request cancellation

For update request, capture:
- what changed
- preferred callback/contact method

For cancellation request, capture:
- reason
- whether they want follow-up by phone or email

Admin handling for MVP:
- create a structured `booking_notes` entry
- optionally mark a lightweight portal request status
- show the request in the existing booking detail page

Important:
- client request should not auto-edit the booking
- client request should not auto-cancel the booking
- admin stays in control of the source of truth

---

## Recommended Data Additions

Minimum new tables:

### `client_portal_codes`

Purpose:
Store one-time verification codes.

Suggested fields:
- `id`
- `client_id`
- `phone`
- `code_hash`
- `expires_at`
- `consumed_at`
- `created_at`
- `request_ip`

Notes:
- store only hashed codes
- delete or expire aggressively

### `client_portal_sessions`

Purpose:
Track active portal sessions.

Suggested fields:
- `id`
- `client_id`
- `token_hash`
- `expires_at`
- `revoked_at`
- `created_at`
- `last_seen_at`

Notes:
- cookie stores raw token
- database stores hash only

### `booking_portal_requests`

Purpose:
Capture client-originated update/cancellation requests in a structured way.

Suggested fields:
- `id`
- `booking_id`
- `client_id`
- `type` (`update` or `cancellation`)
- `message`
- `status` (`new`, `reviewed`, `resolved`)
- `created_at`
- `resolved_at`

Optional:
- mirror each request into `booking_notes` for admin visibility

---

## Route Plan

Public / client-facing routes:
- `/portal/login`
- `/portal/verify`
- `/portal`
- `/portal/bookings/[id]`
- `/portal/logout`

API or server actions:
- send one-time code
- verify one-time code
- load current client session
- submit booking portal request

Nice constraint:
- all portal routes should work without exposing admin-only fields or actions

---

## Security Rules

This matters more than visual polish.

Requirements:
- client can only access bookings tied to their own `client_id`
- portal session should be short-lived and renewable
- rate limit OTP send and verify endpoints
- generic error copy so phone-number enumeration is harder
- no raw payment admin metadata in portal views
- no admin actions available from portal routes

Suggested copy for lookup failure:
- "If that number matches a booking, we sent a code."

---

## Admin Integration

The admin panel should not need a redesign for v1.

Recommended additions:
- a small "Portal Requests" section on the booking detail page
- badge when a booking has unresolved portal requests
- quick actions:
  - mark reviewed
  - add internal note
  - contact client

This keeps the portal lightweight while still making requests operationally useful.

---

## Non-Goals For MVP

Do not build these yet:
- client password accounts
- contracts or signatures
- invoice PDF center
- direct client editing of booking fields
- automatic rescheduling workflow
- refund automation
- two-way messaging inbox
- push notifications

These are all valid later, but they will slow down the first useful version.

---

## Implementation Order

Phase 1:
- add portal OTP/session tables
- build `/portal/login` and `/portal/verify`
- create session helper utilities

Phase 2:
- build `/portal`
- show one booking summary and payment CTA
- reuse existing booking/payment helpers where possible

Phase 3:
- build `/portal/bookings/[id]`
- add status timeline and payment history

Phase 4:
- add update/cancellation request form
- persist structured requests
- surface them in admin booking detail

---

## Practical Recommendation

If you want the first version to ship fast, optimize for this story:

1. Client enters phone number
2. Client enters code
3. Client sees booking and payment status
4. Client can request a change
5. Admin reviews the request inside the booking record

That is enough to make the portal feel real without creating a second product to maintain.
