'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useLanguage } from '@/lib/i18n/language-context'
import { completeBooking } from '@/app/actions/scheduling'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { Calendar, Clock, User, Users, CheckCircle2, Mail, Phone } from 'lucide-react'
import type { AvailabilitySlot, MeetingType, Booking, User as UserType } from '@/lib/db/schema'

interface BookingWithDetails {
  booking: Booking
  slot: AvailabilitySlot
  meetingType: MeetingType
  client: UserType
}

interface AdminBookingsListProps {
  bookings: BookingWithDetails[]
  businessId: number
}

export function AdminBookingsList({ bookings, businessId }: AdminBookingsListProps) {
  const { t, language } = useLanguage()
  const dateLocale = language === 'es' ? es : enUS
  const [completingId, setCompletingId] = useState<number | null>(null)

  const activeBookings = bookings.filter(b => b.booking.status === 'confirmed' || b.booking.status === 'rescheduled')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t.bookings.confirmed}</Badge>
      case 'rescheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{t.bookings.rescheduled}</Badge>
      case 'completed':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{t.bookings.completed}</Badge>
      case 'cancelled':
        return <Badge variant="secondary">{t.bookings.cancelled}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  async function handleComplete(id: number) {
    setCompletingId(id)
    try {
      await completeBooking(id, businessId)
    } finally {
      setCompletingId(null)
    }
  }

  if (activeBookings.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{t.admin.noBookingsYet}</h3>
        <p className="text-muted-foreground">
          {t.admin.noBookingsDesc}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {t.bookings.upcomingMeetings} ({activeBookings.length})
        </h2>
        <div className="space-y-4">
          {activeBookings.map(({ booking, slot, meetingType, client }) => (
            <Card key={booking.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div
                    className="w-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: meetingType.color }}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{meetingType.name}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(slot.date), 'EEE, MMM d, yyyy', { locale: dateLocale })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">{client.name}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-muted-foreground pl-6">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {client.email || t.admin.noEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {client.phone || t.admin.noPhone}
                        </span>
                      </div>
                    </div>
                    {booking.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                        {t.bookings.notes}: {booking.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={completingId === booking.id}>
                        <CheckCircle2 className="h-4 w-4" />
                        {completingId === booking.id ? t.admin.completing : t.admin.completeMeeting}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.admin.markComplete}</AlertDialogTitle>
                        <AlertDialogDescription>{t.admin.completeConfirm}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleComplete(booking.id)}>
                          {t.admin.markComplete}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
