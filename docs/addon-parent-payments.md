# Ops — Parent Payments add-on (`parent_payments`)

*Enable **Cobros a encargados** per school. Full product spec:
`weeon-tenants/docs/finance-parent-payments.md`.*

## What this add-on does

When **on** for a tenant:

- School ERP shows finance / charge management (after implementation).
- Parent mobile app shows **Pagos** for linked students.
- Card payments use the **school’s GreenPay merchant**, not Weeon’s platform keys.

When **off**: no parent payment UI; no new charges (paid history may remain visible).

## Ops workflow (flip the switch)

1. Confirm school purchased the add-on (commercial record — CRM/spreadsheet until automated).
2. In ops console: enable `parent_payments` for the tenant (`tenant_addons.enabled = true`).
3. Notify school admin: complete **Conectar GreenPay** in ERP (`app.weeon.school`).
4. Support school through sandbox test payment (parent app + test card).
5. For go-live: school swaps to production GreenPay credentials in ERP.

**Ops does not** store school GreenPay secrets in ops env — only the tenant row in Supabase.

## Prerequisites before enabling

| Requirement | Why |
| ----------- | --- |
| Tenant `status` active (or trial policy TBD) | Avoid payment features on expired trials |
| School admin account exists | GreenPay wizard + charge creation |
| Parent roster / links in use | Payers must be encargados with app login |

## Disable

- Set add-on `enabled = false`.
- Parent app hides Pagos on next session / feature poll.
- Do not delete `tenant_payment_providers` or payment history without school request.

## Implementation status

**Built (2026-09):**

- Schema + RPCs: `weeon-tenants` migration `20260915180000_parent_payments.sql`
- Ops toggle: tenant detail → **Parent payments add-on** card
- School wizard: `app.weeon.school` → **Configuración → Cobros en línea (GreenPay)**
- Parent app: `weeon-mobile` → **Pagos** (add-on gated)

## Related

| Repo | Doc |
| ---- | --- |
| `weeon-tenants` | `docs/finance-parent-payments.md` |
| `weeon-mobile` | Parent **Pagos** UI |
