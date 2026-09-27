# School provisioning (guided demo)

*How Weeon Ops creates a school space and its administrator account. This
replaces the retired self-serve trial funnel.*

## One line

Ops creates the tenant + admin from the **Onboarding** sidebar item
(`/dashboard/onboarding`); the tenant runs in `demo` for 3 days; the admin sets
a password on first login.

## Ownership

Weeon Ops owns the **UI**, but **not** the schema or the MEP catalog — those live
in `weeon-tenants` (the schema owner). So the wizard calls tenants-owned API
routes with a shared secret; the service-role key never leaves either server.

| Piece | Repo |
| ----- | ---- |
| Wizard UI + server actions | `weeon-management` |
| Provisioning API (`/api/ops/schools/*`) | `weeon-tenants` |
| Tenant insert + admin provisioning | `weeon-tenants/lib/ops/create-demo-tenant.ts` |
| First-password (reset) flow | `weeon-tenants/lib/auth/password-reset.ts` |

## Flow

1. Ops opens `/dashboard/onboarding`.
2. **Country + code lookup** → `POST {WEEON_APP_ORIGIN}/api/ops/schools/preview`
   → catalog identity + whether the school already has a tenant.
3. **Create** → `POST {WEEON_APP_ORIGIN}/api/ops/schools/create`
   with `{ country, schoolCode, name, adminFirstName, adminLastName, adminEmail }`.
4. The ERP inserts the tenant `status = 'demo'`, `country`, `school_code`
   (`saber_code` for CR), `demo_ends_at = now + 3 days`, hydrates `settings`
   from the catalog, and provisions the admin with
   `account_status = 'pending_first_login'` (no usable password).
5. Ops sees the success panel (subdomain, admin email, demo end date).
6. The admin goes to `app.weeon.school`, uses
   *“¿Primera vez? Cree su contraseña”*, and sets a password. Completion flips
   `account_status` to `active` and lands them on `/dashboard`.

## Country-agnostic school codes (LATAM groundwork)

Institution codes differ per country (CR: Código SABER, CL: RBD, MX: CCT, …), so
the schema uses generic **`tenants.country`** (ISO-2) + **`tenants.school_code`**,
unique per `(country, school_code)`. `saber_code` is kept as the CR-specific
column for backward compatibility.

- Validation + catalog lookup live in the **provider registry**
  `weeon-tenants/lib/geo/school-codes.ts` — one entry per country. Adding a
  country is a provider + catalog, not an onboarding rewrite.
- Only **CR** is wired today; the ops country picker
  (`lib/platform/school-countries.ts`) lists the others as *próximamente*.
- Code format is validated by the provider, **not** a DB constraint, so new
  countries need no migration.

## Adding / removing school administrators

The school ERP **cannot create its own admins** (the invite flow was removed; see
`weeon-tenants/docs/auth.md`). Administrators are managed from Ops:

- **Add:** tenant detail → **Administrators → Add administrator**
  (`components/dashboard/add-administrator.tsx`) → `addAdministratorAction` →
  `POST {WEEON_APP_ORIGIN}/api/ops/schools/administrators`. The ERP creates the
  Auth user + `profiles` row as `account_status = 'pending_first_login'`; the
  admin sets a password on first login (branded reset). Supports multiple admins.
- **Remove:** `removeTenantAdministratorAction` (with a **last-admin guard**), UI
  `components/dashboard/remove-administrator.tsx`.
- The school's `/dashboard/safety` shows a **read-only** administrators list.

## Access & expiry

- `demo` → `full` until `demo_ends_at`, then `read_only`.
- `demo_expired` → `read_only` until the tenant is activated (paid → `active`).
- The daily cron calls `sync_tenant_demo_statuses()` to flip the label; access is
  date-derived so it is correct even before the cron runs.
- Demos send **no** reminder emails.

## Configuration

| Variable | Where | Notes |
| -------- | ----- | ----- |
| `WEEON_APP_ORIGIN` | management | Base origin of the ERP (e.g. `https://app.weeon.school`) |
| `OPS_PROVISIONING_SECRET` | management + tenants | ≥16 chars, **identical** in both. Bearer token for `/api/ops/schools/*`. Server-only. |

## Guards

- **One live tenant per school**: unique index on `(country, school_code)` +
  app guard; the wizard blocks creation when `alreadyClaimed` is true.
- **Rollback**: if admin provisioning fails, the just-created tenant is deleted,
  so a partial demo is never left live.
- **No emailed passwords**: the admin sets their own via the reset flow.
- **Only ops staff** can call the server actions (platform session required),
  and only holders of `OPS_PROVISIONING_SECRET` can call the ERP API.
- **No raw/internal errors in the UI**: provisioning failures log server-side;
  the wizard only ever shows safe Spanish messages.
