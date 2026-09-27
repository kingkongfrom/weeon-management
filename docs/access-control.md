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
| User ID | `profiles.id` (short 8-char form) |
| Full name | `profiles.name` (+ email beneath) |
| School | `tenants.name` |
| Status | access state — Active / Pending first login / Inactive |

Search covers name, email, username, school name, and profile id; filter chips
bucket by access state (All / Active / Pending first login / Inactive).

**Detail popover** (`components/dashboard/access-control-client.tsx`) — clicking
a row opens a centred popover with the full record (Escape / outside-click
dismisses):

| Field | Source |
| ----- | ------ |
| Name, email | `profiles.name`, `email`/`auth_email` |
| Role | `profiles.role` (always `admin` here) |
| Account status | `profiles.account_status` |
| Active flag | `profiles.active` |
| School + school state | `tenants.name`, `tenants.status` (links to School page) |
| Username | `profiles.username` (`Not set` when null) |
| Last sign-in | **`auth.users.last_sign_in_at`** via the Auth Admin API |
| Last password reset | latest `admin_password_resets.consumed_at` for the user |
| Added | `profiles.created_at` |

`profiles.id` is deliberately **not** shown at display level — it is an
implementation detail, not something Ops acts on.

**Login data comes from Supabase Auth, not `profiles`.** `profiles.first_login_at`
exists in the generated types but is **never written by any app** — it is always
`NULL`. Real sign-in activity lives in `auth.users.last_sign_in_at`, so
`listAdminAccounts()` pages the Auth Admin API and merges by user id. If the
Admin API is unavailable the field falls back to `NULL` (shows "Never signed
in") rather than failing the page.

**Note on "last password updated":** there is no `profiles.password_updated_at`
in the schema, so the popover shows **Last password reset** from
`admin_password_resets` (a reset *link that was used*). A true "password
changed" timestamp needs an additive column in `weeon-tenants` set by the
reset/change flows — see Phase 2.

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
  (today the popover approximates it with the last consumed password reset).
- **`profiles.last_sign_in_at`** — to mirror Auth's `last_sign_in_at` so the
  console can query/sort on sign-in without paging the Auth Admin API.

Do not invent these columns here — design and land them in `weeon-tenants`
first, then consume them.

## Related

- School-level suspend/reactivate: `docs/lifecycle.md` § Suspension.
- Admin add/remove for one school: School page → **People**.
- Ops staff (Weeon employees, not school admins): `/dashboard/security`,
  `docs/auth.md`.
