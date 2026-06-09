import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCurrentUser, getAvailableSlots, getMeetingTypes } from '@/app/actions/scheduling'
import { getBusinessBySlug, joinBusiness } from '@/app/actions/business'
import { Navbar } from '@/components/navbar'
import { BookingCalendar } from '@/components/booking-calendar'
import { BookPageHeader, NoSlotsMessage, NoMeetingTypesMessage } from '@/components/book-page-content'
import { BusinessBrandingHeader } from '@/components/business-branding-header'

interface BookPageProps {
  params: Promise<{ businessSlug: string }>
}

export default async function BookPage({ params }: BookPageProps) {
  const { businessSlug } = await params

  const business = await getBusinessBySlug(businessSlug)
  if (!business) notFound()

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect(`/${businessSlug}/sign-in`)

  const user = await getCurrentUser()
  if (!user) redirect(`/${businessSlug}/sign-in`)
  if (user.role === 'admin') redirect('/admin')

  // Auto-join the business when a client lands on the booking page
  await joinBusiness(business.id)

  const [slots, meetingTypes] = await Promise.all([
    getAvailableSlots(business.id),
    getMeetingTypes(business.id),
  ])

  return (
    <div className="min-h-svh bg-background">
      <Navbar user={user} businessSlug={businessSlug} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <BusinessBrandingHeader business={business} />

        <BookPageHeader />

        {meetingTypes.length === 0 ? (
          <NoMeetingTypesMessage />
        ) : slots.length === 0 ? (
          <NoSlotsMessage />
        ) : (
          <BookingCalendar slots={slots} meetingTypes={meetingTypes} businessId={business.id} businessSlug={businessSlug} />
        )}
      </main>
    </div>
  )
}
