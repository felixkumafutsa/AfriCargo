# AfriCargo Development Audit

## Scope and baseline

Audited the existing Next.js App Router scaffold, package manifest, shared UI,
design tokens, landing page, dashboard shell, and `docs/architecture.md`.
The codebase is an early UI-only prototype; there are no existing database,
authentication, API, test, or migration implementations to preserve.

## Existing architecture

- Next.js 15.0.3 at audit time, with React 18 and TypeScript strict mode. The
  app dependency has since been updated to patched Next.js 15.5.29 after npm
  reported critical/high advisories for the scaffold's original version.
- App Router routes are grouped under `app/(marketing)` and
  `app/(dashboard)`.
- Tailwind CSS carries the AfriCargo navy, green, orange, and neutral design
  tokens.
- Shared primitives are limited to `Button` and `Card`.
- `lucide-react`, `recharts`, `clsx`, `tailwind-merge`, and
  `class-variance-authority` are already used by the UI.
- The architecture proposal describes a tenant-scoped trucking MVP, Drizzle,
  Supabase Auth, append-only trip history, and RLS, but still names Neon as
  its database provider in the multi-tenant section.

## Implemented functionality

- Marketing landing page and dashboard shell.
- Sidebar links for dashboard, trips, vehicles, drivers, customers, invoices,
  notifications, and settings.
- Static dashboard cards, chart series, and recent-trip rows.
- Tailwind tokens and basic shared UI controls.

These are presentation-only. The dashboard values are explicitly placeholder
data, and the linked module routes, login, and onboarding flows do not exist.

## Gaps and risks

- No persistence, migrations, database client, or environment validation.
- No authentication, session protection, onboarding, organisation context,
  membership model, or server-side authorisation.
- No RLS policies or tests for tenant isolation.
- Dashboard metrics and recent trips are fabricated static values.
- Sidebar entries point to unimplemented routes and are not permission-aware.
- No tests, typecheck, or lint script beyond the existing Next lint command.
- The README asks for Neon Postgres while the required architecture selects
  Supabase Postgres and Supabase Auth. This creates a split-database risk.
- A database connection using an owner/service credential would bypass normal
  RLS protections unless runtime access is explicitly constrained.

## Dependencies

Retain the current framework, UI, and chart dependencies. Add only the
foundation dependencies needed for the first backend phase:

- Drizzle ORM and Drizzle Kit for schema management and migrations.
- A PostgreSQL driver for Drizzle.
- Supabase Auth helpers for server-side Next.js sessions.
- Zod for environment and request validation.
- Vitest for focused unit tests.

No Supabase project credentials are present in the scaffold; service setup
must remain explicit and must not be simulated with sample data.

## Architectural conflicts and decisions

1. The authoritative product instructions select Supabase PostgreSQL together
   with Supabase Auth and explicitly prohibit adding Neon as a second
   database. The README and architecture provider reference must be aligned.
2. The supplied product brief expands beyond the architecture document's
   Malawi trucking MVP. Keep the existing transport-oriented concepts
   compatible, but make organisation membership and tenant-scoped access the
   foundation; implement the larger freight platform incrementally.
3. Organisation membership must be derived from verified server-side records,
   not an organisation ID supplied by the browser or a mutable profile field.
4. RLS is necessary but does not make a privileged database connection safe
   by itself. Runtime queries must use an authenticated, tenant-scoped path
   and avoid exposing service-role credentials to browser code.

## Proposed implementation sequence

1. Add identity/organisation schema, Drizzle configuration, and an initial
   version-controlled migration with tenant isolation policies.
2. Add server-side Supabase Auth/session utilities and protected sign-in,
   registration, and organisation-onboarding flows.
3. Add membership resolution, role/permission checks, and tenant-isolation
   tests before exposing organisation-owned operations.
4. Replace placeholder dashboard metrics with scoped queries once operational
   tables and a configured database are available.
5. Add CRM, shipments, documents, clearance, transport, and finance modules
   incrementally, each with validation, migrations, permission checks, and
   tests.

The initial milestone cannot be considered production-ready until real
Supabase credentials, email settings, runtime database access, and end-to-end
cross-tenant tests are configured and verified.

## Implementation follow-up

The foundation now includes server-side Supabase Auth flows, organisation
onboarding and invitation acceptance, role checks, a Drizzle identity schema,
versioned initial schema/RLS migrations, a platform-superadmin table and seed
command, and a tenant-isolation integration
test that runs when isolated Supabase fixtures are configured. The local
Supabase URL and publishable key are configured in the ignored `.env.local`;
database migrations, invitation emails, and the live RLS test still require
the server-side database/service-role credentials and test fixtures. The
platform superadmin table and an idempotent seed command are included, but the
seed has not run because no Supabase PostgreSQL connection is configured.

## Validation status

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: 2 unit tests passed; the live RLS integration test was
  skipped because no isolated Supabase test credentials/fixtures are
  configured.
- `npm run build`: passed; `/dashboard/settings` is present in the generated
  route list.
- `npx drizzle-kit check`: passed.
- `npm audit`: zero reported vulnerabilities after updating Next.js and
  applying compatible transitive dependency overrides.
- Five version-controlled migrations cover identity, tenant RLS, roles,
  branch isolation, and platform superadmin access.
- Database migrations have not been applied: `DATABASE_URL` is still absent
  from `.env.local`.
- The platform superadmin seed is pending that connection and confirmation
  that the specified Supabase account exists and has a verified email.
