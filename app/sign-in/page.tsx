import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
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
  if (session?.user) redirect('/invalid-slug/sign-up')
  
  return <AuthForm mode="sign-in" />
}
