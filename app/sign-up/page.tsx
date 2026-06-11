import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { AuthForm } from '@/components/auth-form'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a Chrono Agenda account to start booking and managing meetings.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/sign-up',
  },
}

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/invalid-slug/sign-up')
  
  return <AuthForm mode="sign-up" />
}
