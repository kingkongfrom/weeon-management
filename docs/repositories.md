# Weeon — Repositories & ownership

*Who builds what, and where the boundaries are. Read before touching
architecture or deciding where a feature belongs.*

## The five repos

The Weeon product is **multi-tenant school SaaS** ("Woot It"-style,
Costa Rica 2026). Every school app reads the **same single Supabase project**,
but at different scopes. Workspace map: `../AGENTS.md`.

| Repo | URL | Surface | Audience | Scope | Stack |
| ---- | --- | ------- | -------- | ----- | ----- |
| **weeon-marketing** | https://github.com/kingkongfrom/weeon-marketing | Public site + trial funnel (`https://weeon.school`) | Prospects | Public | Next.js 16 |
| **weeon-tenants** | https://github.com/kingkongfrom/weeon-tenants | School web admin / ERP (`https://app.weeon.school`) | School administrators (one tenant) | Tenant-scoped RLS | Next.js 16 |
| **weeon-mobile-apps** | https://github.com/kingkongfrom/weeon-mobile-apps | Mobile apps — teachers, students, parents | End users | Tenant-scoped RLS via end-user auth | Flutter |
| **weeon-teachers** | https://github.com/kingkongfrom/weeon-teachers | Teacher web — reports / desktop | Teachers | Tenant-scoped RLS (when wired) | Next.js 16 |
| **weeon-management** | https://github.com/kingkongfrom/weeon-management | **Internal ops console** (`https://ops.weeon.school`) | **Weeon staff** | **Cross-tenant (platform)** | Next.js 16 |

This `docs/repositories.md` lives in **`weeon-management`**, the platform ops
console (older docs named it `weeon-platform-admin`). Full relationship,
commercial path, and auth/DB boundaries: **`docs/ecosystem.md`**.

## weeon-management = the platform ops console

This repo is the one the **organization** uses to run itself efficiently. It is
**not** the school ERP and **not** a mobile client. Its job:

- List every **tenant** (institution) and its **status / plan / subscription**.
- Count **users per tenant** (`profiles`) and report roster size and usage.
- Surface **tenant stats** and **health signals** (trials ending, past-due,
  suspended, backups recent, seat utilization).
- Track platform-internal actions via the audit tables already in the DB.

School administrators never log in here — their ERP is `weeon-tenants`. Platform
staff authenticate under their own dedicated model (`docs/auth.md`). Being a
school admin on a tenant (including WEEON DEMO SCHOOL) does **not** make
someone a Weeon Ops administrator.

## Shared database vs this repo’s own data

All school apps use **one Supabase project**:

| Kind | Owned by | Examples | This repo |
| --- | --- | --- | --- |
| Tenant / school data | `weeon-tenants` schema | `tenants`, `profiles`, roster, `admin_invites` | **Read** via service-role for ops views. Never treat as ops-staff identity. |
| Platform audit | `weeon-tenants` (additive) | `tenant_backups`, `tenant_restore_log`, `trial_requests` | **Read** for health / audit UI |
| Weeon Ops staff | **this repo** | `lib/auth/policy.ts`, `data/ops-staff.json` | Write invites/resets here. Do not invent `platform_staff` tables in this repo; additive schema still goes in `weeon-tenants`. |
| Auth users | Shared GoTrue | `auth.users` | Same email can be a school user **and** (only if invited here) ops staff. Metadata `platform_staff` is a hint, not the Settings list. |

## Reading the shared database

- The Supabase **schema is owned by `weeon-tenants`**. Confirm any table/column /
  RLS work against `weeon-tenants` self `lib/supabase/database.types.ts` and
  `supabase/migrations/` — never against stale local copies.
- `weeon-mobile-apps` (Flutter / mobile) shares that schema and RLS. Any schema/RLS
  change made anywhere must be **additive** and must not break the mobile app.
- **RLS is tenant-scoped.** `weeon-tenants` and `weeon-mobile-apps` read through
  tenant-scoped RLS. `weeon-management` is the **exception**: it is the platform
  surface and reads **across** tenants via the **server-only service-role
  client**. It never relies on tenant-scoped RLS for its own views.

## Boundary rules (agents)

| Want to build… | Goes in |
| -------------- | ------- |
| Public pages, trial request funnel | `weeon-marketing` |
| School admin UI for one tenant (ERP, people, classes, calendar, settings) | `weeon-tenants` |
| Teacher / student / parent **mobile** screens | `weeon-mobile-apps` |
| Teacher **web** reports | `weeon-teachers` |
| Cross-tenant dashboards, tenant/user-per-tenant stats, platform audit UI, org-level health | **`weeon-management`** (this repo) |
| Schema / RLS / Auth change | Additive, in `weeon-tenants`, safe for mobile and teacher web |

> Do not duplicate the marketing site, the school ERP, or mobile screens in
> `weeon-management`, and do not build cross-tenant staff dashboards in
> `weeon-tenants`. When unsure, ask which repo the surface/repo is.
