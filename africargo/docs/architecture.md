# AfriCargo — Phase 0 Architecture Document
**Scope:** Transport/Trucking MVP (Malawi) — designed so the same core schema extends cleanly into a Freight Forwarder workspace in Phase 2.

---

## 1. Design Principles for This Phase

1. **Tenant isolation is non-negotiable, even with one customer.** We build it now because retrofitting it later means touching every table and every query.
2. **Model the domain, not the UI.** Tables represent real business objects (a Trip, a Vehicle) — not screens.
3. **Forwarder-compatible, not forwarder-complete.** `trips` and `shipments` are kept as separate concerns from day one so a future forwarder tenant can create a Shipment that spawns one or more Trips (subcontracted trucking), without a schema rewrite.
4. **Every table: UUID PK, `tenant_id`, `created_at`, `updated_at`, `deleted_at` (soft delete), and an audit trail.**

---

## 2. Multi-Tenant Strategy

**Approach: Shared database, shared schema, row-level isolation.**

- Single Supabase Postgres database for all tenants, with Supabase Auth for identity.
- Every tenant-owned table carries a `tenant_id UUID NOT NULL REFERENCES companies(id)`.
- **Defense in depth, two layers:**
  - **App layer:** every Drizzle query goes through a repository function that injects `tenant_id` from the authenticated session — no query is allowed to skip this.
  - **Database layer:** Postgres Row-Level Security (RLS) policies on every tenant table as a second safety layer.
- Supabase Auth issues the session. Server code verifies the user and derives organisation access from persisted memberships; a browser-supplied organisation ID or mutable profile claim is never treated as authority.
- Drizzle application queries use the restricted `africargo_runtime` database role and set transaction-local identity claims only from the verified Supabase session. Privileged migration credentials are separate and are never used for ordinary requests.

**Why not schema-per-tenant or database-per-tenant?** Overkill at 1-50 customers — adds migration and ops complexity we don't need yet. Revisit only if a large enterprise customer later demands physical data isolation (common ask from government agencies — flag this as a Phase 3 consideration).

---

## 3. Core Schema (Phase 1)

```
companies (tenants)
├── id (uuid, pk)
├── name
├── type              -- 'transport' | 'forwarder' | 'customer_only' (future-proofing)
├── country            -- 'MW' now, others in Phase 2
├── plan               -- billing tier, future use
├── created_at / updated_at / deleted_at

users
├── id (uuid, pk)
├── tenant_id (fk -> companies, nullable for platform admins)
├── auth_id            -- Supabase auth user id
├── full_name, email, phone
├── status              -- 'active' | 'suspended' | 'invited'
├── created_at / updated_at / deleted_at

roles
├── id, name           -- 'owner' | 'dispatcher' | 'driver' | 'customer'  (Phase 1 set)
user_roles
├── user_id, role_id, tenant_id

vehicles
├── id, tenant_id
├── plate_number, make, model, capacity_kg, capacity_type   -- flatbed/reefer/tanker etc
├── status              -- 'available' | 'in_use' | 'maintenance' | 'inactive'
├── created_at / updated_at / deleted_at

drivers
├── id, tenant_id
├── user_id (fk -> users, nullable if driver has no login yet)
├── license_number, license_expiry
├── status              -- 'available' | 'on_trip' | 'off_duty'
├── created_at / updated_at / deleted_at

customers
├── id, tenant_id
├── name, phone, email, address
├── customer_type       -- 'importer' | 'exporter' | 'business' | 'individual'
├── created_at / updated_at / deleted_at

trips
├── id, tenant_id
├── customer_id (fk)
├── vehicle_id (fk, nullable until assigned)
├── driver_id (fk, nullable until assigned)
├── pickup_location, dropoff_location (text now, geo columns reserved for Phase 2)
├── cargo_description, weight_kg
├── requested_pickup_date, requested_delivery_date
├── status              -- see state machine below
├── flagged_for_review (bool, default false)   -- true when status enters 'Rejected'; dispatcher dashboard filters on this
├── created_at / updated_at / deleted_at

trip_status_history
├── id, trip_id, status, changed_by (user_id), note, created_at
   -- append-only log; this IS the audit trail for trip progress, also feeds notifications

proof_of_delivery
├── id, trip_id
├── signed_by_name, signature_image_url, photo_urls[] (Supabase Storage)
├── delivered_at, recorded_by (user_id)

invoices
├── id, tenant_id, customer_id, trip_id
├── invoice_number, amount, currency, status  -- 'draft'|'sent'|'paid'|'overdue'
├── source              -- 'standard_delivery' | 'failed_delivery_fee'  (lets reporting separate the two)
├── due_date, pdf_url
├── created_at / updated_at / deleted_at

invoice_line_items
├── id, invoice_id, description, quantity, unit_price, total

billing_settings                              -- NEW: tenant-configurable business rules, not code
├── id, tenant_id
├── setting_key          -- e.g. 'failed_delivery_fee'
├── fee_type             -- 'none' | 'flat' | 'percentage_of_trip_value'
├── fee_value             -- numeric; meaningless if fee_type = 'none'
├── updated_at, updated_by (user_id)
   -- Owner-only edit access (see RBAC). Defaults to fee_type = 'none' / fee_value = 0
   -- until the Owner sets a real number — the invoice still auto-generates as a $0 draft,
   -- so the habit of "every Returned trip gets reviewed" starts on day one, before the
   -- business has even decided its pricing.

notifications
├── id, tenant_id, user_id, channel  -- 'email' now, sms/whatsapp reserved
├── type, payload, status, sent_at

audit_logs
├── id, tenant_id, actor_user_id, action, entity_type, entity_id, metadata (jsonb), created_at
```

### Why these tables exist (the ones worth explaining)

- **`trips` is separate from a future `shipments` table** — a Trip is "move cargo from A to B by truck." A Shipment (Phase 2, forwarder-owned) will be "get cargo from origin country to destination, including customs" and can reference *one or more* Trips as sub-legs. Keeping them separate now avoids a painful migration later.
- **`trip_status_history` as an append-only log**, not just a `status` column on `trips` — this is both your audit trail and the data source for "shipment delayed" style notifications and future analytics (e.g., average time-in-status).
- **`drivers` references `users` optionally** — many small trucking operations have drivers who don't need app logins yet (dispatcher manages everything). Don't force account creation as a blocker to onboarding a driver.
- **`proof_of_delivery` as its own table**, not columns on `trips` — it can have multiple photos, may be re-uploaded/corrected, and is legally/commercially significant enough to deserve its own audit trail.

### Indexes (minimum viable)
- `tenant_id` on every tenant table (always filtered on)
- `(tenant_id, status)` composite on `trips` — dispatcher board queries filter by both constantly
- `(tenant_id, customer_id)` on `trips` and `invoices`
- `trip_id` on `trip_status_history` and `proof_of_delivery`

---

## 4. RBAC Matrix (Phase 1 — 4 roles)

| Action | Owner | Dispatcher | Driver | Customer |
|---|---|---|---|---|
| Manage company settings / users | ✅ | ❌ | ❌ | ❌ |
| Create/edit vehicles & drivers | ✅ | ✅ | ❌ | ❌ |
| View all trips (tenant-wide) | ✅ | ✅ | ❌ | ❌ (own only) |
| Create a trip (internal) | ✅ | ✅ | ❌ | ❌ |
| Submit booking request | ✅ | ✅ | ❌ | ✅ |
| Assign vehicle/driver to trip | ✅ | ✅ | ❌ | ❌ |
| Update own trip status (e.g. "picked up," "delivered") | ✅ | ✅ | ✅ (assigned trips only) | ❌ |
| Upload POD | ✅ | ✅ | ✅ (assigned trips only) | ❌ |
| View own trips only | — | — | ✅ | ✅ |
| Generate/send invoice | ✅ | ✅ (if granted) | ❌ | ❌ |
| View own invoices | ✅ | ✅ | ❌ | ✅ (own only) |
| Edit billing settings (fee rules) | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ | ❌ |

Enforced via: middleware checks role + row ownership before every server action; RLS as the backstop, mirroring the tenant-isolation defense-in-depth above.

---

## 5. Trip Lifecycle State Machine (Phase 1)

```
Requested        (customer submits booking, or dispatcher creates directly)
   ↓
Confirmed        (dispatcher accepts, sets pickup/delivery dates)
   ↓
Assigned         (vehicle + driver attached)
   ↓
En Route Pickup  (driver marks departure toward pickup point)
   ↓
Loaded           (cargo collected)
   ↓
In Transit
   ↓
   ├── Rejected         (cargo found damaged en route — driver/dispatcher flags it before arrival)
   │      ↓ (see Rejected branch below)
   │
Arrived          (at drop-off location)
   ↓
   ├── Delivered        (customer accepts — POD uploaded, triggers invoicing eligibility)
   │      ↓
   │   Invoiced
   │      ↓
   │   Closed
   │
   └── Rejected         (customer refuses cargo at delivery — sets flagged_for_review = true,
                          reason captured in trip_status_history.note, urgent notification to dispatcher)
          ↓
       Returning         (driver takes cargo back toward origin)
          ↓
       Returned          (closed; flagged_for_review cleared once dispatcher resolves the dispute)

Branch: Cancelled — reachable from Requested, Confirmed, or Assigned only
        (once Loaded, a trip can no longer be silently cancelled — it must resolve through
        Delivered or Rejected → Returned. This preserves an honest record: cargo that left
        the yard either arrived or came back, it doesn't just disappear from the pipeline.)
```

Each transition writes a row to `trip_status_history` (including the rejection reason as `note`) and triggers the relevant notification. **`Rejected` is a high-priority notification** — dispatcher needs to know within minutes, not in a daily digest, since a truck and driver are now stranded with cargo and no plan.

**Resolved:** a `Returned` trip auto-generates a `draft` invoice using the tenant's `billing_settings.failed_delivery_fee` rule (Section 3). The process is automated; the price is data, editable by the Owner in Settings at any time — including before you've decided what to charge, since the default is a $0 draft rather than no invoice at all. This means the moment you *do* decide on a fee, every future rejection is billed correctly with zero code changes.

**Deferred, not forgotten:** *partial* rejection (some pallets accepted, some refused) is a real scenario for later — Phase 1 treats a rejection as all-or-nothing for the whole trip to avoid over-engineering before we've seen real usage.

---

## 6. Folder Structure (Next.js 15, feature-first)

```
src/
├── app/                          -- routes only, thin
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── trips/
│   │   ├── vehicles/
│   │   ├── drivers/
│   │   ├── customers/
│   │   ├── invoices/
│   │   └── settings/
│   └── api/
├── features/                     -- business logic lives here
│   ├── trips/
│   │   ├── components/
│   │   ├── actions.ts            -- server actions
│   │   ├── repository.ts         -- Drizzle queries, tenant-scoped
│   │   ├── schema.ts             -- Zod validation
│   │   └── types.ts
│   ├── vehicles/
│   ├── drivers/
│   ├── customers/
│   ├── invoices/
│   └── notifications/
├── lib/
│   ├── db/                       -- Drizzle client, schema definitions
│   ├── auth/                     -- Supabase auth helpers, tenant context
│   └── rbac/                     -- permission checks, shared across features
├── components/ui/                -- shadcn/ui primitives only
└── types/
```

**Rule going forward:** nothing tenant-aware happens in `app/`. Routes call feature actions; features own their repository, validation, and permission checks. This is what lets us add the Freight Forwarder feature module in Phase 2 without touching Trips/Vehicles/Drivers at all.

---

## 7. What's Deliberately Deferred (and why)

| Deferred | Why it's safe to defer |
|---|---|
| SMS/WhatsApp notifications | Email via Resend proves the notification model first; channels are additive later |
| Live GPS tracking | Status-based visibility ("In Transit") solves 80% of the "where's my truck" anxiety without a hardware/GPS integration project |
| Multi-currency invoicing | Single currency (MWK) for one country is fine; don't build for Phase 2 countries yet |
| Customs, warehouse, documents beyond POD | Not needed by a trucking company customer |
| Auditor role, 12-role RBAC | 4 roles cover Phase 1 real usage; more roles = more permission bugs to ship |

---

## 8. Implementation Status

The initial implementation adds Supabase Auth, organisation onboarding and
membership, invitations, RBAC checks, Drizzle identity tables, and tenant RLS.
Operational domain tables and workflows remain phased work; dashboard metrics
must not be populated with placeholder values.

Use the version-controlled migrations in `drizzle/` and keep the Supabase
project's migration/runtime connection credentials separate. See
`docs/development-audit.md` and the repository README for setup and current
validation status.
