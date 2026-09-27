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

| Field | Source |
| ----- | ------ |
| Name, email, username | `profiles.name`, `email`/`auth_email`, `username` |
| School + school state | `tenants.name`, `tenants.status` |
| Access state | `profiles.account_status` + `profiles.active` → Active / Pending first login / Inactive |
| Added | `profiles.created_at` |
| Last sign-in | `profiles.first_login_at` |
| Provisioning signals | `email_sent_at`, `provisioned_at` |

Search covers name, email, username, school name, and profile id; filter chips
bucket by access state (All / Active / Pending first login / Inactive).

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

Do not invent these columns here — design and land them in `weeon-tenants`
first, then consume them.

## Related

- School-level suspend/reactivate: `docs/lifecycle.md` § Suspension.
- Admin add/remove for one school: School page → **People**.
- Ops staff (Weeon employees, not school admins): `/dashboard/security`,
  `docs/auth.md`.
