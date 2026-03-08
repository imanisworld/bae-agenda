/**
 * /book — redirects to the booking section on the homepage.
 * Full booking form is planned for a future phase.
 * This prevents a 404 for any links that point to /book.
 */
import { redirect } from 'next/navigation'

export default function BookPage() {
  redirect('/#booking')
}
