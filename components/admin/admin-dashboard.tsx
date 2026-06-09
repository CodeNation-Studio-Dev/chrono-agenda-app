'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilityManager } from './availability-manager'
import { MeetingTypesManager } from './meeting-types-manager'
import { AdminBookingsList } from './admin-bookings-list'
import { MeetingHistory } from './meeting-history'
import { BrandingManager } from './branding-manager'
import { UsersManager } from './users-manager'
import { useLanguage } from '@/lib/i18n/language-context'
import { CalendarDays, Clock, Users, Palette, UserCog, History } from 'lucide-react'
import type { AvailabilitySlot, MeetingType, Booking, User, BusinessSettings } from '@/lib/db/schema'

interface BookingWithDetails {
  booking: Booking
  slot: AvailabilitySlot
  meetingType: MeetingType
  client: User
}

interface AdminDashboardProps {
  slots: AvailabilitySlot[]
  meetingTypes: MeetingType[]
  bookings: BookingWithDetails[]
  businessSettings: BusinessSettings | null
  users: User[]
  currentUserId: string
}

export function AdminDashboard({ slots, meetingTypes, bookings, businessSettings, users, currentUserId }: AdminDashboardProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('availability')

  const activeBookings = bookings.filter(b => b.booking.status === 'confirmed' || b.booking.status === 'rescheduled')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:w-auto lg:inline-grid">
        <TabsTrigger value="availability" className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span className="hidden sm:inline">{t.admin.availability}</span>
        </TabsTrigger>
        <TabsTrigger value="meeting-types" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">{t.admin.meetingTypes}</span>
        </TabsTrigger>
        <TabsTrigger value="bookings" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">{t.admin.allBookings}</span>
          {activeBookings.length > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
              {activeBookings.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">{t.admin.history}</span>
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <UserCog className="h-4 w-4" />
          <span className="hidden sm:inline">{t.admin.users}</span>
        </TabsTrigger>
        <TabsTrigger value="branding" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">{t.admin.branding}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="availability">
        <AvailabilityManager slots={slots} />
      </TabsContent>

      <TabsContent value="meeting-types">
        <MeetingTypesManager meetingTypes={meetingTypes} />
      </TabsContent>

      <TabsContent value="bookings">
        <AdminBookingsList bookings={bookings} />
      </TabsContent>

      <TabsContent value="history">
        <MeetingHistory bookings={bookings} />
      </TabsContent>

      <TabsContent value="users">
        <UsersManager users={users} currentUserId={currentUserId} slots={slots} meetingTypes={meetingTypes} />
      </TabsContent>

      <TabsContent value="branding">
        <BrandingManager settings={businessSettings} />
      </TabsContent>
    </Tabs>
  )
}
