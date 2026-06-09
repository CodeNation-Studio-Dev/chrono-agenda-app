'use client'

import { useLanguage } from '@/lib/i18n/language-context'

export function BookingsPageHeader() {
  const { t } = useLanguage()
  
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.bookings.title}</h1>
      <p className="text-muted-foreground">{t.bookings.subtitle}</p>
    </div>
  )
}
