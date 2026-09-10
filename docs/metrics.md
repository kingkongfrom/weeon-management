# Tenant metrics

*The specific numbers the ops console must show and how to source them
correctly from the shared Supabase schema. Types: `TenantRosterCounts` /
`TenantMetrics` in `lib/domain.ts`; loader in `lib/platform/metrics.ts`, which
reads the `public.platform_tenant_metrics` view.*

## Why per-tenant metrics matter

The organization needs, at a glance, to run every school efficiently: revenue
(plan × seats), load (roster size / usage), and risk (trial ending, unpaid,
suspended, no recent backup). Everything here is **cross-tenant** (platform
scope), so all reads go through `lib/supabase/platform.ts`.

## Metric set

### Tenants (master counts)

| Metric | Source |
| ------ | ------ |
| Total tenants | `count(*) over tenants` |
| By status | group by `tenants.status` (`trial / active / past_due / suspended`) |
| Plan mix | group by `tenants.plan` (or `settings.plan`) |
| New this month | `tenants.created_at` in the period |

`tenants.status` values follow `lifecycle.md`: `trial → active → past_due →
suspended`.

### Users per tenant

| Metric | Source | Notes |
| ------ | ------ | ----- |
| **Auth-able people** | `count(profiles.*) group by tenant_id` | Primary "users per tenant" |
| Role split | `profiles.role` breakdown per tenant | teacher / student / parent / (school) admin |
| Provisioned so far | `profiles.provisioned_at is not null` | product sign-in progress |
| Mobile acccounts | `roster_accounts`, optionally only `auth_user_id is not null` | reconcile with `auth.users` (needs admin scope) |

> Don't double count. If you also surface `students`/`teachers` for a role view,
> those derive from roster tables and may duplicate a `profiles` row — label them
> as *roster records*, separate from *users (profiles)*.

### Tenant stats / health

| Metric | Source |
| ------ | ------ |
| Seat utilization | `profiles` count vs `tenants.billing_seats` (and/or `settings.billingSeats`) |
| Trial ending soon | `trial_ends_at` within N days (status `trial`) |
| Past-due count | `status = 'past_due'` |
| Suspended count | `status = 'suspended'` |
| Backup recency | newest `tenant_backups.created_at` per tenant within the interval (see `audit-log.md`) |
| Add-on modules enabled | `tenants.settings.modules` (`{core, finance, transport}`) |

## Data-access guidance

- **Source of truth:** `public.platform_tenant_metrics` — a single view owned in
  `weeon-tenants` (`20260910160000_platform_tenant_metrics.sql`). One row per
  tenant with `profiles`, `admins`, `teacher_users`, `student_users`,
  `parent_users`, `students`, `teachers`, `classes`, `enrollments`. Counts
  respect soft-deletes (`students`/`teachers.deleted_at`,
  `enrollments.dropped_at`, `classes.active`). The view is **service-role only**
  (revoked from `anon`/`authenticated`).
- `lib/platform/metrics.ts` reads it once (`listTenantMetrics`) and maps rows to
  `TenantRosterCounts`; `getTenantRosterCounts(tenantId)` serves the tenant
  detail page.
- Do not compute roster roll-ups with repeated per-tenant client selects at
  platform scale. To add a metric, extend the view and keep `TenantRosterCounts`
  in sync.
- `billing_seats` (`tenants`) is the **paid** seat count (0 until payment) —
  distinct from the roster numbers above; never conflate the two.

## Presenting

- Overview page = aggregate cards across all tenants (totals, trials, at-risk).
- Tenants page = table, one row per tenant, with users-per-tenant and status.
- Tenant page = all columns of the tenant + its seat/health summary.
- Status colors and text live in `components/ui/StatusBadge.tsx`
  (`active=grey/ok`, `trial=violet`, `past_due=amber`, `suspended=red`).
