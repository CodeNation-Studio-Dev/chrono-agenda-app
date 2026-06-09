import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getBusinessBySlug } from '@/app/actions/business'
import { AuthForm } from '@/components/auth-form'

interface SignUpPageProps {
  params: Promise<{ businessSlug: string }>
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { businessSlug } = await params

  const business = await getBusinessBySlug(businessSlug)
  if (!business) notFound()

  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect(`/${businessSlug}/book`)

  return <AuthForm mode="sign-up" businessSlug={businessSlug} businessName={business.name} />
}
