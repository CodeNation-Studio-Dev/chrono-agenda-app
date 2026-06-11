import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your Chrono Agenda account password.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/reset-password',
  },
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
