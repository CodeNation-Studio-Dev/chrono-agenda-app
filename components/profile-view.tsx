'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useLanguage } from '@/lib/i18n/language-context'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { User } from '@/lib/db/schema'

interface ProfileViewProps {
  user: User
}

export function ProfileView({ user }: ProfileViewProps) {
  const { t } = useLanguage()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError(t.auth.passwordMismatch)
      return
    }

    setLoading(true)
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    })
    setLoading(false)

    if (error) {
      setError(error.message ?? t.common.error)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setSuccess(t.auth.passwordUpdated)
  }

  const handleSendResetEmail = async () => {
    setError(null)
    setSuccess(null)
    setResetLoading(true)

    const { error } = await authClient.requestPasswordReset({
      email: user.email ?? '',
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setResetLoading(false)

    if (error) {
      setError(error.message ?? t.common.error)
      return
    }

    setSuccess(t.auth.resetEmailSent)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t.profile.title}</h1>
        <p className="text-sm text-muted-foreground">{t.profile.subtitle}</p>
      </header>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-foreground">{t.profile.accountInfo}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">{t.auth.name}</p>
            <p className="text-sm text-foreground">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.auth.email}</p>
            <p className="text-sm text-foreground">{user.email || t.admin.noEmail}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.admin.phone}</p>
            <p className="text-sm text-foreground">{user.phone || t.profile.noPhone}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.profile.role}</p>
            <p className="text-sm text-foreground">{user.role}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-foreground">{t.profile.security}</h2>
        <p className="text-sm text-muted-foreground">{t.profile.changePasswordDesc}</p>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t.auth.currentPassword}</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
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

          <Button type="submit" disabled={loading}>
            {loading ? t.auth.pleaseWait : t.profile.updatePassword}
          </Button>
        </form>

        <div className="pt-2 border-t space-y-3">
          <p className="text-sm text-muted-foreground">{t.profile.resetPasswordDesc}</p>
          <Button variant="outline" onClick={handleSendResetEmail} disabled={resetLoading || !user.email}>
            {resetLoading ? t.auth.pleaseWait : t.profile.sendResetEmail}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-primary">{success}</p>}
      </Card>
    </div>
  )
}
