# Tenant lifecycle & subscription signals

*Business rules that explain `tenants.status`, `tenants.plan`, trial dates,
billing seats, and how the ops console should read them. Source of truth for
behavior lives in the sibling repos (`weeon-tenants` / `weeon-marketing` /
`weeon-mobile-apps` plans and `docs`).*

## One line

A row in `tenants` = one school = one subscription. The console watches
`tenants.status` and the seat/trial columns to keep the org running smoothly.

## States

`tenants.status` allowed values (from live schema check constraint):
`demo`, `demo_expired`, `active`, `past_due`, `suspended`, plus the legacy
`trial` / `trial_expired` retained for rows created before the guided-demo flow.

A `status` **does not** carry the full clock by itself â€” the demo clock is in
`demo_ends_at`. `demo` means "inside the 3-day guided-demo window"; once
`demo_ends_at` passes the school drops to **read-only** until it activates.
`past_due` / `suspended` relate to a live/paid subscription and are separate
from the demo clock.

| Status | Meaning | What the console flags |
| ------ | ------- | ---------------------- |
| `demo` | Ops-created school, 3-day demo running | Nurture / convert before `demo_ends_at` |
| `demo_expired` | Demo window closed, read-only until activation | **Action** â€” convert or reclaim |
| `active` | Currently subscribed (paid) | Healthy; monitor seats & renewals |
| `past_due` | Payment failed; grace period | **Action** â€” contact school |
| `suspended` | Access paused. Ops manual hold, or billing delinquency | **Action** â€” see below |
| `trial` / `trial_expired` | Legacy self-serve trial | Migrate to `active` |

A demo converts to `active` on payment; `paid_until` / `billing_seats` then
reflect the billed month and paid seat count.

### Suspension (`suspended`)

A suspended school keeps **read access**; writes are refused. Suspension is
reason-aware, and Ops only performs the manual kind:

| `suspend_reason` | Set by | Access | Admin message |
| ---------------- | ------ | ------ | ------------- |
| `delinquency` | **Billing system, automatic** | `full` during `suspended_grace_ends_at`, then `read_only` | payment CTA |
| `manual` | **Ops** — School page header → *Suspend school* (no reason picker) | `read_only` immediately | support CTA |

- The ops Suspend button sends `reason=manual`; `NULL` also reads as `manual`.
- On suspend, Ops emails the school administrators (branded Resend,
  `lib/email/suspension-email.ts`) — payment copy for delinquency, support-only
  copy for manual. Email failure never blocks the status change; the result is
  reported in the console message.
- The status pill splits the two at a glance: `suspended · payment` vs
  `suspended · manual`.
- Canonical contract + migration live in `weeon-tenants`
  (`docs/lifecycle.md` § School suspension, `20260927100000_tenant_suspension.sql`).

## Relevant columns

| Signal | Column(s) |
| ------ | --------- |
| Lifecycle state | `tenants.status` |
| Demo clock | `demo_ends_at` |
| Suspension | `suspend_reason`, `suspended_at`, `suspended_grace_ends_at` |
| Legacy trial clock | `trial_started_at`, `trial_ends_at`, `grace_ends_at` |
| Paid subscription | `plan`, `subscription_id`, `greenpay_subscription_id`, `paid_at`, `paid_until` |
| Seat count | `billing_seats` (and `settings.billingSeats`/modules JSON) |
| Modules enabled | `tenants.settings.modules` (`{core, finance, transport}`) â€” `finance`/`transport` are paid add-ons |
| First-login state | `profiles.account_status = 'pending_first_login'` |

## Commercial path (context)

1. Prospect books a **guided demo**; Weeon Ops creates the school space and the
   administrator account from the demo wizard
   (`/dashboard/onboarding`) via the tenants-owned provisioning API.
2. The tenant starts in `demo` (full access) for **3 days** (`demo_ends_at`).
   The administrator sets their password on first login.
3. If the school pays before the window closes, the tenant becomes `active`
   with seats. Otherwise it becomes `demo_expired` (**read-only**).
4. Ongoing billing: renewal charges â†’ `past_due` on failure â†’ grace â†’ `suspended`.

The console now **creates** demo tenants (and can reclaim them); lifecycle
*state transitions* beyond creation still live in `weeon-tenants` / payment.

## Seat & user accounting

- The console reports **users per tenant** from `profiles` (see `metrics.md`),
  plus seat utilization vs `billing_seats`.
- Pending (unprovisioned) accounts can be watched via `profiles.provisioned_at`
  and `roster_accounts`.

## Reading for health dashboards

A good health view buckets tenants: **healthy** (`active`), **nurturing**
(`trial`, expiring N days), **needs attention** (`past_due`), **at risk**
(`suspended`, or no recent backup). Aggregation (additive view/RPC in
`weeon-tenants`) computing these buckets from one query is preferred.
