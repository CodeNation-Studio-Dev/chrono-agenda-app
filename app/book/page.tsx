import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/app/actions/scheduling'
import { getFirstBusinessSlugForUser } from '@/app/actions/business'

// The booking page is now business-scoped: /[businessSlug]/book
// This route exists only for backwards compatibility.
export default async function BookPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  if (user.role === 'system_manager') redirect('/system-manager')
  if (user.role === 'admin') redirect('/admin')

  const firstBusinessSlug = await getFirstBusinessSlugForUser(user.id)
  if (!firstBusinessSlug) redirect('/')
  redirect(`/${firstBusinessSlug}/book`)
}
