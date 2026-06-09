'use client'

import type { Business } from '@/lib/db/schema'

export function BusinessBrandingHeader({ business }: { business: Business | null }) {
  if (!business || (!business.name && !business.description && !business.logoUrl)) {
    return null
  }

  return (
    <div className="mb-8 flex flex-col items-center text-center gap-4 rounded-lg border border-border bg-card px-6 py-8">
      {business.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={business.logoUrl}
          alt={business.name || 'Business logo'}
          className="h-16 w-auto max-w-[200px] object-contain"
        />
      ) : null}
      {business.name ? (
        <h2 className="text-xl font-bold text-foreground text-balance">{business.name}</h2>
      ) : null}
      {business.description ? (
        <p className="text-muted-foreground max-w-xl text-pretty">{business.description}</p>
      ) : null}
    </div>
  )
}
