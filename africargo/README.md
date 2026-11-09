# AfriCargo

## Current implementation

- Marketing landing page and AfriCargo design tokens.
- Supabase email/password registration, email verification, login, and logout.
- Organisation onboarding, multi-organisation membership, invitations, and roles.
- Drizzle identity schema and versioned PostgreSQL migrations with RLS.
- Dashboard workspace and organisation member settings.

The dashboard intentionally shows no fabricated operational metrics. Shipment,
trip, CRM, customs, document, and finance modules remain future implementation
phases. See [the development audit](./docs/development-audit.md) and
[architecture](./docs/architecture.md).

## Running it locally

You'll need [Node.js](https://nodejs.org) 20+ and a Supabase project.

```bash
cd africargo
npm install
```

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from Supabase.
- `NEXT_PUBLIC_SITE_URL` with the app's public origin.
- `DATABASE_URL` with the Supabase PostgreSQL connection for migrations only.
- `AFRICARGO_DATABASE_URL` with the restricted `africargo_runtime` role for
  application queries.
- `SUPABASE_SERVICE_ROLE_KEY` for server-side invitation emails only. Never
  expose it through a `NEXT_PUBLIC_` variable.

Run the initial migrations using the privileged `DATABASE_URL`:

```bash
npm run db:migrate
npm run db:seed-superadmin -- felixkumafutsa@gmail.com
```

The RLS migration creates `africargo_runtime` as a non-superuser,
`NOBYPASSRLS` role. After the migration, set its password through the Supabase
SQL editor or dashboard (never commit it), then use that role in
`AFRICARGO_DATABASE_URL`. Keep the privileged connection string in
`DATABASE_URL` for migrations only.

```sql
ALTER ROLE africargo_runtime WITH PASSWORD '<generated-secret>';
```

The superadmin seed requires that email to already exist as an email-verified
Supabase Auth user. It is idempotent for that account and refuses to seed a
different account if a platform superadmin already exists. Run it only after
the migrations have created `platform_admins`.

Then run the validation scripts and start the application:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run dev
```

Supabase Auth email/password sign-in and email verification must be enabled.
Add `${NEXT_PUBLIC_SITE_URL}/auth/callback` to the Supabase redirect allowlist.

The tenant-isolation integration test runs when these fixture variables are
available to the test process: `AFRICARGO_TEST_DATABASE_URL` (the restricted
runtime role), `TEST_TENANT_USER_A_ID`, `TEST_TENANT_USER_B_ID`,
`TEST_TENANT_ORGANISATION_A_ID`, and `TEST_TENANT_ORGANISATION_B_ID`. The two
users must be members of their respective test organisations and must not
share a membership. Without these fixtures that integration test is skipped.

Open http://localhost:3000 for the landing page. Register, verify your email,
and create a workspace to open the protected dashboard.

## Deploying (when ready)

1. Push this folder to a GitHub repo
2. Import the repo on [Vercel](https://vercel.com) (free tier is fine to start)
3. Add the public Supabase URL/key, server-only database credentials, and
   server-only Supabase service-role key to Vercel's project settings
