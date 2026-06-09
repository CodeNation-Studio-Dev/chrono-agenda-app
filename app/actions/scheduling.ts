'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, meetingTypes, availabilitySlots, bookings } from '@/lib/db/schema'
import { and, eq, gte, desc, asc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { 
  sendEmail, 
  getBookingConfirmationEmail, 
  getBookingCancellationEmail, 
  getRescheduleEmail,
  getAdminNotificationEmail 
} from '@/lib/email'
import { generateICS } from '@/lib/calendar'
import { format } from 'date-fns'

// Build an .ics calendar invite attachment for a booking.
// A stable UID per booking means reschedules/cancellations update the same
// event in Google Calendar / Outlook instead of creating duplicates.
function buildInvite(opts: {
  bookingId: number
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  organizerName: string
  organizerEmail: string
  attendeeName: string
  attendeeEmail: string
  status?: 'CONFIRMED' | 'CANCELLED'
  sequence?: number
}) {
  const ics = generateICS({
    uid: `booking-${opts.bookingId}@meetingscheduler`,
    title: opts.title,
    description: opts.description,
    date: opts.date,
    startTime: opts.startTime,
    endTime: opts.endTime,
    organizerName: opts.organizerName,
    organizerEmail: opts.organizerEmail,
    attendeeName: opts.attendeeName,
    attendeeEmail: opts.attendeeEmail,
    status: opts.status ?? 'CONFIRMED',
    sequence: opts.sequence ?? 0,
  })
  return [
    {
      filename: 'invite.ics',
      content: Buffer.from(ics).toString('base64'),
      contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
    },
  ]
}

// Auth helper
async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session
}

async function getUserId() {
  const session = await getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function requireAdmin() {
  const session = await getSession()
  if (!session?.user) throw new Error('Unauthorized')
  const userRecord = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)
  if (userRecord.length === 0 || userRecord[0].role !== 'admin') {
    throw new Error('Admin access required')
  }
  return session.user.id
}

// Get current user with role
export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.user) return null
  const userRecord = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)
  return userRecord[0] || null
}

// Meeting Types Actions
export async function getMeetingTypes() {
  return db.select().from(meetingTypes).where(eq(meetingTypes.isActive, true)).orderBy(asc(meetingTypes.name))
}

export async function getAllMeetingTypes() {
  await requireAdmin()
  return db.select().from(meetingTypes).orderBy(asc(meetingTypes.name))
}

export async function createMeetingType(data: { name: string; description?: string; duration: number; color: string }) {
  await requireAdmin()
  const result = await db.insert(meetingTypes).values(data).returning()
  revalidatePath('/admin')
  return result[0]
}

export async function updateMeetingType(id: number, data: { name?: string; description?: string; duration?: number; color?: string; isActive?: boolean }) {
  await requireAdmin()
  const result = await db.update(meetingTypes).set({ ...data, updatedAt: new Date() }).where(eq(meetingTypes.id, id)).returning()
  revalidatePath('/admin')
  return result[0]
}

export async function deleteMeetingType(id: number) {
  await requireAdmin()
  await db.delete(meetingTypes).where(eq(meetingTypes.id, id))
  revalidatePath('/admin')
}

// Availability Slots Actions
export async function getAvailableSlots(dateStr?: string) {
  const today = new Date().toISOString().split('T')[0]
  const query = dateStr 
    ? and(eq(availabilitySlots.date, dateStr), eq(availabilitySlots.isBooked, false))
    : and(gte(availabilitySlots.date, today), eq(availabilitySlots.isBooked, false))
  
  return db.select().from(availabilitySlots).where(query).orderBy(asc(availabilitySlots.date), asc(availabilitySlots.startTime))
}

export async function getAdminSlots() {
  const adminId = await requireAdmin()
  return db.select().from(availabilitySlots).where(eq(availabilitySlots.adminId, adminId)).orderBy(asc(availabilitySlots.date), asc(availabilitySlots.startTime))
}

export async function createAvailabilitySlot(data: { date: string; startTime: string; endTime: string }) {
  const adminId = await requireAdmin()
  const result = await db.insert(availabilitySlots).values({ ...data, adminId }).returning()
  revalidatePath('/admin')
  return result[0]
}

export async function deleteAvailabilitySlot(id: number) {
  const adminId = await requireAdmin()
  await db.delete(availabilitySlots).where(and(eq(availabilitySlots.id, id), eq(availabilitySlots.adminId, adminId)))
  revalidatePath('/admin')
}

// Bookings Actions
export async function getClientBookings() {
  const clientId = await getUserId()
  const results = await db
    .select({
      booking: bookings,
      slot: availabilitySlots,
      meetingType: meetingTypes,
    })
    .from(bookings)
    .innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
    .innerJoin(meetingTypes, eq(bookings.meetingTypeId, meetingTypes.id))
    .where(eq(bookings.clientId, clientId))
    .orderBy(desc(bookings.createdAt))
  
  return results
}

export async function getAdminBookings() {
  const adminId = await requireAdmin()
  const results = await db
    .select({
      booking: bookings,
      slot: availabilitySlots,
      meetingType: meetingTypes,
      client: user,
    })
    .from(bookings)
    .innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
    .innerJoin(meetingTypes, eq(bookings.meetingTypeId, meetingTypes.id))
    .innerJoin(user, eq(bookings.clientId, user.id))
    .where(eq(availabilitySlots.adminId, adminId))
    .orderBy(desc(bookings.createdAt))
  
  return results
}

export async function createBooking(data: { slotId: number; meetingTypeId: number; notes?: string }) {
  const clientId = await getUserId()
  
  // Check if slot is available
  const slot = await db.select().from(availabilitySlots).where(eq(availabilitySlots.id, data.slotId)).limit(1)
  if (slot.length === 0 || slot[0].isBooked) {
    throw new Error('This time slot is no longer available')
  }
  
  // Get client info for email
  const clientRecord = await db.select().from(user).where(eq(user.id, clientId)).limit(1)
  const meetingType = await db.select().from(meetingTypes).where(eq(meetingTypes.id, data.meetingTypeId)).limit(1)
  
  // Create booking
  const result = await db.insert(bookings).values({ ...data, clientId }).returning()
  
  // Mark slot as booked
  await db.update(availabilitySlots).set({ isBooked: true, updatedAt: new Date() }).where(eq(availabilitySlots.id, data.slotId))
  
  // Send confirmation email to client
  if (clientRecord[0]?.email && meetingType[0]) {
    const dateFormatted = format(new Date(slot[0].date), 'EEEE, MMMM d, yyyy')
    const timeFormatted = `${slot[0].startTime} - ${slot[0].endTime}`
    const emailContent = getBookingConfirmationEmail(clientRecord[0].name, meetingType[0].name, dateFormatted, timeFormatted)

    // Notify admin (also used as the calendar organizer)
    const admin = await db.select().from(user).where(eq(user.id, slot[0].adminId)).limit(1)

    // Attach an .ics invite so the client can add it to Google Calendar / Outlook
    const invite = admin[0]?.email
      ? buildInvite({
          bookingId: result[0].id,
          title: meetingType[0].name,
          description: data.notes || `${meetingType[0].name} meeting`,
          date: slot[0].date,
          startTime: slot[0].startTime,
          endTime: slot[0].endTime,
          organizerName: admin[0].name,
          organizerEmail: admin[0].email,
          attendeeName: clientRecord[0].name,
          attendeeEmail: clientRecord[0].email,
          status: 'CONFIRMED',
          sequence: 0,
        })
      : undefined

    await sendEmail({ to: clientRecord[0].email, ...emailContent, attachments: invite })

    if (admin[0]?.email) {
      const adminEmailContent = getAdminNotificationEmail(admin[0].name, clientRecord[0].name, clientRecord[0].email, meetingType[0].name, dateFormatted, timeFormatted, 'booked')
      await sendEmail({ to: admin[0].email, ...adminEmailContent, attachments: invite })
    }
  }
  
  revalidatePath('/bookings')
  revalidatePath('/book')
  revalidatePath('/admin')
  return result[0]
}

export async function cancelBooking(id: number) {
  const clientId = await getUserId()
  
  // Get booking info
  const bookingRecord = await db
    .select({
      booking: bookings,
      slot: availabilitySlots,
      meetingType: meetingTypes,
    })
    .from(bookings)
    .innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
    .innerJoin(meetingTypes, eq(bookings.meetingTypeId, meetingTypes.id))
    .where(and(eq(bookings.id, id), eq(bookings.clientId, clientId)))
    .limit(1)
  
  if (bookingRecord.length === 0) {
    throw new Error('Booking not found')
  }
  
  const { booking, slot, meetingType } = bookingRecord[0]
  
  // Update booking status
  await db.update(bookings).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(bookings.id, id))
  
  // Free up the slot
  await db.update(availabilitySlots).set({ isBooked: false, updatedAt: new Date() }).where(eq(availabilitySlots.id, booking.slotId))
  
  // Send cancellation email
  const clientRecord = await db.select().from(user).where(eq(user.id, clientId)).limit(1)
  if (clientRecord[0]?.email) {
    const dateFormatted = format(new Date(slot.date), 'EEEE, MMMM d, yyyy')
    const timeFormatted = `${slot.startTime} - ${slot.endTime}`
    const emailContent = getBookingCancellationEmail(clientRecord[0].name, meetingType.name, dateFormatted, timeFormatted)

    // Notify admin (calendar organizer)
    const admin = await db.select().from(user).where(eq(user.id, slot.adminId)).limit(1)

    // Send a CANCELLED invite (sequence 2) so calendars remove the event
    const invite = admin[0]?.email
      ? buildInvite({
          bookingId: id,
          title: meetingType.name,
          description: `${meetingType.name} meeting`,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          organizerName: admin[0].name,
          organizerEmail: admin[0].email,
          attendeeName: clientRecord[0].name,
          attendeeEmail: clientRecord[0].email,
          status: 'CANCELLED',
          sequence: 2,
        })
      : undefined

    await sendEmail({ to: clientRecord[0].email, ...emailContent, attachments: invite })

    if (admin[0]?.email) {
      const adminEmailContent = getAdminNotificationEmail(admin[0].name, clientRecord[0].name, clientRecord[0].email, meetingType.name, dateFormatted, timeFormatted, 'cancelled')
      await sendEmail({ to: admin[0].email, ...adminEmailContent, attachments: invite })
    }
  }
  
  revalidatePath('/bookings')
  revalidatePath('/book')
  revalidatePath('/admin')
}

export async function rescheduleBooking(id: number, newSlotId: number) {
  const clientId = await getUserId()
  
  // Get current booking
  const bookingRecord = await db
    .select({
      booking: bookings,
      slot: availabilitySlots,
      meetingType: meetingTypes,
    })
    .from(bookings)
    .innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
    .innerJoin(meetingTypes, eq(bookings.meetingTypeId, meetingTypes.id))
    .where(and(eq(bookings.id, id), eq(bookings.clientId, clientId)))
    .limit(1)
  
  if (bookingRecord.length === 0) {
    throw new Error('Booking not found')
  }
  
  // Check new slot availability
  const newSlot = await db.select().from(availabilitySlots).where(eq(availabilitySlots.id, newSlotId)).limit(1)
  if (newSlot.length === 0 || newSlot[0].isBooked) {
    throw new Error('The new time slot is no longer available')
  }
  
  const { booking, slot: oldSlot, meetingType } = bookingRecord[0]
  
  // Update booking
  await db.update(bookings).set({ slotId: newSlotId, status: 'rescheduled', updatedAt: new Date() }).where(eq(bookings.id, id))
  
  // Free old slot, book new slot
  await db.update(availabilitySlots).set({ isBooked: false, updatedAt: new Date() }).where(eq(availabilitySlots.id, oldSlot.id))
  await db.update(availabilitySlots).set({ isBooked: true, updatedAt: new Date() }).where(eq(availabilitySlots.id, newSlotId))
  
  // Send reschedule email
  const clientRecord = await db.select().from(user).where(eq(user.id, clientId)).limit(1)
  if (clientRecord[0]?.email) {
    const oldDateFormatted = format(new Date(oldSlot.date), 'EEEE, MMMM d, yyyy')
    const oldTimeFormatted = `${oldSlot.startTime} - ${oldSlot.endTime}`
    const newDateFormatted = format(new Date(newSlot[0].date), 'EEEE, MMMM d, yyyy')
    const newTimeFormatted = `${newSlot[0].startTime} - ${newSlot[0].endTime}`
    
    const emailContent = getRescheduleEmail(clientRecord[0].name, meetingType.name, oldDateFormatted, oldTimeFormatted, newDateFormatted, newTimeFormatted)

    // Notify admin (calendar organizer)
    const admin = await db.select().from(user).where(eq(user.id, newSlot[0].adminId)).limit(1)

    // Updated invite (sequence 1) with the new time replaces the original event
    const invite = admin[0]?.email
      ? buildInvite({
          bookingId: id,
          title: meetingType.name,
          description: `${meetingType.name} meeting (rescheduled)`,
          date: newSlot[0].date,
          startTime: newSlot[0].startTime,
          endTime: newSlot[0].endTime,
          organizerName: admin[0].name,
          organizerEmail: admin[0].email,
          attendeeName: clientRecord[0].name,
          attendeeEmail: clientRecord[0].email,
          status: 'CONFIRMED',
          sequence: 1,
        })
      : undefined

    await sendEmail({ to: clientRecord[0].email, ...emailContent, attachments: invite })

    if (admin[0]?.email) {
      const adminEmailContent = getAdminNotificationEmail(admin[0].name, clientRecord[0].name, clientRecord[0].email, meetingType.name, newDateFormatted, newTimeFormatted, 'rescheduled')
      await sendEmail({ to: admin[0].email, ...adminEmailContent, attachments: invite })
    }
  }
  
  revalidatePath('/bookings')
  revalidatePath('/book')
  revalidatePath('/admin')
}

// Admin: Mark a meeting as completed (closed once finished)
export async function completeBooking(id: number) {
  const adminId = await requireAdmin()

  // Ensure the booking belongs to a slot owned by this admin
  const bookingRecord = await db
    .select({ booking: bookings, slot: availabilitySlots })
    .from(bookings)
    .innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
    .where(and(eq(bookings.id, id), eq(availabilitySlots.adminId, adminId)))
    .limit(1)

  if (bookingRecord.length === 0) {
    throw new Error('Booking not found')
  }

  await db.update(bookings).set({ status: 'completed', updatedAt: new Date() }).where(eq(bookings.id, id))
  revalidatePath('/admin')
  revalidatePath('/bookings')
}

// Admin: Make user an admin
export async function makeAdmin(email: string) {
  const adminId = await requireAdmin()
  const userRecord = await db.select().from(user).where(eq(user.email, email)).limit(1)
  if (userRecord.length === 0) {
    throw new Error('User not found')
  }
  await db.update(user).set({ role: 'admin', updatedAt: new Date() }).where(eq(user.id, userRecord[0].id))
  revalidatePath('/admin')
}

// Admin: List all users
export async function getAllUsers() {
  await requireAdmin()
  return db.select().from(user).orderBy(asc(user.name))
}

// Admin: Register a new client (walk-in). Email is optional; phone is captured.
export async function createClientUser(data: { name: string; phone?: string; email?: string }) {
  await requireAdmin()

  const name = data.name.trim()
  if (!name) throw new Error('Name is required')

  const email = data.email?.trim() || null
  if (email) {
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1)
    if (existing.length > 0) {
      throw new Error('A user with this email already exists')
    }
  }

  const result = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name,
      email,
      phone: data.phone?.trim() || null,
      role: 'client',
      createdByAdmin: true,
      emailVerified: false,
    })
    .returning()

  revalidatePath('/admin')
  return result[0]
}

// Admin: Update a client's contact info
export async function updateClientUser(userId: string, data: { name?: string; phone?: string; email?: string }) {
  await requireAdmin()
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (data.name !== undefined) updates.name = data.name.trim()
  if (data.phone !== undefined) updates.phone = data.phone.trim() || null
  if (data.email !== undefined) updates.email = data.email.trim() || null
  await db.update(user).set(updates).where(eq(user.id, userId))
  revalidatePath('/admin')
}

// Admin: Schedule a meeting on behalf of a client
export async function adminCreateBooking(data: { slotId: number; clientId: string; meetingTypeId: number; notes?: string }) {
  const adminId = await requireAdmin()

  // Verify the slot belongs to this admin and is free
  const slot = await db
    .select()
    .from(availabilitySlots)
    .where(and(eq(availabilitySlots.id, data.slotId), eq(availabilitySlots.adminId, adminId)))
    .limit(1)
  if (slot.length === 0 || slot[0].isBooked) {
    throw new Error('This time slot is no longer available')
  }

  // Verify the client exists
  const clientRecord = await db.select().from(user).where(eq(user.id, data.clientId)).limit(1)
  if (clientRecord.length === 0) {
    throw new Error('Client not found')
  }

  const meetingType = await db.select().from(meetingTypes).where(eq(meetingTypes.id, data.meetingTypeId)).limit(1)

  const result = await db
    .insert(bookings)
    .values({ slotId: data.slotId, clientId: data.clientId, meetingTypeId: data.meetingTypeId, notes: data.notes })
    .returning()

  await db.update(availabilitySlots).set({ isBooked: true, updatedAt: new Date() }).where(eq(availabilitySlots.id, data.slotId))

  // Send confirmation + invite only when the client has an email
  if (clientRecord[0].email && meetingType[0]) {
    const dateFormatted = format(new Date(slot[0].date), 'EEEE, MMMM d, yyyy')
    const timeFormatted = `${slot[0].startTime} - ${slot[0].endTime}`
    const emailContent = getBookingConfirmationEmail(clientRecord[0].name, meetingType[0].name, dateFormatted, timeFormatted)

    const admin = await db.select().from(user).where(eq(user.id, adminId)).limit(1)
    const invite = admin[0]?.email
      ? buildInvite({
          bookingId: result[0].id,
          title: meetingType[0].name,
          description: data.notes || `${meetingType[0].name} meeting`,
          date: slot[0].date,
          startTime: slot[0].startTime,
          endTime: slot[0].endTime,
          organizerName: admin[0].name,
          organizerEmail: admin[0].email,
          attendeeName: clientRecord[0].name,
          attendeeEmail: clientRecord[0].email,
          status: 'CONFIRMED',
          sequence: 0,
        })
      : undefined

    await sendEmail({ to: clientRecord[0].email, ...emailContent, attachments: invite })
  }

  revalidatePath('/admin')
  return result[0]
}

// Admin: Change a user's role (promote to admin / demote to client)
export async function setUserRole(userId: string, role: 'admin' | 'client') {
  const adminId = await requireAdmin()
  if (userId === adminId && role !== 'admin') {
    throw new Error('You cannot change your own admin role')
  }
  const target = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  if (target.length === 0) {
    throw new Error('User not found')
  }
  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath('/admin')
}

// Admin: Delete a user (cascades to their bookings and slots)
export async function deleteUser(userId: string) {
  const adminId = await requireAdmin()
  if (userId === adminId) {
    throw new Error('You cannot delete your own account')
  }
  const target = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  if (target.length === 0) {
    throw new Error('User not found')
  }
  await db.delete(user).where(eq(user.id, userId))
  revalidatePath('/admin')
}
