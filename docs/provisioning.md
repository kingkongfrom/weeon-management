# School provisioning (guided demo)

*How Weeon Ops creates a school space and its administrator account after a
**live demo and video call**. This replaces the retired self-serve trial funnel.*

**Product requirements:** **`docs/onboarding-commercial.md`** (workspace root).

## One line

Sales runs a guided demo; Ops creates the tenant + admin from **Onboarding**
(`/dashboard/onboarding`); the tenant runs in **`demo`** (default **3 days**,
extendable); the admin sets a password on first login; **payment → `active`**
starts roster Auth provisioning at scale.

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

## Privacy / PRODHAB (LGL-1)

After **`active`**, Ops should send the school the **responsable** handout (Pack B
in [`docs/prodhab-pack.md`](../../docs/prodhab-pack.md)): the
institution is controller of student/guardian data; Weeon is **encargado**;
registration before PRODHAB may be required under Ley 8968 art. 21. When Weeon’s
encargado expediente exists, include that reference from
[`docs/prodhab-filing-log.md`](prodhab-filing-log.md). Breaches:
[`security-incidents.md`](security-incidents.md).

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

## Sales handoff (before Ops clicks Create)

On the **video call**, align and record (Ops notes / CRM):

- **Plan** and **`billing_seats`**
- **Core modules** (always on) vs **add-ons** (e.g. `parent_payments`) — toggled in Ops
- **Default expectation:** continuation + **activation** after demo, not a public trial
- **Demo length:** default 3 days; extend **`demo_ends_at`** when junta/director needs
  **7–14 days** total
- **Pilot:** only if capped mobile/grupo proof is required before pay — see
  `docs/onboarding-commercial.md`

## Access & expiry

- `demo` → `full` until `demo_ends_at`, then `read_only`.
- `demo_expired` → `read_only` until the tenant is activated (paid → `active`).
- The daily cron calls `sync_tenant_demo_statuses()` to flip the label; access is
  date-derived so it is correct even before the cron runs.
- Demos send **no** reminder emails (unlike legacy `trial` reminders).
- Ops may **extend `demo_ends_at`** for evaluation; avoid indefinite free ERP without
  a convert-or-close decision.

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

## When Onboarding breaks

Onboarding fails at **step 1** with *“No pudimos completar la operación”* when
the Ops → ERP call never lands. Work outward from `post()` in
`lib/platform/provisioning.ts`; the browser never sees the real cause.

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| *“La incorporación no está configurada en este entorno…”* | `WEEON_APP_ORIGIN` or `OPS_PROVISIONING_SECRET` missing in **this** environment | Set both on the Ops project (Vercel → Settings → Environment Variables), then **redeploy** — Vercel bakes env at build time |
| Same message, env is set | Secret does not match `weeon-tenants` → ERP returns `401` | Re-copy the secret so both repos hold the identical value; redeploy both |
| Lookup works but no catalog rows are shown | `data/private-schools.json` missing from the deployed ERP function | Ensure `outputFileTracingIncludes` covers it in `weeon-tenants/next.config.ts` |
| Local only: every route times out or 404s | Stale `.next` cache, or Turbopack picking a workspace root above the repo | Delete `weeon-tenants/.next`; keep `turbopack.root` pinned in `next.config.ts` |
| Local only: cannot connect | The ERP is not running, or `WEEON_APP_ORIGIN` points at the wrong port | Check which port `weeon-tenants` actually listens on (`netstat -ano \| findstr LISTEN`, then match the PID to the repo) and point `WEEON_APP_ORIGIN` at it, e.g. `http://localhost:3003`. `localhost:3001` is Ops itself in a typical multi-repo workspace, so the call loops back and the wizard shows the generic failure. Restart the Ops dev server after editing `.env.local`. |

Deployment checklist — **both sides must be configured**, a secret in one repo
alone still yields `401`:

1. `weeon-tenants` (Vercel): `OPS_PROVISIONING_SECRET`.
2. `weeon-management` (Vercel): `WEEON_APP_ORIGIN=https://app.weeon.school` +
   the **same** `OPS_PROVISIONING_SECRET`.
3. Redeploy Ops after any env change.

**Verify without the UI** — a `200` with catalog JSON proves the secret pair and
the origin are correct:

```powershell
curl -s -o NUL -w "%{http_code}" -X POST https://app.weeon.school/api/ops/schools/preview `
  -H "content-type: application/json" -H "authorization: Bearer $env:OPS_PROVISIONING_SECRET" `
  -d '{"country":"CR","schoolCode":"200167-00"}'
```

For manual QA, unclaimed CR codes from the catalog include `200167-00`,
`200226-00`, `200413-00`, `205299-00`, `200271-00`; `888888-00` is absent from the
catalog and should return the "no encontramos" message (not the generic error).
