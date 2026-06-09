import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCurrentUser, getClientBookings, getAvailableSlots } from '@/app/actions/scheduling'
import { Navbar } from '@/components/navbar'
import { BookingsList } from '@/components/bookings-list'
import { BookingsPageHeader } from '@/components/bookings-page-content'

export default async function BookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  if (user.role === 'admin') redirect('/admin')

  const [bookingsData, availableSlots] = await Promise.all([
    getClientBookings(),
    getAvailableSlots()
  ])

  return (
    <div className="min-h-svh bg-background">
      <Navbar user={user} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <BookingsPageHeader />
        <BookingsList bookings={bookingsData} availableSlots={availableSlots} />
      </main>
    </div>
  )
}
