import { VerifyEmailForm } from '@/components/verify-email-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address to access Chrono Agenda.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/verify-email',
  },
}

export default function VerifyEmailPage() {
  return <VerifyEmailForm />
}
