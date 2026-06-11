import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/app/actions/scheduling'
import { cookies } from 'next/headers'
import { getFirstBusinessSlugForUser, getUserBusinessesForUser } from '@/app/actions/business'
import { AuthForm } from '@/components/auth-form'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Chrono Agenda account.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/sign-in',
  },
}

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) {
    const user = await getCurrentUser()

    if (!user) redirect('/sign-in')
    if (user.role === 'system_manager') redirect('/system-manager')
    if (user.role === 'admin') redirect('/admin')

    if (user.role === 'client') {
      const preferredSlug = (await cookies()).get('chrono_preferred_business')?.value ?? null
      const userBusinesses = await getUserBusinessesForUser(user.id)

      if (preferredSlug && userBusinesses.some((b) => b.slug === preferredSlug)) {
        redirect(`/${preferredSlug}/book`)
      }

      const firstBusinessSlug = await getFirstBusinessSlugForUser(user.id)
      if (firstBusinessSlug) {
        redirect(`/${firstBusinessSlug}/book`)
      }
      redirect('/invalid-slug/sign-up')
    }

    redirect('/create-business')
  }
  
  return <AuthForm mode="sign-in" />
}
