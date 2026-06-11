import { NextRequest, NextResponse } from 'next/server'
import { finalizeAdminUpgradePaid, finalizeBusinessMembershipPaid } from '@/app/actions/clip-finalize'
import { db } from '@/lib/db'
import { businessSubscriptions, paymentTransactions } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

type ClipPurpose = 'admin_upgrade_paid' | 'business_membership' | 'business_membership_renewal'

function normalizePaymentStatus(status: string | null | undefined): string {
  return (status ?? '').toLowerCase().trim()
}

function isPaidStatus(status: string): boolean {
  return ['paid', 'approved', 'succeeded', 'completed'].includes(status)
}

function parseReference(reference: string | null | undefined) {
  if (!reference) return null

  const pieces = reference.split('_')
  if (pieces[0] !== 'clip') return null

  let purpose: ClipPurpose
  let userIdEncoded: string
  let businessRaw: string
  let subscriptionRaw: string | null = null

  // clip + admin + upgrade + paid + user + business + timestamp
  if (pieces.length >= 7 && pieces[1] === 'admin' && pieces[2] === 'upgrade' && pieces[3] === 'paid') {
    purpose = 'admin_upgrade_paid'
    userIdEncoded = pieces[4]
    businessRaw = pieces[5]
  // clip + business + membership + user + business + timestamp
  } else if (pieces.length >= 6 && pieces[1] === 'business' && pieces[2] === 'membership') {
    purpose = 'business_membership'
    userIdEncoded = pieces[3]
    businessRaw = pieces[4]
  // clip + business + membership + renewal + user + business + subscription + timestamp
  } else if (
    pieces.length >= 8
    && pieces[1] === 'business'
    && pieces[2] === 'membership'
    && pieces[3] === 'renewal'
  ) {
    purpose = 'business_membership_renewal'
    userIdEncoded = pieces[4]
    businessRaw = pieces[5]
    subscriptionRaw = pieces[6]
  } else {
    return null
  }

  let userId: string
  try {
    userId = Buffer.from(userIdEncoded, 'base64url').toString('utf8')
  } catch {
    return null
  }

  const businessId = businessRaw === '0' ? null : Number(businessRaw)
  if (businessRaw !== '0' && (!Number.isFinite(businessId) || businessId === null)) {
    return null
  }

  const subscriptionId = subscriptionRaw === null ? null : Number(subscriptionRaw)
  if (subscriptionRaw !== null && (!Number.isFinite(subscriptionId) || subscriptionId === null)) {
    return null
  }

  return {
    purpose,
    userId,
    businessId,
    subscriptionId,
  }
}

function extractPayload(json: Record<string, unknown>) {
  const data = (json.data as Record<string, unknown> | undefined) ?? json
  const metadata = (data.metadata as Record<string, unknown> | undefined)
    ?? (json.metadata as Record<string, unknown> | undefined)

  const status = normalizePaymentStatus(
    (data.status as string | undefined)
    ?? (json.status as string | undefined),
  )

  const reference =
    (data.reference as string | undefined)
    ?? (json.reference as string | undefined)
    ?? (data.order_id as string | undefined)

  const providerPaymentId =
    (data.id as string | undefined)
    ?? (json.id as string | undefined)
    ?? (data.payment_id as string | undefined)
    ?? (json.payment_id as string | undefined)

  const providerCustomerId =
    (data.customer_id as string | undefined)
    ?? (metadata?.providerCustomerId as string | undefined)
    ?? (metadata?.customerId as string | undefined)

  const providerPaymentMethodToken =
    (data.payment_method_token as string | undefined)
    ?? (metadata?.providerPaymentMethodToken as string | undefined)
    ?? (metadata?.paymentMethodToken as string | undefined)

  const providerSubscriptionId =
    (data.subscription_id as string | undefined)
    ?? (metadata?.providerSubscriptionId as string | undefined)
    ?? (metadata?.subscriptionId as string | undefined)

  return {
    status,
    reference,
    providerPaymentId,
    providerCustomerId,
    providerPaymentMethodToken,
    providerSubscriptionId,
  }
}

async function isAlreadyProcessed(providerPaymentId: string | undefined) {
  if (!providerPaymentId) return false
  const existing = await db
    .select({ id: paymentTransactions.id })
    .from(paymentTransactions)
    .where(and(eq(paymentTransactions.providerPaymentId, providerPaymentId), eq(paymentTransactions.status, 'paid')))
    .limit(1)
  return existing.length > 0
}

async function saveWebhookPaidTransaction(params: {
  providerPaymentId: string
  subscriptionId: number
  businessId: number
  ownerId: string
  amount: number
  currency: string
}) {
  const idempotencyKey = `webhook_${params.providerPaymentId}`
  const exists = await db
    .select({ id: paymentTransactions.id })
    .from(paymentTransactions)
    .where(eq(paymentTransactions.idempotencyKey, idempotencyKey))
    .limit(1)
  if (exists.length > 0) return

  await db.insert(paymentTransactions).values({
    subscriptionId: params.subscriptionId,
    businessId: params.businessId,
    ownerId: params.ownerId,
    provider: 'clip',
    providerPaymentId: params.providerPaymentId,
    idempotencyKey,
    status: 'paid',
    amount: params.amount,
    currency: params.currency,
    paidAt: new Date(),
    updatedAt: new Date(),
  })
}

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.CLIP_WEBHOOK_SECRET
    const incomingSecret = request.headers.get('x-clip-webhook-secret')

    if (expectedSecret && incomingSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
    }

    const body = await request.json() as Record<string, unknown>
    const {
      status,
      reference,
      providerPaymentId,
      providerCustomerId,
      providerPaymentMethodToken,
      providerSubscriptionId,
    } = extractPayload(body)

    if (!isPaidStatus(status)) {
      return NextResponse.json({ received: true, ignored: true, reason: 'status_not_paid' })
    }

    if (await isAlreadyProcessed(providerPaymentId)) {
      return NextResponse.json({ received: true, processed: false, duplicate: true })
    }

    const parsed = parseReference(reference)
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid payment reference' }, { status: 400 })
    }

    if (parsed.purpose === 'admin_upgrade_paid') {
      await finalizeAdminUpgradePaid(parsed.userId)
    } else if (parsed.purpose === 'business_membership' && parsed.businessId) {
      await finalizeBusinessMembershipPaid(parsed.userId, parsed.businessId, {
        providerCustomerId,
        providerPaymentMethodToken,
        providerSubscriptionId,
      })
    } else if (parsed.purpose === 'business_membership_renewal' && parsed.businessId && parsed.subscriptionId) {
      await finalizeBusinessMembershipPaid(parsed.userId, parsed.businessId, {
        providerCustomerId,
        providerPaymentMethodToken,
        providerSubscriptionId,
      })

      const sub = await db
        .select()
        .from(businessSubscriptions)
        .where(eq(businessSubscriptions.id, parsed.subscriptionId))
        .limit(1)

      if (sub.length > 0 && providerPaymentId) {
        await saveWebhookPaidTransaction({
          providerPaymentId,
          subscriptionId: sub[0].id,
          businessId: sub[0].businessId,
          ownerId: sub[0].ownerId,
          amount: sub[0].amount,
          currency: sub[0].currency,
        })
      }
    } else {
      return NextResponse.json({ error: 'Unsupported payment purpose' }, { status: 400 })
    }

    return NextResponse.json({ received: true, processed: true })
  } catch (error) {
    console.error('Clip webhook error:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}
