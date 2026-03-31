# DATA MODEL NOTES

This document describes the real-world data the app needs to manage.

## Events

Represents a public event where DJ B.A.E. is performing.

Fields:
- id
- title
- venue
- city
- event_date
- description
- public (boolean)
- featured (boolean)
- created_at

Example:
Title: Late Night Sessions
Venue: The Listening Room
City: Chicago
Date: 2026-04-15

---

## Clients

Represents a person or organization booking DJ services.

Fields:
- id
- full_name
- email
- phone
- notes
- created_at

Example:
Name: Jane Smith
Email: jane@email.com
Phone: 312-555-4412

---

## Bookings

Represents a DJ service request or confirmed job.

Fields:
- id
- client_id
- event_name
- event_type
- event_date
- end_time
- venue
- city
- package
- hours
- status
- quote
- deposit_amount
- notes
- created_at
- updated_at

Status values:
- inquiry
- confirmed
- completed
- cancelled

---

## Payments

Represents payments tied to bookings.

Fields:
- id
- booking_id
- type
- method
- amount
- status
- paid_at
- notes
- created_at
- updated_at

Payment types:
- deposit
- balance
- full
- refund

Payment status:
- pending
- received
- refunded
