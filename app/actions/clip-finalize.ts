'use server'

import { db } from '@/lib/db'
import { businesses, user } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { upsertBusinessSubscriptionOnPayment } from '@/app/actions/recurring-billing'

export async function finalizeAdminUpgradePaid(userId: string) {
  const existing = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  if (existing.length === 0) throw new Error('User not found')

  await db
    .update(user)
    .set({
      role: 'admin',
      adminPlan: 'paid',
      adminTrialEndsAt: null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))

  revalidatePath('/admin')
}

export async function finalizeBusinessMembershipPaid(
  userId: string,
  businessId: number,
  recurring?: {
    providerCustomerId?: string | null
    providerPaymentMethodToken?: string | null
    providerSubscriptionId?: string | null
  },
) {
  const biz = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.ownerId, userId)))
    .limit(1)

  if (biz.length === 0) {
    throw new Error('Business not found')
  }

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

  await upsertBusinessSubscriptionOnPayment({
    businessId,
    ownerId: userId,
    providerCustomerId: recurring?.providerCustomerId ?? null,
    providerPaymentMethodToken: recurring?.providerPaymentMethodToken ?? null,
    providerSubscriptionId: recurring?.providerSubscriptionId ?? null,
  })

  revalidatePath('/admin')
  revalidatePath(`/${biz[0].slug}/book`)
}
