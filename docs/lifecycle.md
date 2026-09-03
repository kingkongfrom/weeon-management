# Tenant lifecycle & subscription signals

*Business rules that explain `tenants.status`, `tenants.plan`, trial dates,
billing seats, and how the ops console should read them. Source of truth for
behavior lives in the sibling repos (`weeon-admin` / `weeon-marketing` /
`weeon-school` plans and `docs`).*

## One line

A row in `tenants` = one school = one subscription. The console watches
`tenants.status` and the seat/trial columns to keep the org running smoothly.

## States

`tenants.status` allowed values (from live schema check constraint):
`trial`, `active`, `past_due`, `suspended`.

A `status` **does not** carry the full trial clock by itself — the clock is in
`trial_started_at` / `trial_ends_at`. `trial` means "inside the 14-day trial
awaiting conversion". On conversion the status moves to `active`; `past_due` /
`suspended` relate to a live/paid subscription and are separate from the trial
clock.

| Status | Meaning | What the console flags |
| ------ | ------- | ---------------------- |
| `trial` | School created, 14-day window running (or awaiting conversion) | Stripe expiry: `trial_ends_at` near → nurture / convert |
| `active` | Currently subscribed (paid) | Healthy; monitor seats & renewals |
| `past_due` | Payment failed; grace period | **Action** — contact school |
| `suspended` | Subscription ended / unpaid past grace | **Action** — at risk of full loss; read-only for them |

A trial converts to `active` on payment; `paid_until` / `billing_seats` then
reflect the billed month and paid seat count.

## Relevant columns

| Signal | Column(s) |
| ------ | --------- |
| Lifecycle state | `tenants.status` |
| Trial clock | `trial_started_at`, `trial_ends_at` |
| Paid subscription | `plan`, `subscription_id`, `greenpay_subscription_id`, `paid_at`, `paid_until` |
| Seat count | `billing_seats` (and `settings.billingSeats`/modules JSON) |
| Modules enabled | `tenants.settings.modules` (`{core, finance, transport}`) — `finance`/`transport` are paid add-ons |

## Commercial path (context)

1. Marketing trial request → approval → activation token.
2. `weeon-admin` verifies/claims (SABER) and starts a 14-day trial → status
   `trial`, `trial_started_at` set.
3. Payment (GreenPay/Stripe, post-MVP) converts trial → `active` with seats;
   **roster provisioning + auth users happen after payment**.
4. Ongoing billing: renewal charges → `past_due` on failure → grace → `suspended`.

The console's role is to **observe** and **alert**, not to change lifecycle
state (that logic lives in `weeon-admin` / payment service).

## Seat & user accounting

- The console reports **users per tenant** from `profiles` (see `metrics.md`),
  plus seat utilization vs `billing_seats`.
- Pending (unprovisioned) accounts can be watched via `profiles.provisioned_at`
  and `roster_accounts`.

## Reading for health dashboards

A good health view buckets tenants: **healthy** (`active`), **nurturing**
(`trial`, expiring N days), **needs attention** (`past_due`), **at risk**
(`suspended`, or no recent backup). Aggregation (additive view/RPC in
`weeon-admin`) computing these buckets from one query is preferred.
