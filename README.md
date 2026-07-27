# InvoicePro — Smart Invoicing for Indian Businesses

A production-ready, self-hostable SaaS invoicing platform built for Indian businesses. GST-compliant, AI-powered, and mobile-responsive.

## Features

- **Smart Invoicing** — Create professional GST-compliant invoices with live calculations
- **GST/HSN Engine** — 20+ HSN categories, automatic GST rate suggestions, GSTIN validation
- **Executive Dashboard** — Real-time revenue analytics, status breakdowns, customer insights
- **AI OCR** — Scan paper invoices via OpenAI, Claude, or Gemini
- **Anomaly Detection** — Duplicate detection, tax rate validation, GSTIN checks
- **Export** — JSON, CSV, Markdown
- **Version History** — Full audit trail with diff tracking
- **Route Protection** — JWT-based auth middleware
- **Mobile Responsive** — Hamburger nav, scrollable tables
- **Docker Ready** — One-command deployment

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase)
- **Auth:** JWT (jose), bcryptjs
- **Deployment:** Docker, Coolify

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd invoicepro
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

Required:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `JWT_SECRET` — Random secret (min 32 chars)
- `DATABASE_URL` — PostgreSQL connection string

### 3. Database Setup

Run the migration in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor or local PostgreSQL.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Docker Deployment

```bash
docker compose up -d
```

## Coolify Deployment

1. Add a new service → Docker Compose
2. Point to the `docker-compose.yml`
3. Set environment variables in Coolify dashboard

## Project Structure

```
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (dashboard)/     # Protected routes
│   │   ├── dashboard/   # Analytics dashboard
│   │   ├── invoices/    # Invoice CRUD
│   │   ├── customers/   # Customer management
│   │   ├── ocr/         # AI OCR scanner
│   │   └── settings/    # AI provider config
│   └── api/             # REST API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   └── layout/          # Sidebar, navigation
├── lib/
│   ├── engine/          # Business logic
│   │   ├── invoice-engine.ts
│   │   ├── gst-engine.ts
│   │   ├── export.ts
│   │   └── ocr.ts
│   ├── supabase/        # Supabase clients
│   ├── auth.ts          # JWT auth
│   └── db.ts            # Database helpers
├── supabase/migrations/ # SQL migrations
├── types/               # TypeScript types
├── Dockerfile
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| DELETE | `/api/auth/login` | Logout |
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/[id]` | Get invoice + versions |
| PUT | `/api/invoices/[id]` | Update invoice |
| DELETE | `/api/invoices/[id]` | Delete invoice |
| GET/POST | `/api/customers` | CRUD customers |
| POST | `/api/export` | Export invoices |
| POST | `/api/ocr` | OCR invoice analysis |
| GET | `/api/gst` | HSN search/lookup/validation |
| POST | `/api/anomaly` | Anomaly detection |
| GET | `/api/dashboard` | Dashboard metrics |
| GET | `/api/health` | Health check |

## Type Checking & Linting

```bash
npm run typecheck
npm run lint
```

## License

MIT
