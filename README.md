# BalamWiFi

BalamWiFi is a public WiFi directory for Bandar Lampung. It lists cafes, libraries, campus lounges, coworking spaces, restaurants, and rest areas with public WiFi details, speed reports, power outlet info, reviews, and moderation flow.

## Stack

- Next.js 16 + React 19 frontend
- Express API server
- PostgreSQL via `pg`
- Zod request validation
- In-memory seed data fallback when `DATABASE_URL` is not set
- Google ID token verification for community submissions and reviews

## Requirements

- Node.js 22 or newer
- npm
- PostgreSQL database for production or persistent local data

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:3000`.
API runs on `http://localhost:8787`.

## Environment

```env
PORT=8787
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://username:password@host.neon.tech/balamwifi?sslmode=require
DB_SCHEMA_SYNC=true
ADMIN_TOKEN=change-this-admin-token
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
NEXT_PUBLIC_API_BASE=/api
API_SERVER_URL=http://localhost:8787
NEXT_IMAGE_REMOTE_HOSTS=i.ibb.co,images.unsplash.com,lh3.googleusercontent.com
```

`DATABASE_URL` is optional for development. Without it, server uses seed data in memory.

Set `DB_SCHEMA_SYNC=false` in production after migrations are applied if you do not want the API server to run schema DDL and metrics backfill on every startup.

`ADMIN_TOKEN` protects moderation endpoints. In development, admin endpoints remain open if `ADMIN_TOKEN` is empty. In production, empty `ADMIN_TOKEN` disables admin access with `503`.

`API_SERVER_URL` is used by Next route handlers to proxy `/api/*` requests to the Express API server.

`GOOGLE_CLIENT_ID` is used by the API to verify Google ID tokens. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` enables the browser login prompt. Use the same OAuth client ID unless you intentionally split clients.

`NEXT_IMAGE_REMOTE_HOSTS` is a comma-separated allowlist for `next/image` remote optimization. Add trusted image hosts here before accepting URLs from a new provider.

Use admin token with:

```http
Authorization: Bearer change-this-admin-token
```

## Scripts

```bash
npm run dev          # Run API and Next dev server
npm run dev:client   # Run Next only
npm run dev:api      # Run API only
npm run dev:server   # Alias for dev:api
npm run build        # Build Next app
npm run preview      # Start built Next app and API
npm run start        # Start built Next app and API
npm run start:next   # Start built Next app only
npm run start:api    # Start API only
npm run db:seed      # Seed PostgreSQL data
npm run lint         # Run ESLint
```

## API

```http
GET /api/health
GET /api/places
GET /api/places/:id
POST /api/places
POST /api/reviews
GET /api/admin/submissions
PATCH /api/admin/submissions/:id
```

Supported place filters:

- `q`: text search by name, address, district, or category
- `category`: exact category
- `accessType`: exact WiFi access type
- `speed`: `steady`, `fast`, or `ultra`
- `outlets`: `true` or `false`
- `open24`: `true` or `false`
- `wifi`: `true` or `false`
- `status`: `approved`, `pending`, `rejected`, or `all`
- `limit`: 1-100, default 100

## Database

Schema lives in `server/schema.sql` and is applied when PostgreSQL store initializes.
Place rating metrics are stored in `place_metrics` and updated incrementally for the changed place after review/submission writes.

Seed data:

```bash
npm run db:seed
```

## Security Notes

- Only list public WiFi or owner-approved access.
- Password entries require source proof before approval.
- `POST /api/places` and `POST /api/reviews` require a valid Google ID token in `Authorization: Bearer <token>`.
- Do not deploy admin moderation without `ADMIN_TOKEN`.
- Set `CORS_ORIGIN` in production. Without it, production denies browser origins by default.

## Deploy

1. Set environment variables on hosting provider.
2. Run `npm install`.
3. Run `npm run build`.
4. Start with `npm run start` to run both the Express API and the built Next app.
5. Seed database if needed with `npm run db:seed`.

For Neon PostgreSQL, use pooled connection string in `DATABASE_URL`.
