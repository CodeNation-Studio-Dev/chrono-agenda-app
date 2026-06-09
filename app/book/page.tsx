import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCurrentUser, getAvailableSlots, getMeetingTypes } from '@/app/actions/scheduling'
import { getBusinessSettings } from '@/app/actions/business'
import { Navbar } from '@/components/navbar'
import { BookingCalendar } from '@/components/booking-calendar'
import { BookPageHeader, NoSlotsMessage, NoMeetingTypesMessage } from '@/components/book-page-content'
import { BusinessBrandingHeader } from '@/components/business-branding-header'

export default async function BookPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  if (user.role === 'admin') redirect('/admin')

  const [slots, meetingTypes, businessSettings] = await Promise.all([
    getAvailableSlots(),
    getMeetingTypes(),
    getBusinessSettings()
  ])

  return (
    <div className="min-h-svh bg-background">
      <Navbar user={user} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <BusinessBrandingHeader settings={businessSettings} />

        <BookPageHeader />

        {meetingTypes.length === 0 ? (
          <NoMeetingTypesMessage />
        ) : slots.length === 0 ? (
          <NoSlotsMessage />
        ) : (
          <BookingCalendar slots={slots} meetingTypes={meetingTypes} />
        )}
      </main>
    </div>
  )
}
