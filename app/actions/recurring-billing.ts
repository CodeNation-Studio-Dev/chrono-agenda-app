'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { businesses, businessSubscriptions, paymentTransactions, user } from '@/lib/db/schema'
import { createClipRecurringCharge } from '@/lib/clip'
import { and, eq, inArray, isNotNull, lte } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

const DEFAULT_MONTHLY_AMOUNT = 999
const MAX_RETRY_COUNT = 3

async function requireAdminUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')

  const record = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (record.length === 0 || record[0].role !== 'admin') {
    throw new Error('Admin access required')
  }

  return session.user.id
}

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000)
}

function addMonths(base: Date, months: number) {
  const d = new Date(base)
  d.setMonth(d.getMonth() + months)
  return d
}

function buildRetryDate(base: Date, retryCount: number): Date | null {
  if (retryCount === 1) return addDays(base, 1)
  if (retryCount === 2) return addDays(base, 3)
  return null
}

export async function updateBusinessSubscriptionPaymentMethod(params: {
  businessId: number
  providerCustomerId: string
  providerPaymentMethodToken: string
  providerSubscriptionId?: string | null
}) {
  const adminId = await requireAdminUserId()
  const now = new Date()

  if (!params.providerCustomerId.trim() || !params.providerPaymentMethodToken.trim()) {
    throw new Error('Customer id and payment method token are required')
  }

  const biz = await db
    .select({ id: businesses.id, ownerId: businesses.ownerId })
    .from(businesses)
    .where(and(eq(businesses.id, params.businessId), eq(businesses.ownerId, adminId)))
    .limit(1)

  if (biz.length === 0) {
    throw new Error('Business not found')
  }

  const existing = await db
    .select()
    .from(businessSubscriptions)
    .where(eq(businessSubscriptions.businessId, params.businessId))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(businessSubscriptions).values({
      businessId: params.businessId,
      ownerId: adminId,
      provider: 'clip',
      providerCustomerId: params.providerCustomerId.trim(),
      providerPaymentMethodToken: params.providerPaymentMethodToken.trim(),
      providerSubscriptionId: params.providerSubscriptionId?.trim() || null,
      plan: 'monthly',
      amount: DEFAULT_MONTHLY_AMOUNT,
      currency: 'MXN',
      status: 'past_due',
      nextBillingAt: now,
      retryCount: 0,
      canceledAt: null,
      updatedAt: now,
    })
  } else {
    const nextBillingAt = existing[0].nextBillingAt ?? now
    const nextStatus = existing[0].status === 'active' ? 'active' : 'past_due'

    await db
      .update(businessSubscriptions)
      .set({
        ownerId: adminId,
        providerCustomerId: params.providerCustomerId.trim(),
        providerPaymentMethodToken: params.providerPaymentMethodToken.trim(),
        providerSubscriptionId: params.providerSubscriptionId?.trim() || existing[0].providerSubscriptionId,
        status: nextStatus,
        nextBillingAt,
        canceledAt: null,
        updatedAt: now,
      })
      .where(eq(businessSubscriptions.id, existing[0].id))
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function upsertBusinessSubscriptionOnPayment(params: {
  businessId: number
  ownerId: string
  amount?: number
  currency?: string
  providerCustomerId?: string | null
  providerPaymentMethodToken?: string | null
  providerSubscriptionId?: string | null
}) {
  const now = new Date()
  const currentPeriodEnd = addMonths(now, 1)

  const existing = await db
    .select()
    .from(businessSubscriptions)
    .where(eq(businessSubscriptions.businessId, params.businessId))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(businessSubscriptions).values({
      businessId: params.businessId,
      ownerId: params.ownerId,
      provider: 'clip',
      providerCustomerId: params.providerCustomerId ?? null,
      providerPaymentMethodToken: params.providerPaymentMethodToken ?? null,
      providerSubscriptionId: params.providerSubscriptionId ?? null,
      plan: 'monthly',
      amount: params.amount ?? DEFAULT_MONTHLY_AMOUNT,
      currency: params.currency ?? 'MXN',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd,
      nextBillingAt: currentPeriodEnd,
      retryCount: 0,
      lastPaymentAt: now,
      updatedAt: now,
    })
    return
  }

  await db
    .update(businessSubscriptions)
    .set({
      ownerId: params.ownerId,
      provider: 'clip',
      providerCustomerId: params.providerCustomerId ?? existing[0].providerCustomerId,
      providerPaymentMethodToken: params.providerPaymentMethodToken ?? existing[0].providerPaymentMethodToken,
      providerSubscriptionId: params.providerSubscriptionId ?? existing[0].providerSubscriptionId,
      amount: params.amount ?? existing[0].amount,
      currency: params.currency ?? existing[0].currency,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd,
      nextBillingAt: currentPeriodEnd,
      retryCount: 0,
      lastPaymentAt: now,
      canceledAt: null,
      updatedAt: now,
    })
    .where(eq(businessSubscriptions.id, existing[0].id))
}

async function saveTransaction(params: {
  subscriptionId: number
  businessId: number
  ownerId: string
  idempotencyKey: string
  status: 'paid' | 'failed'
  amount: number
  currency: string
  providerPaymentId?: string | null
  errorMessage?: string | null
  rawPayload?: unknown
}) {
  await db.insert(paymentTransactions).values({
    subscriptionId: params.subscriptionId,
    businessId: params.businessId,
    ownerId: params.ownerId,
    provider: 'clip',
    providerPaymentId: params.providerPaymentId ?? null,
    idempotencyKey: params.idempotencyKey,
    status: params.status,
    amount: params.amount,
    currency: params.currency,
    errorMessage: params.errorMessage ?? null,
    rawPayload: params.rawPayload ? JSON.stringify(params.rawPayload) : null,
    paidAt: params.status === 'paid' ? new Date() : null,
    updatedAt: new Date(),
  })
}

async function markBusinessSuspended(subscriptionId: number) {
  const sub = await db
    .select({ businessId: businessSubscriptions.businessId })
    .from(businessSubscriptions)
    .where(eq(businessSubscriptions.id, subscriptionId))
    .limit(1)

  if (sub.length === 0) return

  await db
    .update(businesses)
    .set({
      membershipPaid: false,
      membershipPaidAt: null,
      isDisabled: true,
      disabledAt: new Date(),
      disabledReason: 'Recurring membership payment failed after multiple retries.',
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, sub[0].businessId))
}

async function markBusinessPaid(businessId: number) {
  await db
    .update(businesses)
    .set({
      membershipPaid: true,
      membershipPaidAt: new Date(),
      trialEndsAt: null,
      isDisabled: false,
      disabledAt: null,
      disabledReason: null,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId))
}

export async function renewDueMembershipSubscriptions() {
  const now = new Date()

  const dueSubscriptions = await db
    .select()
    .from(businessSubscriptions)
    .where(
      and(
        inArray(businessSubscriptions.status, ['active', 'past_due']),
        isNotNull(businessSubscriptions.nextBillingAt),
        lte(businessSubscriptions.nextBillingAt, now),
      ),
    )

  let processed = 0
  let paid = 0
  let failed = 0
  let canceled = 0

  for (const sub of dueSubscriptions) {
    processed += 1
    const idempotencyKey = `renew_${sub.id}_${Date.now()}_${sub.retryCount}`
    const reference = `clip_business_membership_renewal_${Buffer.from(sub.ownerId, 'utf8').toString('base64url')}_${sub.businessId}_${sub.id}_${Date.now()}`

    if (!sub.providerCustomerId || !sub.providerPaymentMethodToken) {
      const nextRetry = sub.retryCount + 1
      const mustCancel = nextRetry >= MAX_RETRY_COUNT

      await db
        .update(businessSubscriptions)
        .set({
          status: mustCancel ? 'canceled' : 'past_due',
          retryCount: nextRetry,
          nextBillingAt: mustCancel ? null : buildRetryDate(now, nextRetry),
          canceledAt: mustCancel ? now : null,
          updatedAt: now,
        })
        .where(eq(businessSubscriptions.id, sub.id))

      if (mustCancel) {
        await markBusinessSuspended(sub.id)
        canceled += 1
      } else {
        failed += 1
      }

      await saveTransaction({
        subscriptionId: sub.id,
        businessId: sub.businessId,
        ownerId: sub.ownerId,
        idempotencyKey,
        status: 'failed',
        amount: sub.amount,
        currency: sub.currency,
        errorMessage: 'Missing provider customer or payment method token',
      })

      continue
    }

    try {
      const charge = await createClipRecurringCharge({
        amount: sub.amount,
        currency: sub.currency,
        description: 'Chrono Agenda - Monthly membership renewal',
        reference,
        customerId: sub.providerCustomerId,
        paymentMethodToken: sub.providerPaymentMethodToken,
        idempotencyKey,
        metadata: {
          purpose: 'business_membership_renewal',
          businessId: sub.businessId,
          subscriptionId: sub.id,
          ownerId: sub.ownerId,
        },
      })

      if (charge.succeeded) {
        const currentPeriodStart = now
        const currentPeriodEnd = addMonths(now, 1)

        await db
          .update(businessSubscriptions)
          .set({
            status: 'active',
            retryCount: 0,
            currentPeriodStart,
            currentPeriodEnd,
            nextBillingAt: currentPeriodEnd,
            lastPaymentAt: now,
            canceledAt: null,
            updatedAt: now,
          })
          .where(eq(businessSubscriptions.id, sub.id))

        await markBusinessPaid(sub.businessId)
        await saveTransaction({
          subscriptionId: sub.id,
          businessId: sub.businessId,
          ownerId: sub.ownerId,
          idempotencyKey,
          status: 'paid',
          amount: sub.amount,
          currency: sub.currency,
          providerPaymentId: charge.providerPaymentId,
          rawPayload: charge.raw,
        })

        paid += 1
      } else {
        const nextRetry = sub.retryCount + 1
        const mustCancel = nextRetry >= MAX_RETRY_COUNT

        await db
          .update(businessSubscriptions)
          .set({
            status: mustCancel ? 'canceled' : 'past_due',
            retryCount: nextRetry,
            nextBillingAt: mustCancel ? null : buildRetryDate(now, nextRetry),
            canceledAt: mustCancel ? now : null,
            updatedAt: now,
          })
          .where(eq(businessSubscriptions.id, sub.id))

        if (mustCancel) {
          await markBusinessSuspended(sub.id)
          canceled += 1
        } else {
          failed += 1
        }

        await saveTransaction({
          subscriptionId: sub.id,
          businessId: sub.businessId,
          ownerId: sub.ownerId,
          idempotencyKey,
          status: 'failed',
          amount: sub.amount,
          currency: sub.currency,
          providerPaymentId: charge.providerPaymentId,
          errorMessage: `Provider status: ${charge.status}`,
          rawPayload: charge.raw,
        })
      }
    } catch (error) {
      const nextRetry = sub.retryCount + 1
      const mustCancel = nextRetry >= MAX_RETRY_COUNT

      await db
        .update(businessSubscriptions)
        .set({
          status: mustCancel ? 'canceled' : 'past_due',
          retryCount: nextRetry,
          nextBillingAt: mustCancel ? null : buildRetryDate(now, nextRetry),
          canceledAt: mustCancel ? now : null,
          updatedAt: now,
        })
        .where(eq(businessSubscriptions.id, sub.id))

      if (mustCancel) {
        await markBusinessSuspended(sub.id)
        canceled += 1
      } else {
        failed += 1
      }

      await saveTransaction({
        subscriptionId: sub.id,
        businessId: sub.businessId,
        ownerId: sub.ownerId,
        idempotencyKey,
        status: 'failed',
        amount: sub.amount,
        currency: sub.currency,
        errorMessage: error instanceof Error ? error.message : 'Recurring renewal failed',
      })
    }
  }

  revalidatePath('/admin')

  return {
    processed,
    paid,
    failed,
    canceled,
  }
}
