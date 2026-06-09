'use client'

import { useLanguage } from '@/lib/i18n/language-context'

export function BookPageHeader() {
  const { t } = useLanguage()
  
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.bookPage.title}</h1>
      <p className="text-muted-foreground">{t.bookPage.subtitle}</p>
    </div>
  )
}

export function NoSlotsMessage() {
  const { t } = useLanguage()
  
  return (
    <div className="text-center py-12 bg-card rounded-lg border border-border">
      <p className="text-muted-foreground">{t.bookPage.noSlotsDesc}</p>
    </div>
  )
}

export function NoMeetingTypesMessage() {
  const { t } = useLanguage()
  
  return (
    <div className="text-center py-12 bg-card rounded-lg border border-border">
      <p className="text-muted-foreground">{t.bookPage.noMeetingTypesDesc}</p>
    </div>
  )
}
