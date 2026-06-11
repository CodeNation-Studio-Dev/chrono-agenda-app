export function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL
    ?? process.env.BETTER_AUTH_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)

  if (!explicit) return 'http://localhost:3000'

  return explicit.startsWith('http://') || explicit.startsWith('https://')
    ? explicit
    : `https://${explicit}`
}

export const SEO = {
  appName: 'Chrono Agenda',
  defaultTitle: 'Chrono Agenda | Online Booking for Modern Teams',
  titleTemplate: '%s | Chrono Agenda',
  description:
    'Scheduling platform to book, reschedule, and manage meetings across multiple businesses with role-based access and email reminders.',
}
