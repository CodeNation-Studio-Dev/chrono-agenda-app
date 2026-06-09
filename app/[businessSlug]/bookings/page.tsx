import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCurrentUser, getClientBookings, getAvailableSlots } from '@/app/actions/scheduling'
import { getBusinessBySlug, isBusinessMember } from '@/app/actions/business'
import { Navbar } from '@/components/navbar'
import { BookingsList } from '@/components/bookings-list'
import { BookingsPageHeader } from '@/components/bookings-page-content'

interface BookingsPageProps {
  params: Promise<{ businessSlug: string }>
}

export default async function BookingsPage({ params }: BookingsPageProps) {
  const { businessSlug } = await params

  const business = await getBusinessBySlug(businessSlug)
  if (!business) notFound()

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect(`/${businessSlug}/sign-in`)

  const user = await getCurrentUser()
  if (!user) redirect(`/${businessSlug}/sign-in`)
  if (user.role === 'admin') redirect('/admin')

  const member = await isBusinessMember(business.id)
  if (!member) redirect(`/${businessSlug}/book`)

  const [bookingsData, availableSlots] = await Promise.all([
    getClientBookings(business.id),
    getAvailableSlots(business.id),
  ])

  return (
    <div className="min-h-svh bg-background">
      <Navbar user={user} businessSlug={businessSlug} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <BookingsPageHeader />
        <BookingsList bookings={bookingsData} availableSlots={availableSlots} />
      </main>
    </div>
  )
}
