import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getBusinessBySlug } from '@/app/actions/business'
import { AuthForm } from '@/components/auth-form'

interface SignInPageProps {
  params: Promise<{ businessSlug: string }>
}

export async function generateMetadata({ params }: SignInPageProps): Promise<Metadata> {
  const { businessSlug } = await params
  const business = await getBusinessBySlug(businessSlug)

  if (!business) {
    return {
      title: 'Sign In',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `Sign In to ${business.name}`,
    description: `Sign in to book meetings with ${business.name}.`,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${businessSlug}/sign-in`,
    },
  }
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { businessSlug } = await params

  const business = await getBusinessBySlug(businessSlug)
  if (!business) notFound()

  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect(`/${businessSlug}/book`)

  return <AuthForm mode="sign-in" businessSlug={businessSlug} businessName={business.name} />
}
