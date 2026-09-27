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
   and managed on the School page (`Overview` → *School access*).

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
| Role | `profiles.role` (table column + popover row) |
| Account status | `profiles.account_status` |
| Active flag | `profiles.active` |
| School + school state | `tenants.name`, `tenants.status` (links to School page) |
| Last sign-in | **`auth.users.last_sign_in_at`** via the Auth Admin API |
| Password set | latest `admin_password_resets.consumed_at`, else `profiles.created_at` (see note) |

`profiles.id` is deliberately **not** shown at display level — it is an
implementation detail, not something Ops acts on.

**Admins log in with email + password, not a username.** `lib/auth/actions.ts`
in `weeon-tenants` calls `signInWithPassword({ email })`, so the popover header
shows the email under the name as the credential. `profiles.username` is a
*teacher/roster* concept (teachers sign in with a username resolved to a
synthetic `…@…accounts.weeon.school` auth email) and is therefore **not** shown
here — admins have no username by design, so a "Not set" row would be
misleading.

**Login data comes from Supabase Auth, not `profiles`.** `profiles.first_login_at`
exists in the generated types but is **never written by any app** — it is always
`NULL`. Real sign-in activity lives in `auth.users.last_sign_in_at`, so
`listAdminAccounts()` resolves it via the Auth Admin API per user.

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

## Phase 2 (planned — needs schema)

Mutations are **not** built yet. Each needs an additive change in
`weeon-tenants` (schema owner) and must not break `weeon-mobile` /
`weeon-teachers`:

- **Reset password** — reuse the ops invite/recovery `generateLink` pattern.
- **Resend activation** — for `pending_first_login`.
- **Suspend / activate a user** — needs a per-user status column; today
  suspension is **tenant-level only** (`tenants.suspend_reason`).
- **Unlock** — there is **no lockout concept in the schema today**; it must be
  introduced (e.g. `account_locked_at`) or wired to Supabase Auth lockout.
- **`password_updated_at`** — for a true "last password changed" timestamp
  (today the popover approximates it: last consumed reset, else `created_at`,
  labelled "Password set"). Must be written by both the reset flow and the
  in-app change-password flow (`lib/auth/change-password.ts`).
- **`profiles.last_sign_in_at`** — to mirror Auth's `last_sign_in_at` so the
  console can query/sort on sign-in without paging the Auth Admin API.

Do not invent these columns here — design and land them in `weeon-tenants`
first, then consume them.

## Related

- School-level suspend/reactivate: `docs/lifecycle.md` § Suspension.
- Admin add/remove for one school: School page → **People**.
- Ops staff (Weeon employees, not school admins): `/dashboard/security`,
  `docs/auth.md`.
