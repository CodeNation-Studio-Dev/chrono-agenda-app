import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/app/actions/scheduling'
import { getFirstBusinessSlugForUser } from '@/app/actions/business'
import { Navbar } from '@/components/navbar'
import { HomeContent } from '@/components/home-content'

export const metadata: Metadata = {
  title: 'Online Booking Software for Teams',
  description:
    'Manage meeting availability, client bookings, and reminders with Chrono Agenda. Built for admins, clients, and multi-business scheduling.',
  alternates: {
    canonical: '/',
  },
}

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = await getCurrentUser()

  // If logged in, redirect based on role
  if (user) {
    if (user.role === 'system_manager') {
      redirect('/system-manager')
    } else if (user.role === 'admin') {
      redirect('/admin')
    } else if (user.role === 'client') {
      const firstBusinessSlug = await getFirstBusinessSlugForUser(user.id)
      if (firstBusinessSlug) {
        redirect(`/${firstBusinessSlug}/book`)
      }
    }
    // If role is 'pending', show the home page with option to create a business
  }

  return (
    <div className="min-h-svh bg-background">
      <Navbar user={user} />
      <HomeContent />
    </div>
  )
}
