import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Navbar } from '@/components/navbar'
import { getCurrentUser } from '@/app/actions/scheduling'
import { getSystemManagerOverview } from '@/app/actions/system-manager'
import { SystemManagerDashboard } from '@/components/system-manager-dashboard'

export default async function SystemManagerPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'system_manager') redirect('/')

  const overview = await getSystemManagerOverview()

  return (
    <div className="min-h-svh bg-background">
      <Navbar user={user} />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <SystemManagerDashboard
          businesses={overview.businesses}
          admins={overview.admins}
          adminBusinessCounts={overview.adminBusinessCounts}
        />
      </main>
    </div>
  )
}
