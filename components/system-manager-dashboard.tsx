'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setBusinessDisabledState, setBusinessMembershipPaid } from '@/app/actions/system-manager'
import { Building2, ShieldCheck, ShieldX, CreditCard, Users } from 'lucide-react'
import type { Business, User } from '@/lib/db/schema'

interface SystemBusinessRow {
  business: Business
  owner: User
}

interface SystemManagerDashboardProps {
  businesses: SystemBusinessRow[]
  admins: User[]
  adminBusinessCounts: Record<string, number>
}

function formatDate(value: Date | string | null) {
  if (!value) return 'N/A'
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString()
}

export function SystemManagerDashboard({
  businesses,
  admins,
  adminBusinessCounts,
}: SystemManagerDashboardProps) {
  const router = useRouter()
  const [pendingBusinessId, setPendingBusinessId] = useState<number | null>(null)
  const [disableReasons, setDisableReasons] = useState<Record<number, string>>({})

  const handleMembershipToggle = async (business: Business) => {
    setPendingBusinessId(business.id)
    try {
      await setBusinessMembershipPaid(business.id, !business.membershipPaid)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update membership status')
    } finally {
      setPendingBusinessId(null)
    }
  }

  const handleDisableToggle = async (business: Business) => {
    setPendingBusinessId(business.id)
    try {
      const reason = disableReasons[business.id] || undefined
      await setBusinessDisabledState(business.id, !business.isDisabled, reason)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update disabled state')
    } finally {
      setPendingBusinessId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Businesses ({businesses.length})
        </h2>

        {businesses.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No businesses found.</Card>
        ) : (
          <div className="space-y-4">
            {businesses.map(({ business, owner }) => {
              const isPending = pendingBusinessId === business.id

              return (
                <Card key={business.id} className="p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{business.name}</p>
                      <p className="text-sm text-muted-foreground">/{business.slug}/book</p>
                      <p className="text-sm text-muted-foreground">
                        Owner: {owner.name} ({owner.email || 'No email'})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={business.membershipPaid ? 'default' : 'secondary'}>
                        {business.membershipPaid ? 'Membership paid' : 'Membership unpaid'}
                      </Badge>
                      <Badge variant={business.isDisabled ? 'destructive' : 'outline'}>
                        {business.isDisabled ? 'Disabled' : 'Active'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    <p>Created: {formatDate(business.createdAt)}</p>
                    <p>Paid at: {formatDate(business.membershipPaidAt)}</p>
                    <p>Disabled at: {formatDate(business.disabledAt)}</p>
                    <p>Reason: {business.disabledReason || 'N/A'}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <Input
                      placeholder="Disable reason (optional)"
                      value={disableReasons[business.id] ?? ''}
                      onChange={(event) =>
                        setDisableReasons((prev) => ({ ...prev, [business.id]: event.target.value }))
                      }
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleMembershipToggle(business)}
                      disabled={isPending}
                    >
                      <CreditCard className="h-4 w-4" />
                      {business.membershipPaid ? 'Mark unpaid' : 'Mark paid'}
                    </Button>
                    <Button
                      variant={business.isDisabled ? 'outline' : 'destructive'}
                      onClick={() => handleDisableToggle(business)}
                      disabled={isPending}
                    >
                      {business.isDisabled ? (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Enable
                        </>
                      ) : (
                        <>
                          <ShieldX className="h-4 w-4" />
                          Disable
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Admin Records ({admins.length})
        </h2>

        {admins.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No admins found.</Card>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <Card key={admin.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email || 'No email'} | {admin.phone || 'No phone'}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Businesses: {adminBusinessCounts[admin.id] ?? 0}</p>
                    <p>Created: {formatDate(admin.createdAt)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
