# Ops — Parent Payments add-on (`parent_payments`)

*Enable **Cobros en línea / Finance** per school. **Canonical product spec:**
[`weeon-tenants/docs/finance-module.md`](../../weeon-tenants/docs/finance-module.md).*

## What this add-on does

When **on** for a tenant:

- School ERP shows finance / charge management (`/dashboard/fees`).
- Parent mobile app shows **Pagos** for linked students.
- Card and other rails use **ONVO** on the **school’s connected account**
  (`onBehalfOf`) — not Weeon’s GreenPay SaaS keys.

When **off**: no new parent payment UX; paid history may remain read-only in ERP.

## Ops workflow

1. Confirm school purchased the add-on (commercial record).
2. Ops console: enable `parent_payments` (`tenant_addons.enabled = true`).
3. Notify school admin: open ERP → **Activar cobros en línea** → complete **ONVO
   onboarding link** (legal + IBAN on ONVO’s site).
4. Support sandbox test payment (parent app + ONVO test methods).
5. Go-live when connected account status is **active** in ONVO (no credential swap
   in ERP for production — ONVO handles live mode on the account).

**Ops does not** store school payment secrets. Weeon holds only the marketplace
parent ONVO keys (server env).

## Prerequisites before enabling

| Requirement | Why |
| ----------- | --- |
| Tenant `status` **active** (or documented pilot exception) | Avoid cobros on expired trials |
| School admin account exists | Onboarding link + charge creation |
| Guardians linked to students | Payers are encargados with app login |

## Disable

- Set add-on `enabled = false`.
- Parent app hides Pagos on next session / `tenant_parent_payments_status()`.
- Do not delete payment history or ONVO account mapping without school request.

## Implementation status

| Item | State |
| ---- | ----- |
| Schema + RPCs | Shipped (`20260915180000_parent_payments.sql`, fee tables) |
| Ops toggle | School page → **Modules** (`parent_payments`) |
| Parent Pagos (mobile) | Shipped (ERP API) |
| **ONVO Marketplace onboarding** | **Target** — see `finance-module.md` |
| Legacy GreenPay wizard in ERP | Pilot MVP; deprecate for new schools |

## Related

| Repo | Doc |
| ---- | --- |
| `weeon-tenants` | `docs/finance-module.md` |
| `weeon-mobile` | Parent **Pagos** (`AGENTS.md`) |
