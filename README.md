# UNDP Visitor Check-In System — Frontend

Next.js 16 (App Router) frontend for the visitor check-in/check-out system. Public
check-in/checkout pages, a QR-code entrance flow, and a role-aware admin dashboard
for managers and branch managers.

## Stack

- Next.js 16.3.2 (App Router, Turbopack) / React 19.2
- TypeScript, Tailwind CSS v4
- `@tanstack/react-query` for client-side data fetching/caching
- `recharts` for admin analytics charts
- `qrcode.react` for entrance QR codes
- `jose` for JWT verification

## Architecture

This app is a Backend-For-Frontend (BFF) in front of the Spring Boot API:

- Public pages (`/`, `/check-in`, `/check-out`, `/help`) call the Spring Boot API
  **directly from the browser** using the public `NEXT_PUBLIC_API_URL`.
- Authenticated admin pages (`/dashboard/**`) never talk to the backend directly.
  Instead they call this app's own `/api/backend/[...path]` route, which reads the
  httpOnly `session` cookie, verifies the JWT, and forwards the request to Spring
  Boot with `Authorization: Bearer <token>`. The JWT is never exposed to
  client-side JavaScript.
- `proxy.ts` (the Next.js 16 replacement for `middleware.ts`) guards every
  `/dashboard/**` route: unauthenticated requests are redirected to `/login`, and
  MANAGER-only sections (`/dashboard/branches`, `/dashboard/users`) redirect
  BRANCH_MANAGER users back to `/dashboard`.

## Prerequisites

- Node.js 22+
- The backend API running (see `../checkinsystemapi/README.md`) with a matching
  `JWT_SECRET`.

## Configuration

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

| Variable              | Description                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `BACKEND_API_URL`     | Server-only. Internal URL the BFF route handlers use to reach the Spring Boot API.         |
| `NEXT_PUBLIC_API_URL` | Public. URL the browser uses directly for check-in/check-out calls.                        |
| `JWT_SECRET`          | **Must exactly match** the backend's `JWT_SECRET` — used to verify JWTs issued by the API. |

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in at `/login` using one
of the seeded accounts documented in the backend README.

## Building

```bash
npm run build
npm run start
```

## Docker

```bash
docker build -t checkin-frontend --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 .
docker run -p 3000:3000 --env-file .env checkin-frontend
```

`NEXT_PUBLIC_API_URL` must be passed as a build arg (it's inlined into the client
bundle at build time); `BACKEND_API_URL` and `JWT_SECRET` are read at runtime via
`--env-file`.

## Pages

- `/` — landing page with links to check-in / check-out.
- `/check-in?entrance=<id>` — public visitor check-in form (reached by scanning an
  entrance's QR code).
- `/check-out` — public visitor check-out by reference code or phone number.
- `/help` — instructions for visitors.
- `/login` — staff sign-in.
- `/dashboard` — analytics overview (summary KPIs, check-ins by hour, by purpose).
- `/dashboard/visits` — searchable/paginated visit log with manual check-out and CSV export.
- `/dashboard/entrances` — entrance CRUD + QR code generator per entrance.
- `/dashboard/hosts` — host CRUD.
- `/dashboard/branches` — branch CRUD (MANAGER only).
- `/dashboard/users` — admin account CRUD (MANAGER only).
