# Tenant lifecycle & subscription signals

*Business rules that explain `tenants.status`, `tenants.plan`, trial dates,
billing seats, and how the ops console should read them. Source of truth for
behavior lives in the sibling repos (`weeon-tenants` / `weeon-marketing` /
`weeon-mobile` plans and `docs`).*

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
| `manual` | **Ops** — School page → Overview → **Danger zone** (no reason picker) | `read_only` immediately | support CTA |

Suspension lives in the school page's **Danger zone** (bottom of Overview) and
requires a **confirmation step** — suspending is high-consequence and
low-frequency, so it must not be a single accidental click. Reactivating is
restorative and stays one click.

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

Canonical requirements: **`docs/onboarding-commercial.md`**.

1. Prospect gets a **live demo + video call**; plan, modules, add-ons, and seats
   are discussed on the call (no self-serve trial signup).
2. Weeon Ops creates the school space and administrator from
   `/dashboard/onboarding` via the tenants-owned provisioning API.
3. Tenant starts **`demo`** (full access), default **`demo_ends_at = now + 3 days`**
   (Ops may extend for junta/director time). Admin sets password on first ERP login.
4. **Default:** school **activates** (payment → **`active`**). If the clock passes
   first, tenant becomes **`demo_expired`** (**read-only**) while negotiating.
5. Optional **pilot** — capped proof before pay; roster bulk Auth still defaults to
   post-`active` unless Ops seeds manually.
6. Ongoing billing: renewal → `past_due` on failure → grace → `suspended`.

The console **creates** demo tenants; payment-driven **`active`** transitions live
in `weeon-tenants` / ONVO (GreenPay legacy in code).

## Seat & user accounting

- The console reports **users per tenant** from `profiles` (see `metrics.md`),
  plus seat utilization vs `billing_seats`.
- Pending (unprovisioned) accounts can be watched via `profiles.provisioned_at`
  and `roster_accounts`.

## Reading for health dashboards

A good health view buckets tenants: **healthy** (`active`), **nurturing**
(`demo`, expiring N days on `demo_ends_at`; legacy `trial` if any), **needs attention**
(`demo_expired`, `past_due`), **at risk**
(`suspended`, or no recent backup). Aggregation (additive view/RPC in
`weeon-tenants`) computing these buckets from one query is preferred.
