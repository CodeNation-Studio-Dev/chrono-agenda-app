import { pgTable, text, timestamp, boolean, serial, integer, date, time } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(), // nullable: admin-created walk-in clients may have no email
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  phone: text('phone'),
  role: text('role').notNull().default('client'), // 'admin' or 'client'
  createdByAdmin: boolean('createdByAdmin').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables for scheduling --------------------------------------------
export const meetingTypes = pgTable('meeting_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  duration: integer('duration').notNull(), // in minutes
  color: text('color').notNull().default('#3b82f6'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const availabilitySlots = pgTable('availability_slots', {
  id: serial('id').primaryKey(),
  adminId: text('adminId').notNull(),
  date: date('date').notNull(),
  startTime: time('startTime').notNull(),
  endTime: time('endTime').notNull(),
  isBooked: boolean('isBooked').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  slotId: integer('slotId').notNull(),
  clientId: text('clientId').notNull(),
  meetingTypeId: integer('meetingTypeId').notNull(),
  status: text('status').notNull().default('confirmed'), // confirmed, cancelled, rescheduled
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const businessSettings = pgTable('business_settings', {
  id: serial('id').primaryKey(),
  name: text('name'),
  description: text('description'),
  logoUrl: text('logoUrl'),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// Types for use in the app
export type User = typeof user.$inferSelect
export type MeetingType = typeof meetingTypes.$inferSelect
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect
export type Booking = typeof bookings.$inferSelect
export type BusinessSettings = typeof businessSettings.$inferSelect
