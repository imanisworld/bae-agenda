# ROUTES.md

This file defines the route structure for the application.

The app has two main areas:

1. Public site
2. Admin dashboard

---

# Public Routes

/  
Homepage

/about  
About / brand story

/mixes  
DJ mixes and media

/events  
Public events listing

/book  
Booking inquiry page

/connect  
Socials / contact / platforms

---

# Admin Routes

/admin  
Admin login page

/admin/dashboard  
Main overview

/admin/events  
View and manage events

/admin/events/new  
Create event

/admin/events/[id]  
Edit event

/admin/bookings  
View all bookings

/admin/bookings/[id]  
View/edit booking

/admin/clients  
Client list

/admin/clients/[id]  
Client details

/admin/payments  
Payment tracking overview

/admin/settings  
Future settings page

---

# Access Rules

Public routes:
- accessible by anyone

Admin routes:
- require authentication

If user is not logged in:
redirect to `/admin`

---

# Future Routes (Not V1)

These are intentionally not built in V1.

/admin/media
/admin/analytics
/admin/contracts
/admin/invoices
/blog
/client-portal