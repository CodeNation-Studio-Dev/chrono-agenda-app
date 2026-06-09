'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/lib/i18n/language-context'
import { adminCreateBooking } from '@/app/actions/scheduling'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import type { User, AvailabilitySlot, MeetingType } from '@/lib/db/schema'

interface ScheduleForClientDialogProps {
  client: User | null
  slots: AvailabilitySlot[]
  meetingTypes: MeetingType[]
  businessId: number
  onClose: () => void
}

export function ScheduleForClientDialog({ client, slots, meetingTypes, businessId, onClose }: ScheduleForClientDialogProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const dateLocale = language === 'es' ? es : enUS

  const [slotId, setSlotId] = useState<string>('')
  const [meetingTypeId, setMeetingTypeId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Only future, unbooked slots
  const availableSlots = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return slots
      .filter((s) => !s.isBooked && s.date >= today)
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
  }, [slots])

  const handleSchedule = async () => {
    if (!client || !slotId || !meetingTypeId) return
    setLoading(true)
    try {
      await adminCreateBooking({
        businessId,
        slotId: Number(slotId),
        clientId: client.id,
        meetingTypeId: Number(meetingTypeId),
        notes: notes || undefined,
      })
      setSlotId('')
      setMeetingTypeId('')
      setNotes('')
      onClose()
      router.refresh()
    } catch (error) {
      console.error('[v0] Failed to schedule:', error)
      alert(error instanceof Error ? error.message : 'Failed to schedule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!client} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.admin.scheduleMeeting}</DialogTitle>
          <DialogDescription>
            {client?.name}
            {client?.phone ? ` · ${client.phone}` : ''}
            {client?.email ? ` · ${client.email}` : ''}
          </DialogDescription>
        </DialogHeader>

        {availableSlots.length === 0 || meetingTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{t.admin.noAvailableSlots}</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.admin.selectType}</Label>
              <Select value={meetingTypeId} onValueChange={setMeetingTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder={t.admin.selectType} />
                </SelectTrigger>
                <SelectContent>
                  {meetingTypes.map((mt) => (
                    <SelectItem key={mt.id} value={String(mt.id)}>
                      {mt.name} ({mt.duration} {t.booking.min})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.admin.selectSlot}</Label>
              <Select value={slotId} onValueChange={setSlotId}>
                <SelectTrigger>
                  <SelectValue placeholder={t.admin.selectSlot} />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {format(new Date(s.date), 'EEE, MMM d', { locale: dateLocale })} · {s.startTime} - {s.endTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-notes">{t.booking.notesOptional}</Label>
              <Textarea
                id="schedule-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.booking.notesPlaceholder}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={loading || !slotId || !meetingTypeId || availableSlots.length === 0}
          >
            {loading ? t.admin.scheduling : t.admin.schedule}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
