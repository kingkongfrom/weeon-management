# Weeon ecosystem — how this repo fits

*Canonical map for agents building **weeon-management** (Weeon Ops).*
Sibling docs still call this surface **`weeon-platform-admin` (planned)**.
That product **is this repo**, live as `https://ops.weeon.school`.

Read sibling sources when a change crosses a boundary; do not copy their UI.

| Repo (checkout) | Their docs | What they still say |
| --- | --- | --- |
| `weeon-admin` | `docs/repositories.md`, `docs/overview.md` | Fourth app is **planned** `weeon-platform-admin` |
| `weeon-marketing` | `docs/repositories.md`, `docs/trial-request-flow.md` | Three repos; they do not list ops |
| `weeon-school` | Flutter app | Same Supabase schema as admin |

## One product, four surfaces

```
 Prospect                School admin              Teachers / students / parents
     │                         │                              │
 weeon-marketing          weeon-admin                    weeon-school
 weeon.school             app.weeon.school               iOS / Android
 trial + verify           one-tenant ERP                 roster Auth + RLS
     │                         │                              │
     └─────────────────────────┴──────────────────────────────┘
                               │
                    Shared Supabase project
                    (dashboard name: weeon-school)
                    Postgres + Auth + RLS
                               │
                    weeon-management  ← you are here
                    ops.weeon.school
                    Weeon / EduNova staff
                    service-role, cross-tenant
```

Commercial path (from `weeon-admin/docs/lifecycle.md` +
`weeon-marketing/docs/trial-request-flow.md`):

1. Marketing collects Código SABER + institutional email.
2. Auto-approve verifies inbox (`/verify`), then sends the person to
   `app.weeon.school/complete-signup` to set a **school admin** password.
3. `weeon-admin` creates a **new tenant** + `profiles.role = 'admin'`.
4. 14-day trial → GreenPay → provision teachers/students/parents.
5. Those end users set passwords in **weeon-school** (mobile), not here.

This console never implements that funnel. It **observes** the result:
tenants, trial/paid status, school-admin contacts, backups, audit.

## Who authenticates where

| Person | App | Identity |
| --- | --- | --- |
| Weeon staff (Eduardo, invited ops) | `ops.weeon.school` | `docs/auth.md` in **this** repo. Not `profiles`. |
| School administrator | `app.weeon.school` | `profiles.role = 'admin'` + `tenant_id`. See `weeon-admin/docs/auth.md` and `account-security-ops.md`. |
| Teacher / student / parent | weeon-school mobile | Roster `profiles` + `roster_accounts`. |

Shared Auth project: one email is one `auth.users` row. Eduardo can be a
**demo-tenant school admin** (testing `weeon-admin`) and the **ops owner**
here. Those are different products. Do not load Security → Administrators
from `profiles` or `admin_invites`.

School-admin tables (`admin_invites`, `admin_password_resets`,
`tenant_admin_log`) are **ops-readable** for tenant health, never the
source of Weeon Ops membership.

## Database (owned by weeon-admin)

Authoritative live schema: `weeon-admin/lib/supabase/database.types.ts` and
`weeon-admin/supabase/migrations/`. Isolation rules:
`weeon-admin/docs/tenancy.md` — every academic row has `tenant_id`; uniqueness
is `(tenant_id, …)` except `tenants.saber_code`.

This repo:

- **Reads** tenants, profiles (counts + school admins), backups, trial
  requests, restore/admin logs — service-role only (`lib/supabase/platform.ts`).
- **Does not** invent tables here. Additive schema still lands in
  `weeon-admin` and must stay safe for Flutter.
- **Writes** ops-staff invites/resets in `data/ops-staff.json` + Auth admin
  APIs. Branded mail via Resend (same pattern as admin, different origin and
  templates).

## Brand

Align with `weeon-admin` (Geist, theme tokens, purple→blue `#5e25cc`→`#2b59ff`).
The small mark is the **admin `LogoMark` W path**, not a smiley and not a
generic Arial W. Wordmark may say **Weeon Ops** (admin says Weeon School).

## Agent rules (this repo)

1. You are in **weeon-management**. Build cross-tenant ops UI only.
2. Do not rebuild marketing, the school ERP, or mobile screens.
3. Do not treat `profiles.role = 'admin'` as Weeon Ops access.
4. Confirm columns against weeon-admin before aggregating.
5. Sibling docs that say “platform admin is not started” are stale — this
   repo is that surface. Prefer **this** `docs/` for ops-staff and routes.
