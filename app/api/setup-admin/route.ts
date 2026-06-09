import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// This endpoint allows making a user an admin by email
// In production, you'd want to secure this or remove it after setup
export async function POST(request: NextRequest) {
  try {
    const { email, secret } = await request.json()
    
    // Simple secret check - in production use env variable
    if (secret !== process.env.ADMIN_SETUP_SECRET && secret !== 'setup-admin-2024') {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    
    const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1)
    
    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found. Please sign up first.' }, { status: 404 })
    }
    
    await db.update(user).set({ role: 'admin', updatedAt: new Date() }).where(eq(user.email, email))
    
    return NextResponse.json({ success: true, message: `User ${email} is now an admin` })
  } catch (error) {
    console.error('Setup admin error:', error)
    return NextResponse.json({ error: 'Failed to setup admin' }, { status: 500 })
  }
}
