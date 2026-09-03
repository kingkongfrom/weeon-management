# Weeon / EduNova — Repositories & ownership

*Who builds what, and where the boundaries are. Read before touching
architecture or deciding where a feature belongs.*

## The four repos

The Weeon product is **multi-tenant school SaaS** ("Woot It"-style,
Costa Rica 2026). Every app reads the **same single Supabase project**, but at
different scopes.

| Repo | URL | Surface | Audience | Scope | Stack |
| ---- | --- | ------- | -------- | ----- | ----- |
| **weeon-marketing** | https://github.com/kingkongfrom/weeon-marketing | Public site + trial funnel (`https://weeon.school`) | Prospects | Public | Next.js 16 |
| **weeon-admin** | https://github.com/kingkongfrom/weeon-admin | School web admin / ERP (`https://app.weeon.school`) | School administrators (one tenant) | Tenant-scoped RLS | Next.js 16 |
| **weeon-school** | https://github.com/kingkongfrom/weeon-school | Mobile apps — teachers, students, parents | End users | Tenant-scoped RLS via end-user auth | Flutter |
| **weeon-management** | https://github.com/kingkongfrom/weeon-management | **Internal ops console** (`https://ops.weeon.school`) | **Weeon / EduNova staff** | **Cross-tenant (platform)** | Next.js 16 |

This `docs/repositories.md` lives in **`weeon-management`**, the platform ops
console. Sibling trees may still name this surface **`weeon-platform-admin`
(planned)** — that is this repo. Full relationship, commercial path, and
auth/DB boundaries: **`docs/ecosystem.md`**.

## weeon-management = the platform ops console

This repo is the one the **organization** uses to run itself efficiently. It is
**not** the school ERP and **not** a mobile client. Its job:

- List every **tenant** (institution) and its **status / plan / subscription**.
- Count **users per tenant** (`profiles`) and report roster size and usage.
- Surface **tenant stats** and **health signals** (trials ending, past-due,
  suspended, backups recent, seat utilization).
- Track platform-internal actions via the audit tables already in the DB.

School administrators never log in here — their ERP is `weeon-admin`. Platform
staff authenticate under their own dedicated model (`docs/auth.md`). Being a
school admin on a tenant (including WEEON DEMO SCHOOL) does **not** make
someone a Weeon Ops administrator.

## Shared database vs this repo’s own data

All four apps use **one Supabase project**:

| Kind | Owned by | Examples | This repo |
| --- | --- | --- | --- |
| Tenant / school data | `weeon-admin` schema | `tenants`, `profiles`, roster, `admin_invites` | **Read** via service-role for ops views. Never treat as ops-staff identity. |
| Platform audit | `weeon-admin` (additive) | `tenant_backups`, `tenant_restore_log`, `trial_requests` | **Read** for health / audit UI |
| Weeon Ops staff | **this repo** | `lib/auth/policy.ts`, `data/ops-staff.json` | Write invites/resets here. Do not invent `platform_staff` tables in this repo; additive schema still goes in `weeon-admin`. |
| Auth users | Shared GoTrue | `auth.users` | Same email can be a school user **and** (only if invited here) ops staff. Metadata `platform_staff` is a hint, not the Settings list. |

## Reading the shared database

- The Supabase **schema is owned by `weeon-admin`**. Confirm any table/column /
  RLS work against `weeon-admin` self `lib/supabase/database.types.ts` and
  `supabase/migrations/` — never against stale local copies.
- `weeon-school` (Flutter / mobile) shares that schema and RLS. Any schema/RLS
  change made anywhere must be **additive** and must not break the mobile app.
- **RLS is tenant-scoped.** `weeon-admin` and `weeon-school` read through
  tenant-scoped RLS. `weeon-management` is the **exception**: it is the platform
  surface and reads **across** tenants via the **server-only service-role
  client**. It never relies on tenant-scoped RLS for its own views.

## Boundary rules (agents)

| Want to build… | Goes in |
| -------------- | ------- |
| Public pages, trial request funnel | `weeon-marketing` |
| School admin UI for one tenant (ERP, people, classes, calendar, settings) | `weeon-admin` |
| Teacher / student / parent screens | `weeon-school` |
| Cross-tenant dashboards, tenant/user-per-tenant stats, platform audit UI, org-level health | **`weeon-management`** (this repo) |
| Schema / RLS / Auth change | Additive, in `weeon-admin`, safe for mobile |

> Do not duplicate the marketing site, the school ERP, or mobile screens in
> `weeon-management`, and do not build cross-tenant staff dashboards in
> `weeon-admin`. When unsure, ask which repo the surface/repo is.
