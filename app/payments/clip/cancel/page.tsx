import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ClipPaymentCancelPage() {
  return (
    <main className="container mx-auto max-w-lg py-10">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <XCircle className="h-7 w-7" />
          </div>
          <CardTitle>Payment was canceled</CardTitle>
          <CardDescription>
            No charge was made. You can try again whenever you are ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin">Back to admin dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
