-- ============================================================================
-- Meeting Scheduler - Complete Database Schema
-- ============================================================================
-- PostgreSQL schema for the meeting scheduling application.
-- Run these statements in order to recreate the full database.
-- Compatible with Neon, Supabase, or any standard PostgreSQL instance.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- BETTER AUTH TABLES
-- These four tables are required by Better Auth for authentication.
-- Column names use camelCase to match Better Auth's defaults — do not rename.
-- ----------------------------------------------------------------------------

-- Users table (extended with a `role` column for admin/client differentiation)
-- `email` is nullable so admins can register walk-in clients without an email.
-- `phone` stores an optional contact number; `createdByAdmin` flags walk-ins.
CREATE TABLE IF NOT EXISTS "user" (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE,
  "emailVerified"  BOOLEAN NOT NULL DEFAULT FALSE,
  image            TEXT,
  phone            TEXT,
  role             TEXT NOT NULL DEFAULT 'client', -- 'admin' or 'client'
  "createdByAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"      TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Active login sessions
CREATE TABLE IF NOT EXISTS "session" (
  id          TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId"    TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Authentication accounts (stores hashed passwords for email/password auth)
CREATE TABLE IF NOT EXISTS "account" (
  id                      TEXT PRIMARY KEY,
  "accountId"             TEXT NOT NULL,
  "providerId"            TEXT NOT NULL,
  "userId"                TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken"           TEXT,
  "refreshToken"          TEXT,
  "idToken"               TEXT,
  "accessTokenExpiresAt"  TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  scope                   TEXT,
  password                TEXT,
  "createdAt"             TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Email verification / password reset tokens
CREATE TABLE IF NOT EXISTS "verification" (
  id          TEXT PRIMARY KEY,
  identifier  TEXT NOT NULL,
  value       TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------------------
-- SCHEDULING APP TABLES
-- ----------------------------------------------------------------------------

-- Meeting types define the kinds of meetings clients can book
-- (e.g. "Quick Call" 15min, "Consultation" 30min, "Deep Dive" 60min)
CREATE TABLE IF NOT EXISTS "meeting_types" (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  duration    INTEGER NOT NULL,                  -- duration in minutes
  color       TEXT NOT NULL DEFAULT '#3b82f6',   -- hex color for the UI badge
  "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Availability slots are the open time windows the admin opens in the calendar
CREATE TABLE IF NOT EXISTS "availability_slots" (
  id          SERIAL PRIMARY KEY,
  "adminId"   TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  "startTime" TIME NOT NULL,
  "endTime"   TIME NOT NULL,
  "isBooked"  BOOLEAN NOT NULL DEFAULT FALSE,    -- blocks the slot once reserved
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Bookings link a client to a slot and a meeting type
CREATE TABLE IF NOT EXISTS "bookings" (
  id              SERIAL PRIMARY KEY,
  "slotId"        INTEGER NOT NULL REFERENCES "availability_slots"(id) ON DELETE CASCADE,
  "clientId"      TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "meetingTypeId" INTEGER NOT NULL REFERENCES "meeting_types"(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed' | 'cancelled' | 'rescheduled'
  notes           TEXT,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Business branding shown on the public main page (single-row table).
-- The admin sets the business name, description, and logo here.
-- logoUrl stores either a base64 data URL or a hosted image URL.
CREATE TABLE IF NOT EXISTS "business_settings" (
  id          SERIAL PRIMARY KEY,
  name        TEXT,
  description TEXT,
  "logoUrl"   TEXT,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------------------
-- INDEXES (improve query performance for common lookups)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_availability_date  ON "availability_slots"(date);
CREATE INDEX IF NOT EXISTS idx_availability_admin ON "availability_slots"("adminId");
CREATE INDEX IF NOT EXISTS idx_bookings_client    ON "bookings"("clientId");
CREATE INDEX IF NOT EXISTS idx_bookings_slot      ON "bookings"("slotId");


-- ----------------------------------------------------------------------------
-- OPTIONAL: Seed a few default meeting types
-- Uncomment to insert starter meeting types.
-- ----------------------------------------------------------------------------
-- INSERT INTO "meeting_types" (name, description, duration, color) VALUES
--   ('Quick Call',   '15 minute introductory call',     15, '#10b981'),
--   ('Consultation', '30 minute consultation session',  30, '#3b82f6'),
--   ('Deep Dive',    '60 minute in-depth meeting',      60, '#f59e0b');


-- ----------------------------------------------------------------------------
-- OPTIONAL: Promote a user to admin (replace the email below)
-- ----------------------------------------------------------------------------
-- UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
