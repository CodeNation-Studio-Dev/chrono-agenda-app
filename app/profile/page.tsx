import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Navbar } from '@/components/navbar'
import { getCurrentUser } from '@/app/actions/scheduling'
import { ProfileView } from '@/components/profile-view'

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  return (
    <div className="min-h-svh bg-background">
      <Navbar user={user} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ProfileView user={user} />
      </main>
    </div>
  )
}
