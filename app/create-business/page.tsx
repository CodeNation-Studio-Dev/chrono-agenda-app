import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/app/actions/scheduling'
import { Navbar } from '@/components/navbar'
import { CreateBusinessRequest } from '@/components/create-business-request'

export const metadata: Metadata = {
  title: 'Create Business',
  description: 'Upgrade your account to create and manage your own business.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/create-business',
  },
}

export default async function CreateBusinessPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  if (user.role === 'system_manager') redirect('/system-manager')
  if (user.role === 'admin') redirect('/admin')

  return (
    <div className="min-h-svh bg-background">
      <Navbar user={user} />
      <main className="max-w-4xl mx-auto px-4 py-8 flex justify-center">
        <CreateBusinessRequest />
      </main>
    </div>
  )
}
