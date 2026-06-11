'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useLanguage } from '@/lib/i18n/language-context'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const token = searchParams.get('token')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!token) {
      setError(t.auth.invalidResetToken)
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t.auth.passwordMismatch)
      return
    }

    setLoading(true)
    const { error } = await authClient.resetPassword({
      token,
      newPassword,
    })
    setLoading(false)

    if (error) {
      setError(error.message ?? t.auth.invalidResetToken)
      return
    }

    setSuccess(t.auth.passwordUpdated)
    setTimeout(() => {
      router.push('/sign-in')
      router.refresh()
    }, 1200)
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t.auth.resetPassword}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t.auth.newPassword}</Label>
            <Input
              id="newPassword"
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
            <Input
              id="confirmPassword"
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-primary">{success}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t.auth.pleaseWait : t.auth.resetPassword}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center">
          <Link href="/sign-in" className="text-primary hover:underline">
            {t.auth.signInBtn}
          </Link>
        </p>
      </Card>
    </main>
  )
}
