# Client Meeting Scheduler

A modern web application for managing client meetings and bookings. Allows admins to set availability and manage meeting types, while clients can browse and book available time slots.

## Features

### Admin Features
- **Dashboard**: View and manage all bookings and meeting statistics
- **Availability Management**: Set open time slots for client bookings
- **Meeting Types Manager**: Create and configure different meeting types with durations and colors
- **Branding Manager**: Customize business logo, name, and description
- **Users Manager**: View and manage all users and clients
- **Schedule for Clients**: Manually create bookings for walk-in or phone clients
- **Meeting History**: View past and completed meetings

### Client Features
- **Browse Meetings**: View available meeting types and their details
- **Book Slots**: Interactive calendar to select and book available time slots
- **View Bookings**: See all confirmed and past bookings
- **User Authentication**: Secure sign-up and login with email/password

### Technical Features
- **Role-Based Access Control**: Separate admin and client interfaces
- **Email Notifications**: Send booking confirmations via Resend
- **Multi-Language Support**: i18n configuration for internationalization
- **Responsive Design**: Mobile-friendly UI with Radix UI components
- **Type Safety**: Full TypeScript support with Drizzle ORM

## Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) 16.2.6
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4.2.0
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Date Utilities**: [date-fns](https://date-fns.org/)

### Backend & Database
- **Runtime**: Next.js API Routes
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Neon](https://neon.tech/))
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) 0.45.2
- **Connection Pool**: [pg](https://node-postgres.com/) 8.21.0

### Authentication
- **Auth Framework**: [Better Auth](https://www.better-auth.com/) 1.6.14
- **Adapter**: [@better-auth/drizzle-adapter](https://www.better-auth.com/)
- **Email Service**: [Resend](https://resend.com/) 6.12.4

## Project Structure

```
client-meeting-scheduler/
├── app/                          # Next.js app directory
│   ├── api/
│   │   ├── auth/                 # Authentication endpoints
│   │   └── setup-admin/          # Admin initialization endpoint
│   ├── admin/                    # Admin dashboard pages
│   ├── book/                     # Client booking page
│   ├── bookings/                 # Client bookings list page
│   ├── sign-in/                  # Login page
│   ├── sign-up/                  # Registration page
│   ├── actions/                  # Server actions
│   │   ├── business.ts           # Business settings actions
│   │   └── scheduling.ts         # Scheduling actions
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   │   ├── admin-dashboard.tsx
│   │   ├── availability-manager.tsx
│   │   ├── branding-manager.tsx
│   │   ├── meeting-types-manager.tsx
│   │   ├── schedule-for-client-dialog.tsx
│   │   ├── users-manager.tsx
│   │   └── meeting-history.tsx
│   ├── ui/                       # Reusable UI components (button, dialog, etc.)
│   ├── booking-calendar.tsx      # Calendar for selecting booking slots
│   ├── bookings-list.tsx         # List of bookings
│   ├── book-page-content.tsx
│   ├── auth-form.tsx
│   ├── navbar.tsx
│   ├── theme-provider.tsx
│   └── language-selector.tsx
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.ts             # Mobile detection hook
│   └── use-toast.ts              # Toast notification hook
│
├── lib/                          # Utility functions and configuration
│   ├── db/
│   │   ├── index.ts              # Drizzle ORM instance
│   │   └── schema.ts             # Database schema definitions
│   ├── auth.ts                   # Better Auth configuration
│   ├── auth-client.ts            # Client-side auth utilities
│   ├── calendar.ts               # Calendar utilities
│   ├── email.ts                  # Email sending utilities
│   └── utils.ts                  # General utilities
│
├── public/                       # Static assets
├── scripts/
│   └── schema.sql                # Database schema SQL file
│
├── .env.development.local        # Development environment variables
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── next.config.mjs               # Next.js configuration
├── postcss.config.mjs            # PostCSS configuration
└── README.md                     # This file
```

## Database Schema

The application uses PostgreSQL with the following main tables:

### Authentication (Better Auth)
- **user**: User accounts with roles (admin/client), optional email, phone
- **session**: Active login sessions
- **account**: Authentication credentials and tokens
- **verification**: Email verification and password reset tokens

### Scheduling
- **meeting_types**: Available meeting types (consultation, quick call, etc.)
- **availability_slots**: Admin's available time windows
- **bookings**: Client booking records
- **business_settings**: Business branding and configuration

See [scripts/schema.sql](scripts/schema.sql) for the complete SQL schema.

## Setup & Installation

### Prerequisites
- Node.js 18+ or higher
- pnpm or npm
- PostgreSQL database (Neon account or local PostgreSQL)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd client-meeting-scheduler
pnpm install
# or
npm install
```

### 2. Configure Environment Variables

Create a `.env.development.local` file in the root directory:

```env
# Database Connection (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Alternative connection strings (optional)
DATABASE_URL_UNPOOLED=postgresql://user:password@host-unpooled/database?sslmode=require
POSTGRES_URL=postgresql://user:password@host/database?sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://user:password@host-unpooled/database?sslmode=require

# Email Service
RESEND_API_KEY=your_resend_api_key

# Auth Configuration
BETTER_AUTH_URL=http://localhost:3000
ADMIN_SETUP_SECRET=your-secret-key

# Optional Vercel Variables
VERCEL_URL=your-vercel-url
VERCEL_PROJECT_PRODUCTION_URL=your-production-url
```

**Getting Neon PostgreSQL credentials:**
1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project and database
3. Copy the connection string from the dashboard
4. Paste into `DATABASE_URL` in your `.env.development.local`

### 3. Initialize the Database

Run the schema migration to create all tables:

```bash
psql $DATABASE_URL < scripts/schema.sql
```

Or if using a Neon project:
1. Go to Neon dashboard → SQL Editor
2. Copy and paste the contents of `scripts/schema.sql`
3. Execute the SQL

### 4. Create First Admin User

The application requires at least one admin user to manage meetings and settings.

**Option A: Via API Endpoint**

```bash
curl -X POST http://localhost:3000/api/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "secret": "your-admin-setup-secret"
  }'
```

**Option B: Manual SQL**

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'admin@example.com';
```

**Option C: Sign up first, then promote**

1. Sign up at http://localhost:3000/sign-up
2. Call the setup endpoint with your email
3. Refresh and you'll have admin access

### 5. Run Development Server

```bash
pnpm dev
# or
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Available Scripts

```bash
# Development server (hot reload)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Usage

### For Admins

1. **Sign Up** at http://localhost:3000/sign-up
2. **Promote to Admin** using the setup endpoint or SQL
3. Navigate to **/admin** dashboard
4. Set availability slots
5. Create meeting types
6. Manage client bookings
7. Customize business branding

### For Clients

1. **Sign Up** at http://localhost:3000/sign-up
2. Navigate to **/book** page
3. Select a meeting type
4. Choose an available time slot
5. Confirm booking
6. View confirmed bookings at **/bookings**

## Key Features Implementation

### Authentication & Authorization
- Uses Better Auth for secure email/password authentication
- Role-based access control (admin vs client)
- Sessions stored in PostgreSQL
- Supports walk-in clients created by admins (optional email)

### Availability Management
- Admins set open time slots (date, start time, end time)
- Slots are marked as booked when a client reserves them
- Calendar visualization for easy scheduling

### Booking System
- Clients browse available meeting types with durations
- Interactive calendar shows available slots
- Bookings linked to specific slots, meeting types, and clients
- Status tracking (confirmed, cancelled, rescheduled)

### Business Branding
- Admins can set business name, description, and logo
- Branding displayed on booking and home pages
- Logo image URL stored in business_settings

### Email Notifications
- Uses Resend for sending transactional emails
- Booking confirmations sent to clients
- Configured in [lib/email.ts](lib/email.ts)

## Internationalization (i18n)

The application is configured for multi-language support. Language files are located in `lib/i18n/`.

Language selector is available in the navbar. Currently supports multiple languages with easy extensibility for more.

## Styling & UI

- **Tailwind CSS 4.2.0** for utility-first styling
- **Radix UI** for accessible, unstyled components
- **Dark mode** support via next-themes
- **Responsive design** for mobile, tablet, and desktop
- **Custom theme colors** via Tailwind config

## Troubleshooting

### Database Connection Issues

**Error: "ECONNREFUSED"**
- Verify DATABASE_URL is correct
- Check that PostgreSQL/Neon is running and accessible
- Ensure SSL/TLS settings match your database provider

**Error: "Invalid connection string"**
- Double-check credentials in .env.development.local
- Test connection: `psql $DATABASE_URL`

### Authentication Issues

**"Session expired" or "Not authenticated"**
- Check BETTER_AUTH_URL is set correctly
- Clear browser cookies
- Restart development server

**Admin setup endpoint 401**
- Verify ADMIN_SETUP_SECRET matches in .env file
- Check the secret being sent in the API request

### Build/Run Issues

**"Module not found" errors**
- Run `pnpm install` to ensure all dependencies are installed
- Delete `node_modules` and `.next` folders and reinstall: `rm -rf node_modules .next && pnpm install`

**Port 3000 already in use**
```bash
# Run on different port
pnpm dev -- -p 3001
```

## Development Tips

### Adding a New Page
1. Create folder in `app/`
2. Add `page.tsx` with React component
3. Use `useAuth()` hook for authentication checks
4. Query database via server actions in `app/actions/`

### Adding Database Queries
1. Update schema in `lib/db/schema.ts` if needed
2. Create server action in `app/actions/`
3. Use `db` instance for Drizzle queries
4. Call from client components via `use server`

### Adding UI Components
- Reusable components in `components/ui/` (buttons, dialogs, etc.)
- Page-specific components in `components/` root
- Admin-specific in `components/admin/`

## Production Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL`
- `RESEND_API_KEY`
- `BETTER_AUTH_URL` (production domain)
- `ADMIN_SETUP_SECRET`

### Environment Variables for Production

```env
DATABASE_URL=postgresql://...  # Use production Neon project
RESEND_API_KEY=re_...
BETTER_AUTH_URL=https://yourdomain.com
NODE_ENV=production
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Add your license here]

## Support

For issues, questions, or feedback, please open an issue in the repository.

---

**Last Updated**: June 2026  
**Node Version**: 18+  
**Package Manager**: pnpm or npm
