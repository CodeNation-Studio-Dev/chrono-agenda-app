import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/app/actions/scheduling'
import { getFirstBusinessSlugForUser } from '@/app/actions/business'

// Bookings are now business-scoped: /[businessSlug]/bookings
export default async function BookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  if (user.role === 'admin') redirect('/admin')

  const firstBusinessSlug = await getFirstBusinessSlugForUser(user.id)
  if (!firstBusinessSlug) redirect('/')
  redirect(`/${firstBusinessSlug}/bookings`)
}
