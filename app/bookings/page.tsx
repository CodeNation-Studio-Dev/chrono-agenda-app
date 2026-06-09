import { redirect } from 'next/navigation'

// Bookings are now business-scoped: /[businessSlug]/bookings
export default function BookingsPage() {
  redirect('/')
}
