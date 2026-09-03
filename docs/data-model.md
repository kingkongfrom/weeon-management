# Data model & live shared schema

*The source of truth is the **admin-owned** Supabase schema in the `weeon-admin`
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
| `status` | `active` \| `past_due` \| `suspended` \| `trial` |
| `plan` | e.g. `trial` \| `pro` (see `settings.plan`) |
| `subdomain` | `<x>.weeon.school` |
| `slug` | nullable |
| `saber_code` | nullable; the one cross-tenant-unique school identity |
| `settings` | JSONB — e.g. modules `{core, finance, transport}`, billing seat count, plan |
| `billing_seats` | Paid seat count (per-student pricing) |
| `subscription_id` | nullable (payment provider sub id) |
| `greenpay_subscription_id` | nullable |
| `trial_started_at`, `trial_ends_at` | nullable |
| `paid_at`, `paid_until` | nullable |
| `created_at`, `updated_at` | timestamps |

`tenants.status` lifecycle is covered in `lifecycle.md`.

## People & users per tenant

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

> For "how many users per tenant" prefer **auth-able people** = count on
> `profiles` (or `roster_accounts` with `auth_user_id`) per `tenant_id`. Do not
> double-count a student that also appears in `students` and `profiles`. The
> console's goal is *people who use the product in a school*, so `profiles` is
> the base; roster tables refine role splits (see `metrics.md`).

## Platform & audit tables (built for console / ops reads)

Already in the DB from `weeon-admin` migrations:

- `tenant_backups` — per-tenant snapshot (`kind`, `as_of`, `payload` JSON,
  `row_count`, timestamp) + RPCs `capture_tenant_backup`,
  `backup_all_tenants`, `restore_tenant_backup`.
- `trial_requests` — SABER trial-request funnel state (`saber_code`, `email`,
  `email_verified`, `consumed_at`, `tenant_id`).
- `tenant_restore_log`, `tenant_admin_log` — internal ops/audit rows.
- `admin_invites`, `admin_password_resets` — school-admin onboarding ops.

These live in the same DB and are the raw material for the console's health /
audit views (see `audit-log.md`).

## Computed metrics

Prefer one SQL aggregation (a view/RPC, additive in `weeon-admin`) over many
client queries. Intended shapes — see `metrics.md` and the `TenantMetrics` type
in `lib/domain.ts`.

## Rules for this repo

1. Confirm schema against `weeon-admin` before relying on or summing a column.
2. All console reads are **platform scope** (service-role, server-only).
3. Do not create or alter schema here; additively extend in `weeon-admin` while
   keeping `weeon-school` mobile working.
