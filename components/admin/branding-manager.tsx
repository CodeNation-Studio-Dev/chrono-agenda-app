'use client'

import { useState, useRef } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { updateBusiness } from '@/app/actions/business'
import type { Business } from '@/lib/db/schema'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, Trash2, Building2, Check } from 'lucide-react'

const MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2MB

export function BrandingManager({ business }: { business: Business | null }) {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(business?.name ?? '')
  const [description, setDescription] = useState(business?.description ?? '')
  const [logoUrl, setLogoUrl] = useState<string | null>(business?.logoUrl ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    if (file.size > MAX_LOGO_BYTES) {
      setError(t.admin.logoHint)
      return
    }

    const reader = new FileReader()
    reader.onload = () => setLogoUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!business) return
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await updateBusiness(business.id, { name, description, logoUrl })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.admin.branding}</CardTitle>
        <CardDescription>{t.admin.brandingPreview}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col gap-3">
          <Label>{t.admin.logo}</Label>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl || "/placeholder.svg"} alt={name || 'Logo'} className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoSelect}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {logoUrl ? t.admin.changeLogo : t.admin.uploadLogo}
                </Button>
                {logoUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl(null)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t.admin.removeLogo}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t.admin.logoHint}</p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="business-name">{t.admin.businessName}</Label>
          <Input
            id="business-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.admin.businessNamePlaceholder}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="business-description">{t.admin.businessDescription}</Label>
          <Textarea
            id="business-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.admin.businessDescriptionPlaceholder}
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t.admin.saving : t.admin.save}
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-primary">
              <Check className="h-4 w-4" aria-hidden="true" />
              {t.admin.brandingSaved}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
