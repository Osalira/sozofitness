# SOZOFITNESS MVP

A coach-first web application where coaches can sell subscriptions and 1:1 sessions with automated payments, booking, and reminders.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Payments**: Stripe Checkout + Webhooks
- **Video Calls**: Zoom API (Server-to-Server OAuth)
- **Job Queue**: pg-boss (Postgres-backed)
- **Email**: Provider abstraction (SMTP/Resend/SES)

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for local Postgres)
- Git

## Getting Started

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd sozofitness

# Install dependencies
npm install
```

### 2. Start Local PostgreSQL Database

```bash
# Start Docker container with Postgres
docker-compose up -d

# Verify it's running
docker-compose ps
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your actual values
# For local development, DATABASE_URL is already set correctly
# Other __PLACEHOLDER__ values can be added as you progress
```

**Required environment variables:**

- `DATABASE_URL` - PostgreSQL connection string (already set for local dev on port 5433)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `STRIPE_SECRET_KEY` - From Stripe Dashboard (test mode)
- `STRIPE_WEBHOOK_SECRET` - From Stripe webhook endpoint setup
- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` - From Zoom Server-to-Server OAuth app
- `EMAIL_PROVIDER`, `EMAIL_API_KEY` - Email service credentials

### 4. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations (once models are added)
# npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
sozofitness/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── prisma/
│   └── schema.prisma      # Prisma database schema
├── public/                # Static assets
├── docker-compose.yml     # Local Postgres setup
├── .env.example           # Environment variables template
└── README.md             # This file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma generate` - Generate Prisma Client
- `npx prisma migrate dev` - Create and apply migrations

## Docker Commands

```bash
# Start Postgres
docker-compose up -d

# Stop Postgres
docker-compose down

# Stop and remove data
docker-compose down -v

# View logs
docker-compose logs -f postgres
```

## External Service Setup

### Stripe Setup (Required for payments)

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Get your test API keys from Dashboard → Developers → API Keys
3. Create a webhook endpoint:
   - URL: `https://<your-domain>/api/stripe/webhook`
   - Events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`, `charge.refunded`
4. Copy the webhook signing secret
5. Add both keys to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Zoom Setup (Required for 1:1 sessions)

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Create a Server-to-Server OAuth app
3. Get credentials: Account ID, Client ID, Client Secret
4. Add to `.env`:
   ```
   ZOOM_ACCOUNT_ID=...
   ZOOM_CLIENT_ID=...
   ZOOM_CLIENT_SECRET=...
   ```

### Email Setup (Required for notifications)

Choose an email provider:

- **Development**: SMTP with Gmail or Mailtrap
- **Production**: AWS SES, Resend, or SendGrid

Add to `.env`:

```
EMAIL_PROVIDER=resend  # or 'ses', 'smtp'
EMAIL_API_KEY=...
```

## MVP Scope

### ✅ In Scope

- Coach dashboard (sales, revenue)
- Subscription products (weekly video access)
- 1:1 session bookings with Zoom links
- Stripe payment processing
- Email and SMS reminders (5 days, 24 hours before appointment)
- Entitlements system (permission management)

### ❌ Out of Scope (Post-MVP)

- Community features
- Coach verification
- Meal photo calorie tracking
- AI marketing tools
- Advanced analytics

## Development Workflow

1. **Add database models**: Edit `prisma/schema.prisma`
2. **Create migration**: `npx prisma migrate dev --name <name>`
3. **Generate client**: `npx prisma generate` (auto-runs after migrate)
4. **Build features**: Create pages in `app/` directory
5. **API routes**: Create endpoints in `app/api/`

## Troubleshooting

### Database Connection Issues

```bash
# Check if Postgres is running
docker-compose ps

# Restart Postgres
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

**Note:** This setup uses port **5433** instead of the default 5432 to avoid conflicts with existing PostgreSQL installations on your machine.

### Prisma Issues

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Regenerate Prisma Client
npx prisma generate
```

### Port Already in Use

```bash
# Find process using port 5433 (Postgres)
netstat -ano | findstr :5433

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml and DATABASE_URL
```

## Production Deployment

### Database

- Use AWS RDS for PostgreSQL
- Update `DATABASE_URL` with production credentials

### Environment Variables

- Set all `__PLACEHOLDER__` values with production keys
- Use environment variable management (Vercel, AWS Secrets Manager, etc.)

### Deployment Platforms

- **Vercel** (recommended for Next.js)
- **AWS ECS/Fargate**
- **DigitalOcean App Platform**

## License

Proprietary - All rights reserved

## Support

For questions or issues, contact the development team.
