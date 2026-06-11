'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createClipCheckout } from '@/lib/clip'

type ClipPaymentPurpose = 'admin_upgrade_paid' | 'business_membership'

interface CreateClipCheckoutParams {
  purpose: ClipPaymentPurpose
  amount: number
  description: string
  businessId?: number
  successPath?: string
  cancelPath?: string
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL
    || process.env.BETTER_AUTH_URL
    || 'http://localhost:3000'
  ).replace(/\/$/, '')
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

export async function createClipCheckoutSession(params: CreateClipCheckoutParams) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new Error('Invalid payment amount')
  }

  const baseUrl = getBaseUrl()
  const encodedUserId = encodeBase64Url(session.user.id)
  const businessToken = params.businessId ? String(params.businessId) : '0'
  const reference = `clip_${params.purpose}_${encodedUserId}_${businessToken}_${Date.now()}`

  const successUrl = `${baseUrl}${params.successPath ?? '/payments/clip/success'}?reference=${encodeURIComponent(reference)}`
  const cancelUrl = `${baseUrl}${params.cancelPath ?? '/payments/clip/cancel'}?reference=${encodeURIComponent(reference)}`

  const checkout = await createClipCheckout({
    amount: params.amount,
    currency: 'MXN',
    description: params.description,
    reference,
    customerEmail: session.user.email,
    successUrl,
    cancelUrl,
    metadata: {
      purpose: params.purpose,
      userId: session.user.id,
      businessId: params.businessId ?? null,
    },
  })

  return {
    checkoutUrl: checkout.checkoutUrl,
    reference,
    providerPaymentId: checkout.providerPaymentId,
  }
}
