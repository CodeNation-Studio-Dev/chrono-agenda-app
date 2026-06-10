'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { businesses, user } from '@/lib/db/schema'
import { and, asc, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function requireSystemManager() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')

  const userRecord = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)
  if (userRecord.length === 0 || userRecord[0].role !== 'system_manager') {
    throw new Error('System manager access required')
  }

  return userRecord[0]
}

export async function getSystemManagerOverview() {
  await requireSystemManager()

  const businessRows = await db
    .select({ business: businesses, owner: user })
    .from(businesses)
    .innerJoin(user, eq(businesses.ownerId, user.id))
    .orderBy(desc(businesses.createdAt))

  const admins = await db
    .select()
    .from(user)
    .where(eq(user.role, 'admin'))
    .orderBy(asc(user.name))

  const adminBusinessCounts = businessRows.reduce<Record<string, number>>((acc, row) => {
    const ownerId = row.owner.id
    acc[ownerId] = (acc[ownerId] ?? 0) + 1
    return acc
  }, {})

  return {
    businesses: businessRows,
    admins,
    adminBusinessCounts,
  }
}

export async function setBusinessMembershipPaid(businessId: number, membershipPaid: boolean) {
  await requireSystemManager()

  const existing = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1)
  if (existing.length === 0) throw new Error('Business not found')

  await db
    .update(businesses)
    .set({
      membershipPaid,
      membershipPaidAt: membershipPaid ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId))

  revalidatePath('/system-manager')
}

export async function setBusinessDisabledState(
  businessId: number,
  isDisabled: boolean,
  reason?: string,
) {
  await requireSystemManager()

  const existing = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1)
  if (existing.length === 0) throw new Error('Business not found')

  await db
    .update(businesses)
    .set({
      isDisabled,
      disabledAt: isDisabled ? new Date() : null,
      disabledReason: isDisabled ? (reason?.trim() || 'Disabled by system manager') : null,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId))

  revalidatePath('/system-manager')
  revalidatePath('/admin')
  revalidatePath(`/${existing[0].slug}/book`)
}

export async function isCurrentUserSystemManager() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return false

  const row = await db
    .select()
    .from(user)
    .where(and(eq(user.id, session.user.id), eq(user.role, 'system_manager')))
    .limit(1)

  return row.length > 0
}
