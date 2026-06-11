import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ClipPaymentSuccessPage() {
  return (
    <main className="container mx-auto max-w-lg py-10">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <CardTitle>Payment received</CardTitle>
          <CardDescription>
            We are confirming your payment. Your account will be updated automatically in a few seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/admin">Go to admin dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
