'use client'

import type { BusinessSettings } from '@/lib/db/schema'

export function BusinessBrandingHeader({ settings }: { settings: BusinessSettings | null }) {
  if (!settings || (!settings.name && !settings.description && !settings.logoUrl)) {
    return null
  }

  return (
    <div className="mb-8 flex flex-col items-center text-center gap-4 rounded-lg border border-border bg-card px-6 py-8">
      {settings.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.logoUrl || "/placeholder.svg"}
          alt={settings.name || 'Business logo'}
          className="h-16 w-auto max-w-[200px] object-contain"
        />
      ) : null}
      {settings.name ? (
        <h2 className="text-xl font-bold text-foreground text-balance">{settings.name}</h2>
      ) : null}
      {settings.description ? (
        <p className="text-muted-foreground max-w-xl text-pretty">{settings.description}</p>
      ) : null}
    </div>
  )
}
