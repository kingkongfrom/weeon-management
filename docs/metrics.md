# Tenant metrics

*The specific numbers the ops console must show and how to source them
correctly from the shared Supabase schema. Skeleton types: `TenantMetrics` in
`lib/domain.ts`; skeleton loader in `lib/platform/metrics.ts`.*

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

- Prefer a **single aggregate view/RPC** (additive, owned in `weeon-admin`)
  returning one row per tenant with `counts`, `seats`, `latest backup`. The
  dashboard then does a single platform-scope select. The current skeleton
  only groups `profiles` to keep moving; replace N+1 loops as soon as the SQL
  view exists.
- Do not compute roster roll-ups with repeated per-tenant client selects at
  platform scale.
- Keep `TenantMetrics` in `lib/domain.ts` in sync with whichever view you write.

## Presenting

- Overview page = aggregate cards across all tenants (totals, trials, at-risk).
- Tenants page = table, one row per tenant, with users-per-tenant and status.
- Tenant page = all columns of the tenant + its seat/health summary.
- Status colors and text live in `components/ui/StatusBadge.tsx`
  (`active=grey/ok`, `trial=violet`, `past_due=amber`, `suspended=red`).
