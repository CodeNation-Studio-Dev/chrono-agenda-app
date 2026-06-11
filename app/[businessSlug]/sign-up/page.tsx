import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getBusinessBySlug } from '@/app/actions/business'
import { AuthForm } from '@/components/auth-form'

interface SignUpPageProps {
  params: Promise<{ businessSlug: string }>
}

export async function generateMetadata({ params }: SignUpPageProps): Promise<Metadata> {
  const { businessSlug } = await params
  const business = await getBusinessBySlug(businessSlug)

  if (!business) {
    return {
      title: 'Create Account',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `Create Account for ${business.name}`,
    description: `Create an account to schedule meetings with ${business.name}.`,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${businessSlug}/sign-up`,
    },
  }
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { businessSlug } = await params

  const business = await getBusinessBySlug(businessSlug)
  if (!business) notFound()

  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect(`/${businessSlug}/book`)

  return <AuthForm mode="sign-up" businessSlug={businessSlug} businessName={business.name} />
}
