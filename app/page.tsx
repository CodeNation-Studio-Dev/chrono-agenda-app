import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/app/actions/scheduling'
import { getFirstBusinessSlugForUser } from '@/app/actions/business'
import { Navbar } from '@/components/navbar'
import { HomeContent } from '@/components/home-content'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = await getCurrentUser()

  // If logged in, redirect based on role
  if (user) {
    if (user.role === 'admin') {
      redirect('/admin')
    } else {
      const firstBusinessSlug = await getFirstBusinessSlugForUser(user.id)
      if (firstBusinessSlug) {
        redirect(`/${firstBusinessSlug}/book`)
      }
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <Navbar user={user} />
      <HomeContent />
    </div>
  )
}
