'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PaymentForm } from '@/components/payment-form'
import { useLanguage } from '@/lib/i18n/language-context'
import { Briefcase, ArrowRight } from 'lucide-react'

export function CreateBusinessRequest() {
  const router = useRouter()
  const { t } = useLanguage()
  const [showPayment, setShowPayment] = useState(false)

  if (showPayment) {
    return <PaymentForm onSuccess={() => setShowPayment(false)} />
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          {t.createBusiness.title}
        </CardTitle>
        <CardDescription>
          {t.createBusiness.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>{t.createBusiness.featuresTitle}</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{t.createBusiness.feature1}</li>
            <li>{t.createBusiness.feature2}</li>
            <li>{t.createBusiness.feature3}</li>
            <li>{t.createBusiness.feature4}</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => setShowPayment(true)} 
          className="w-full"
        >
          {t.createBusiness.continueToPayment}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
