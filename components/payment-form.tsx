'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upgradeUserToAdmin } from '@/app/actions/admin-upgrade'
import { createClipCheckoutSession } from '@/app/actions/clip-payments'
import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { CreditCard, CheckCircle2, Loader2 } from 'lucide-react'

interface PaymentFormProps {
  onSuccess: () => void
  /** Custom async action to run on successful payment. Defaults to upgradeUserToAdmin + redirect /admin. */
  onPay?: () => Promise<void>
  successTitle?: string
  successDescription?: string
}

export function PaymentForm({ onSuccess, onPay, successTitle, successDescription }: PaymentFormProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()
  const clipEnabled = Boolean(process.env.NEXT_PUBLIC_CLIP_PUBLIC_KEY)
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (onPay) {
        // Keep current behavior for custom business payment callbacks.
        await new Promise((resolve) => setTimeout(resolve, 1500))
        await onPay()
      } else if (clipEnabled) {
        const { checkoutUrl } = await createClipCheckoutSession({
          purpose: 'admin_upgrade_paid',
          amount: 999,
          description: 'Chrono Agenda - Admin membership payment',
        })

        router.push(checkoutUrl)
        return
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        // Default: upgrade user to admin role
        await upgradeUserToAdmin('paid')
      }

      setPaymentComplete(true)
      toast({
        title: successTitle ?? t.payment.successDefault,
        description: successDescription ?? t.payment.successDescDefault,
      })

      setTimeout(() => {
        onSuccess()
        if (!onPay) {
          router.push('/admin')
          router.refresh()
        }
      }, 1500)
    } catch (error) {
      toast({
        title: t.payment.failed,
        description: error instanceof Error ? error.message : t.payment.failedDesc,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (paymentComplete) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">{successTitle ?? t.payment.successDefault}</CardTitle>
          <CardDescription>
            {successDescription ?? t.payment.successDescDefault}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t.payment.title}
        </CardTitle>
        <CardDescription>
          {onPay ? t.payment.subtitleBusiness : t.payment.subtitle}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardName">{t.payment.nameOnCard}</Label>
            <Input
              id="cardName"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cardNumber">{t.payment.cardNumber}</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">{t.payment.expiryDate}</Label>
              <Input
                id="expiry"
                value={expiryDate}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '').slice(0, 4)
                  if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2)
                  }
                  setExpiryDate(value)
                }}
                placeholder="MM/YY"
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">{t.payment.cvv}</Label>
              <Input
                id="cvv"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.payment.processing}
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {t.payment.payBtn}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
