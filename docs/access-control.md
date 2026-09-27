# Access control (Ops)

Cross-tenant **administrator** directory. Route: `/dashboard/access`
(sidebar item **Access control**, `KeyRound` icon).

## Scope

Ops manages **administrator accounts only** (school admins,
`profiles.role = 'admin'`). Teachers, students, and guardians belong to the
school and are **out of scope** — they are not listed, searched, or actioned
here.

Two concerns, both here:

1. **User access** — locate an administrator, see their access state.
2. **School access** — the school's own state is shown on each row (status pill)
   and managed on the School page → **Overview → Danger zone** (bottom of the
   tab, with a confirmation step on suspend; reactivate is one click).

## What it shows (read-only, Phase 1)

`listAdminAccounts()` in `lib/platform/access-control.ts` reads `profiles`
joined to `tenants` through the **platform (service-role)** client — this is a
cross-tenant view, so tenant RLS does not apply. Never expose it to a
non-ops caller.

**Table** (`components/dashboard/access-control-client.tsx`) — one row per
administrator:

| Column | Source |
| ------ | ------ |
| Full name | `profiles.name` (+ email beneath) |
| Role | `profiles.role` |
| School | `tenants.name` |
| Status | access state — Active / Pending first login / Inactive |

Search covers name, email, username, school name, and profile id; filter chips
bucket by access state (All / Active / Pending first login / Inactive).

**Detail popover** (`components/dashboard/access-control-client.tsx`) — clicking
a row opens a centred popover with the full record (Escape / outside-click
dismisses):

| Field | Source |
| ----- | ------ |
| Name | `profiles.name` (header) |
| Login email | `auth_email` ?? `email` — shown under the name; **the credential admins sign in with** |
| Role | `profiles.role`, labelled by `resolveRoleLabel` (table column + popover row) |
| Account status | `profiles.account_status`, labelled by `resolveAccountStatusLabel` |
| Active flag | `profiles.active` |
| School + school state | `tenants.name`, `tenants.status` (links to School page) |
| Last sign-in | **`auth.users.last_sign_in_at`** via the Auth Admin API |
| Password set | latest `admin_password_resets.consumed_at`, else `profiles.created_at` (see note) |

`profiles.id` is deliberately **not** shown at display level — it is an
implementation detail, not something Ops acts on.

**Role vocabulary.** `profiles.role` is a plain `text` column with **no DB check
constraint**; the live values are `admin`, `teacher`, `student`, `parent`. Only
`roster_accounts.role` is constrained (`teacher|student|parent`). Both the role
and the account status are rendered through human labels in `lib/domain.ts`
(`resolveRoleLabel` → "School administrator", `resolveAccountStatusLabel` →
"Pending first login"); unknown values fall back to a title-cased version of the
raw string so nothing is silently hidden.

**Admins log in with email + password, not a username.** `lib/auth/actions.ts`
in `weeon-tenants` calls `signInWithPassword({ email })`, so the popover header
shows the email under the name as the credential. `profiles.username` is a
*teacher/roster* concept (teachers sign in with a username resolved to a
synthetic `…@…accounts.weeon.school` auth email) and is therefore **not** shown
here — admins have no username by design, so a "Not set" row would be
misleading.

**Login data comes from Supabase Auth, not `profiles`.**
`profiles.first_login_at` **is** written for roster users (teachers/students — it
holds their first login), but it is **never populated for admin accounts**, so
it always reads `NULL` here. Real sign-in activity lives in
`auth.users.last_sign_in_at`, so `listAdminAccounts()` resolves it via the Auth
Admin API per user.

> **Use `getUserById`, not `listUsers`.** On this project
> `auth.admin.listUsers()` returns **HTTP 500 "Database error finding users"**
> (a GoTrue server-side fault in the *list* endpoint), which silently produced
> "Never signed in" for every row. Single-user `getUserById` works. Admins are a
> small set, so N lookups are cheap — `Promise.all` over the admin ids.
>
> Failures are logged with `console.error` and fall back to `NULL` (shows
> "Never signed in"), so a broken Auth call is visible in the server log rather
> than masquerading as real data.

**Note on "Password set":** Supabase Auth exposes **no password timestamp**
(`password_updated_at` does not exist in the Auth user payload; verified). Since
an account that can sign in necessarily has a password, the popover resolves it
as the last consumed reset if there is one, otherwise `profiles.created_at` —
the moment the credential was created. It is labelled **"Password set"** with a
hint (`Via password reset` / `On account creation`) rather than "last changed",
so it never overstates. A true change timestamp needs an additive
`profiles.password_updated_at` in `weeon-tenants` written by both the reset flow
and the in-app change-password flow (see Phase 2).

## Phase 2 — account actions (implemented, migration pending)

Actions live in the popover (`components/dashboard/admin-actions.tsx`) and call
`lib/dashboard/admin-account-actions.ts`. Both audit through
`tenant_ops_audit` (`admin.suspended`, `admin.reactivated`, `admin.deleted`).

| Action | Effect | Reversible |
| ------ | ------ | ---------- |
| **Suspend** (deactivate) | `profiles.account_status = 'suspended'`; blocks sign-in and already-issued sessions | Yes — Reactivate |
| **Delete** | `profiles.deleted_at` stamped; Auth user **anonymized** (email replaced, password randomized, banned) | Only within 72h (schema purge is 72h) |

Notes:

- **Suspend and deactivate are the same state** — one action, not two.
- **Delete anonymizes, never hard-deletes the Auth row.** The credential is
  destroyed immediately; the profile row is retained 72h for audit/legal, then
  purged by `purge_deleted_profiles()`.
- **Retention is 72h**, reusing `public.soft_delete_retention_age()` — the same
  window as soft-deleted students/teachers.
- Soft-deleted admins are **excluded from the directory**; a **Suspended**
  filter chip surfaces suspended ones.
- Delete requires typing `DELETE` to confirm.

### Where enforcement lives

Schema + enforcement are in **`weeon-tenants`**
(`supabase/migrations/20260927140000_admin_access_lifecycle.sql`):

- new columns `profiles.deleted_at`, `deleted_by`, `status_reason`,
  `status_changed_at`; `account_status` CHECK gains `'suspended'`.
- `public.profile_is_blocked(uuid)` helper.
- `purge_deleted_profiles()` folded into the existing hourly
  `purge_deleted_records()` cron.
- **Sign-in guard** in `lib/auth/actions.ts` (refuses suspended/deleted admins
  and tears down the session).
- **Per-request guard** in `lib/dashboard/require-school-admin.ts`, so an
  already-issued session stops working immediately rather than at JWT expiry.

Scope: **school administrators only.** They are web-only, so nothing here
touches `weeon-mobile` or `weeon-teachers`.

> **Deployment:** the migration is **not applied** to the hosted DB. Apply with
> `npx supabase db push --linked --include-all` (it precedes already-applied
> migrations, so `--include-all` is required). Until then these actions will
> error on the missing columns.

## Phase 3 (not built)

- **Unlock** — there is still **no lockout concept** (no failed-attempt counter);
  it must be introduced or wired to Supabase Auth lockout.
- **`password_updated_at`** — for a true "last password changed" timestamp
  (today the popover approximates it: last consumed reset, else `created_at`,
  labelled "Password set"). Must be written by both the reset flow and the
  in-app change-password flow (`lib/auth/change-password.ts`).
- **`profiles.last_sign_in_at`** — to mirror Auth's `last_sign_in_at` so the
  console can query/sort on sign-in without per-user Auth lookups.

Do not invent these columns here — design and land them in `weeon-tenants`
first, then consume them.

## Related

- School-level suspend/reactivate: `docs/lifecycle.md` § Suspension.
- Admin add/remove for one school: School page → **People**.
- Ops staff (Weeon employees, not school admins): `/dashboard/security`,
  `docs/auth.md`.
