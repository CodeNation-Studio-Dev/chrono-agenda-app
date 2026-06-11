import { NextRequest, NextResponse } from 'next/server'
import { updateBusinessSubscriptionPaymentMethod } from '@/app/actions/recurring-billing'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      businessId?: number
      providerCustomerId?: string
      providerPaymentMethodToken?: string
      providerSubscriptionId?: string
    }

    if (!body.businessId || !Number.isFinite(body.businessId)) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    if (!body.providerCustomerId?.trim() || !body.providerPaymentMethodToken?.trim()) {
      return NextResponse.json({ error: 'providerCustomerId and providerPaymentMethodToken are required' }, { status: 400 })
    }

    await updateBusinessSubscriptionPaymentMethod({
      businessId: body.businessId,
      providerCustomerId: body.providerCustomerId,
      providerPaymentMethodToken: body.providerPaymentMethodToken,
      providerSubscriptionId: body.providerSubscriptionId ?? null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update payment method'
    const status = message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
