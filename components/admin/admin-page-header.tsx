'use client'

import { useLanguage } from '@/lib/i18n/language-context'

export function AdminPageHeader() {
  const { t, language } = useLanguage()
  
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.admin.dashboard}</h1>
      <p className="text-muted-foreground">
        {language === 'es' 
          ? 'Gestiona tu disponibilidad, tipos de cita y ve las reservas'
          : 'Manage your availability, meeting types, and view bookings'}
      </p>
    </div>
  )
}
