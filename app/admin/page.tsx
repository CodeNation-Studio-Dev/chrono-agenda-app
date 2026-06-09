import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCurrentUser, getAdminSlots, getAllMeetingTypes, getAdminBookings, getAllUsers } from '@/app/actions/scheduling'
import { getBusinessSettings } from '@/app/actions/business'
import { Navbar } from '@/components/navbar'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'admin') redirect('/book')

  const [slots, meetingTypes, bookings, businessSettings, users] = await Promise.all([
    getAdminSlots(),
    getAllMeetingTypes(),
    getAdminBookings(),
    getBusinessSettings(),
    getAllUsers()
  ])

  return (
    <div className="min-h-svh bg-background">
      <Navbar user={user} />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <AdminPageHeader />

        <AdminDashboard 
          slots={slots} 
          meetingTypes={meetingTypes} 
          bookings={bookings}
          businessSettings={businessSettings}
          users={users}
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}
