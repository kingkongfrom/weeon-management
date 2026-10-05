# Data model & live shared schema

*The source of truth is the **admin-owned** Supabase schema in the `weeon-tenants`
repo (`lib/supabase/database.types.ts` + `supabase/migrations/`). This page is a
management-focused reading of it. Never invent tables or columns.*

## Multi-tenant model

One **school = one tenant = one row in `tenants`**. All academic and person rows
carry `tenant_id → tenants.id`. Isolation is enforced by **PostgreSQL RLS** for
the school apps. Roster/user uniqueness is per tenant `(tenant_id, …)`. The one
cross-tenant-unique field is `tenants.saber_code` (one live claim per school).

## `tenants` (the master list this console manages)

Columns (from the live schema):

| Column | Type / notes |
| ------ | ------------ |
| `id` | uuid (PK) |
| `name` | Institution name |
| `status` | `demo` \| `demo_expired` \| `active` \| `past_due` \| `suspended` (+ legacy `trial` \| `trial_expired`) |
| `plan` | Paid tier; **top-level** column (observed: `pro`), not inside `settings` |
| `subdomain` | `<slug>.weeon.school` (observed `weeon-demo-school`) |
| `slug` | nullable URL slug |
| `saber_code` | nullable; the one cross-tenant-unique school identity (observed `999999-00`) |
| `settings` | JSONB — the school's full configuration (see below) |
| `billing_seats` | Paid seat count (per-student pricing). `0` until a school pays. |
| `subscription_id` | nullable (payment provider sub id) |
| `greenpay_subscription_id` | nullable |
| `trial_started_at`, `trial_ends_at` | nullable (legacy trial clock) |
| `demo_ends_at` | nullable; end of the 3-day guided-demo window. After it, access is read-only until activation. |
| `paid_at`, `paid_until` | nullable |
| `created_at`, `updated_at` | timestamps |

`tenants.status` lifecycle is covered in `lifecycle.md`.

## People & users per tenant

**`profiles` are school users, not Weeon Ops staff.** A `profiles.role = 'admin'`
row is a **school administrator for that `tenant_id`**. The Security
administrators list in this console does **not** read `profiles` — see
`docs/auth.md`. The same person (e.g. Eduardo) may exist as a demo-tenant
school admin for testing `weeon-tenants` and, separately, as the ops owner.

**The primary "users per tenant" number comes from `profiles`.**

`profiles` (one row per app user):

| Column | Notes |
| ------ | ----- |
| `id` | uuid, maps to auth user |
| `tenant_id` | which school this user belongs to |
| `role` | authorizer role (e.g. school admin, teacher, student, parent…) |
| `account_status` | status string |
| `active` | bool |
| `name`, `username` | display + login username |
| `auth_email`, `email` | auth + contact email |
| `provisioned_at`, `first_login_at`, `email_sent_at` | provisioning/sign-in signals |

Roster people also appear in lower-level roster tables:

- `roster_accounts` — username-first accounts for mobile sign-in
  (`username`, `role`, `source_kind`, `source_id`, `auth_user_id`…). Useful to
  reconcile who has real auth vs who is still pending.
- `students`, `teachers` — roster records (with `profile_id` /
  grade/guardian info), plus `classes`, `enrollments`, `subjects`, `grades`,
  `attendance_records`, `class_lessons`, `assignments`, `submissions`,
  `threads`/`messages`, `parent_student_links`, `academic_terms`,
  `activity_events`, `notices`.

> There is **no `parents` or `guardians` table**. A child's legal guardians
> live on the student row (`students.guardians` JSON); a guardian *user* is a
> `profiles` row with the parent role and is linked to students through
> `parent_student_links`.

> For "how many users per tenant" prefer **auth-able people** = count on
> `profiles` (or `roster_accounts` with `auth_user_id`) per `tenant_id`. Do not
> double-count a student that also appears in `students` and `profiles`. The
> console's goal is *people who use the product in a school*, so `profiles` is
> the base; roster tables refine role splits (see `metrics.md`). A student who
> is also a parent would be a *roster* vs *user* nuance to keep labeled.

## `tenants.settings` JSONB (live shape, verified 2026-09-03)

`tenants.settings` holds almost everything about how a school is configured.
It is JSONB; the console only needs a few keys for statistics. Observed keys:

| Key | Meaning |
| --- | ------- |
| `modules` | **legacy, display-only** `{core, finance, transport}` — superseded by `tenant_addons` / `tenant_module_catalog` for real gating. Do not wire new gates to this. |
| `educationLevels` | e.g. `["primaria","secundaria"]` |
| `schoolOffer` | `{grades[], primaria, secundaria, preescolar, tecnico, nationalSchedule, …}` |
| `academicYear` | academic year identifier |
| `calendarSystem` | e.g. `"mep"` |
| `country`, `mepCode` / `saberCode` | identity / MEP code |
| `campusHours`, `daySchedule`, `classDurationMinutes`, `maxStudentsPerGroup` | scheduling config |
| `saberClaimedAt`, `jornadaConfirmedAt`, `subjectsConfirmedAt`, `subjectsSeededAt` | setup milestones (timestamps) |
| `adminEmail` | school admin contact |

So education/schedule flags are read from `settings` for per-tenant stats, while
`status` / `plan` / `billing_seats` / trial columns drive subscription
signaling. **Module enablement is NOT read from `settings`** — see below.

## Tenant modules (the real gate — `tenant_addons` + catalog)

The single source of truth for per-tenant module on/off is **`public.tenant_addons`**
(`(tenant_id, addon_key, enabled, enabled_at, disabled_at, metadata)`), paired
with the catalog `public.tenant_module_catalog`. Both live in `weeon-tenants`
(migrations `20260915180000_parent_payments.sql`,
`20260927120000_tenant_module_gating.sql`).

- **Tier `core`** — the plan minimum (Calificaciones, Aula virtual, Asistencia,
  Agenda y horarios, Comunicación, Momentos, Administración). Seeded `enabled =
  true` for every tenant and **never disabled from Ops**; the Ops School page
  renders them as locked rows.
- **Tier `addon`** — optional paid modules (currently only `parent_payments`).
  Ops toggles these from the School page.

Ops reads/writes via the service-role platform client:

| Concern | File |
| --- | --- |
| List catalog + tenant state | `lib/platform/tenant-modules.ts` (`listTenantModules`) |
| Toggle an add-on (refuses core) | `lib/platform/tenant-modules.ts` (`setTenantModuleEnabled`) |
| Server action | `lib/dashboard/tenant-module-actions.ts` |
| UI | `components/dashboard/module-list-card.tsx` |

Consumers keep their own gates: the ERP nav (`weeon-tenants`
`lib/dashboard/tenant-addons.ts` + `addon-keys.ts`, `core` always on; `ADDON_NAV`
gates `parent_payments`) and mobile (`tenant_parent_payments_status()` RPC
reading `tenant_addons.addon_key='parent_payments'`). The parent-payments RPC is
unchanged by the module-gating migration.

## School status control (Ops → tenant lifecycle)

`lib/platform/tenant-status.ts` (`setTenantStatus`) + `lib/dashboard/tenant-status-actions.ts`
let Ops **suspend** (`suspended`) and **reactivate** (`active`) a school from the
School page. Only this manual subset is allowed — `demo` / `demo_expired` /
`trial` / `trial_expired` stay lifecycle-driven (demo clock, trial clock, payment
webhooks). Suspension blocks every user of the tenant.

Every cross-tenant mutation (admin add/remove, module toggle, status change) is
also appended to **`public.tenant_ops_audit`** with the acting ops-staff member
and before/after values — see `audit-log.md` and `lib/platform/ops-audit.ts`.

## Platform & audit tables (built for console / ops reads)

Already in the DB from `weeon-tenants` migrations:

- `tenant_backups` — per-tenant snapshot (`kind`, `as_of`, `payload` JSON,
  `row_count`, timestamp) + RPCs `capture_tenant_backup`,
  `backup_all_tenants`, `restore_tenant_backup`.
- `trial_requests` — SABER trial-request funnel state (`saber_code`, `email`,
  `email_verified`, `consumed_at`, `tenant_id`).
- `tenant_restore_log`, `tenant_admin_log` — internal ops/audit rows.
  `tenant_admin_log.provision_kind` records admin `created`/`linked`/`removed`,
  including Ops school-admin add/remove.
- `admin_invites` (legacy — no longer created, unreadable by tenants),
  `admin_password_resets` — school-admin password-reset ops.

These live in the same DB and are the raw material for the console's health /
audit views (see `audit-log.md`).

## Computed metrics

One SQL aggregation, owned additively in `weeon-tenants`:
**`public.platform_tenant_metrics`** (`20260910160000_platform_tenant_metrics.sql`).
One row per tenant — `profiles`, `admins`, `teacher_users`, `student_users`,
`parent_users`, `students`, `teachers`, `classes`, `enrollments` — with
soft-deletes respected and access limited to the service role. The console reads
it via `lib/platform/metrics.ts`; see `metrics.md` and `TenantRosterCounts` in
`lib/domain.ts`.

Related schema additions from the same period (owned by `weeon-tenants`):
`tenants.grace_ends_at` / `trial_reminder_stage` (trial lifecycle),
`students_guardians_required` (every student needs a guardian),
`tenant_admin_log.provision_kind='removed'` (ops admin offboarding).

## Rules for this repo

1. Confirm schema against `weeon-tenants` before relying on or summing a column.
2. All console reads are **platform scope** (service-role, server-only).
3. Do not create or alter schema here; additively extend in `weeon-tenants` while
   keeping `weeon-mobile` mobile working.

## Verified against the live database — 2026-09-10

Cross-checked with the shared Supabase project (service-role, read-only):
- **1 tenant** — `WEEON DEMO SCHOOL` (saber `999999-00`, `status=trial`,
  `plan=pro`); `trial_requests` **1**.
- `profiles`: **4** (2 school `admin`, 2 `teacher`). Both admins are school
  admins for testing `weeon-tenants` — **not** the Weeon Ops Security list.
- `roster_accounts`: **43** login usernames (`pending_first_login`) — 20
  `student` (`2026001…`), 20 `parent` (`e`+apellido), 3 `teacher`.
- Roster: **20** active `students` (+10 soft-deleted duplicates removed),
  **1** `teachers` record, **2** `classes` (1A/1B), **20** active
  `enrollments`; `subjects` **12** (seeded MEP catalog). Every student carries
  ≥1 guardian (`students_guardians_required`; placeholders are `Encargado/a`
  until the school supplies real data).
- `public.platform_tenant_metrics` returns non-zero counts for the demo tenant.
- Ops/audit: `tenant_backups` **11**, `activity_events` **55**,
  `admin_invites` **1** — the tables the console surfaces are live.
