'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, businessSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  const userRecord = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)
  if (userRecord.length === 0 || userRecord[0].role !== 'admin') {
    throw new Error('Admin access required')
  }
  return session.user.id
}

// Public: read the business branding shown on the main page
export async function getBusinessSettings() {
  const rows = await db.select().from(businessSettings).limit(1)
  return rows[0] ?? null
}

// Admin only: create or update the single business settings row
export async function updateBusinessSettings(data: {
  name: string
  description: string
  logoUrl: string | null
}) {
  await requireAdmin()

  const existing = await db.select().from(businessSettings).limit(1)

  if (existing.length === 0) {
    await db.insert(businessSettings).values({
      name: data.name || null,
      description: data.description || null,
      logoUrl: data.logoUrl || null,
    })
  } else {
    await db
      .update(businessSettings)
      .set({
        name: data.name || null,
        description: data.description || null,
        logoUrl: data.logoUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(businessSettings.id, existing[0].id))
  }

  revalidatePath('/')
  revalidatePath('/admin')
  return { success: true }
}
