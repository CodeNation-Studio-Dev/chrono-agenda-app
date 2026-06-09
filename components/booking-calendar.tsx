'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/lib/i18n/language-context'
import { createBooking } from '@/app/actions/scheduling'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { Clock, CalendarDays, Check } from 'lucide-react'
import type { AvailabilitySlot, MeetingType } from '@/lib/db/schema'

interface BookingCalendarProps {
  slots: AvailabilitySlot[]
  meetingTypes: MeetingType[]
  businessId: number
  businessSlug?: string
}

export function BookingCalendar({ slots, meetingTypes, businessId, businessSlug }: BookingCalendarProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [selectedMeetingType, setSelectedMeetingType] = useState<MeetingType | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'date' | 'slot' | 'type' | 'confirm'>('date')

  const dateLocale = language === 'es' ? es : enUS

  // Get unique dates that have available slots
  const availableDates = [...new Set(slots.map(s => s.date))]

  // Get slots for selected date
  const slotsForDate = selectedDate
    ? slots.filter(s => s.date === format(selectedDate, 'yyyy-MM-dd'))
    : []

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    if (date) setStep('slot')
  }

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot)
    setStep('type')
  }

  const handleMeetingTypeSelect = (type: MeetingType) => {
    setSelectedMeetingType(type)
    setStep('confirm')
  }

  const handleConfirm = async () => {
    if (!selectedSlot || !selectedMeetingType) return
    
    setLoading(true)
    try {
      await createBooking({
        businessId,
        slotId: selectedSlot.id,
        meetingTypeId: selectedMeetingType.id,
        notes: notes || undefined,
      })
      const target = businessSlug ? `/${businessSlug}/bookings` : '/bookings'
      router.push(target)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return availableDates.includes(dateStr)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t.booking.selectDate}
        </h2>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          locale={dateLocale}
          disabled={(date) => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return date < today || !isDateAvailable(date)
          }}
          className="rounded-md"
        />
      </Card>

      {/* Booking Flow */}
      <div className="space-y-6">
        {/* Time Slots */}
        {step !== 'date' && selectedDate && (
          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {t.booking.availableTimes} {format(selectedDate, 'MMMM d, yyyy', { locale: dateLocale })}
            </h2>
            {slotsForDate.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t.booking.noSlots}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slotsForDate.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={selectedSlot?.id === slot.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSlotSelect(slot)}
                    className="justify-start"
                  >
                    {slot.startTime} - {slot.endTime}
                  </Button>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Meeting Types */}
        {(step === 'type' || step === 'confirm') && selectedSlot && (
          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4">{t.booking.selectMeetingType}</h2>
            <div className="space-y-2">
              {meetingTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleMeetingTypeSelect(type)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedMeetingType?.id === type.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: type.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{type.name}</span>
                        <span className="text-sm text-muted-foreground">{type.duration} {t.booking.min}</span>
                      </div>
                      {type.description && (
                        <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      )}
                    </div>
                    {selectedMeetingType?.id === type.id && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Confirmation */}
        {step === 'confirm' && selectedSlot && selectedMeetingType && (
          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4">{t.booking.confirmBooking}</h2>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.booking.date}</span>
                <span className="text-foreground font-medium">
                  {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: dateLocale })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.booking.time}</span>
                <span className="text-foreground font-medium">
                  {selectedSlot.startTime} - {selectedSlot.endTime}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.booking.meetingType}</span>
                <span className="text-foreground font-medium">{selectedMeetingType.name}</span>
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="notes" className="text-sm">{t.booking.notesOptional}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.booking.notesPlaceholder}
                className="mt-2"
                rows={3}
              />
            </div>

            <Button onClick={handleConfirm} disabled={loading} className="w-full">
              {loading ? t.booking.booking : t.booking.confirm}
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
