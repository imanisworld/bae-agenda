/**
 * /connect — redirects to the connect section on the homepage.
 * This prevents a 404 for any links that point to /connect.
 */
import { redirect } from 'next/navigation'

export default function ConnectPage() {
  redirect('/#connect')
}
