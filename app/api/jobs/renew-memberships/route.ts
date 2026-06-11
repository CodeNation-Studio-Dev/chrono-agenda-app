import { NextRequest, NextResponse } from 'next/server'
import { renewDueMembershipSubscriptions } from '@/app/actions/recurring-billing'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.RENEWAL_CRON_SECRET
  if (!secret) return false

  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  return authHeader === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await renewDueMembershipSubscriptions()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('Renew memberships job failed:', error)
    return NextResponse.json({ error: 'Job failed' }, { status: 500 })
  }
}
