# Platform staff authentication (Weeon Ops)

*Read this before changing login, Security → Administrators, invites, or
password reset.* This console’s administrators are **not** school
administrators. Mixing the two is a bug.

## Who may use this site

| | Weeon Ops staff | School (tenant) admin |
| --- | --- | --- |
| App | `https://ops.weeon.school` (this repo) | `https://app.weeon.school` (`weeon-tenants`) |
| Audience | Weeon employees | One school’s ERP admins |
| Source of truth | `lib/auth/policy.ts` directory + invited rows in `data/ops-staff.json` | `public.profiles` where `role = 'admin'` and `tenant_id` is set |
| Invite tables | **Never** `admin_invites` | `admin_invites`, `admin_password_resets` |
| Email | Branded Resend from this app | School-admin onboarding in `weeon-tenants` |

`profiles.role = 'admin'` means **school admin of one tenant**. It does **not**
grant Weeon Ops access. Eduardo and Silvia may both be school admins of
`WEEON DEMO SCHOOL` for product testing. Only people on **this** staff list
sign in here.

Current owner (only inviter): `eduardo@weeon.school`
(`PLATFORM_STAFF_INVITER_EMAIL`). Hard cap: `MAX_PLATFORM_STAFF` (3).

## Do not read tenant data for ops staff

Wrong (this was the old bug):

- Security administrators from `public.profiles`
- “Provisioned” = tenant `account_status`
- Password reset via `admin_password_resets` / `profiles.id`
- Supabase `inviteUserByEmail` (generic unbranded mail, and it treats an
  existing school Auth user as “already invited”)

Correct:

- Bootstrap list: `PLATFORM_STAFF_DIRECTORY` in `lib/auth/policy.ts`
- Invited staff: `data/ops-staff.json` (git-ignored; this repo, not the shared
  schema)
- Sign-in gate: `canAccessOpsConsole` — allow-list **or** an **accepted**
  invite. Pending invites cannot sign in until they set a password.
- Tenant detail (the **School page**) → Administrators lists **school** admins
  from `profiles`. That is a different list on purpose. The same page is where
  Ops adds/removes those admins and toggles modules — see
  `docs/data-model.md` § Tenant modules and the School page sections below.

## Invite flow (Security)

Only the owner can invite. Domain must be `@weeon.school`.

1. `inviteAdministratorAction` checks session + owner + domain.
2. `invitePlatformStaff` refuses directory members and accepted invites;
   pending invites are resent.
3. Auth user is resolved with `generateLink` / `createUser` (**no email
   sent by Supabase**). `app_metadata.platform_staff = true` is set when
   possible. Shared Auth means the same email may already exist as a school
   user — that is **not** enough; they still need an ops invite + accept.
4. A single-use token is stored in `data/ops-staff.json`.
5. **Resend** sends a Weeon-branded invite (`lib/email/invite-email.ts`) from
   `RESEND_FROM` with the Weeon Ops wordmark — a PNG raster of the real `Logo`
   component (`npm run render:email-logo`; requires Playwright Chromium once).
6. Link: `{origin}/accept-invite?token=…` (7 days). Origin from
   `WEEON_OPS_ORIGIN` / request Host (`lib/auth/ops-origin.ts`).
7. `/accept-invite` sets the password via the service-role Auth admin API,
   marks the member accepted, and signs them into `/dashboard`.

The **Security** page then shows the owner plus invited rows (`Invite pending`
until accept). School testers (e.g. Silvia on the demo tenant) do **not** appear
unless the owner invites them **here**.

## Removing a school administrator (offboarding)

When a school asks us to revoke one of their administrators (security), ops can
do it from **Tenant detail → Administrators**. Each admin row (only when the
school has more than one) has a trash action that opens a confirm dialog
(`<dialog>`) — removal is never a single click.

- Action: `lib/dashboard/tenant-admin-actions.ts`
  (`removeTenantAdministratorAction`), UI:
  `components/dashboard/remove-administrator.tsx`.
- Ops-staff session required; the write uses the service-role platform client.
- Deletes the tenant `profiles` row (`role='admin'`, matching `tenant_id`) — this
  is a hard revoke, because the tenant app resolves tenant/role from `profiles`.
- **Refuses to remove the last remaining administrator** (avoids locking a
  school out).
- `auth.users` is **not** touched — the same login may administer another tenant.
- Every removal is written to `public.tenant_admin_log`
  (`provision_kind='removed'`); see `../weeon-tenants/docs/account-security-ops.md`.

## The School page (`/dashboard/tenants/[id]`)

Ops manages one school from this page. Layout, top to bottom:

- **Hero band** — gradient rule, avatar, name, status badge, subdomain + plan
  pills, inline Student/Teacher/Admin counts, and a backup-health pill. No
  separate stat-card row (counts live here instead of in their own boxes).
- **Segmented workspace** (`SegmentedWorkspace`) — one surface with four panes,
  each rendering a single card:
  - **Modules** — `ModuleListCard`: add-ons list (paid, switchable) with a
    locked "Included in every plan" core band in its footer.
  - **People** — `AdministratorsCard` (add via provisioning API; remove with a
    last-admin guard). The suspend/reactivate control (`SchoolStatusControl`) is
    a footer band of the same card, not a separate box.
  - **Overview** — one `SectionCard` with three `DetailGroup` blocks
    (Subscription & lifecycle, Academic setup, Identity).
  - **Activity** — `OpsAuditCard`, the `tenant_ops_audit` trail.

Shared building blocks: `components/dashboard/section-card.tsx`
(`SectionCard`/`DetailList`/`DetailRow`), `segmented-tabs.tsx`, and the
`icon-tone.ts` token maps.

`SchoolStatusControl` suspends (`suspended`) or reactivates (`active`) the
school (`setTenantStatusAction`). Only the manual status subset is accepted.

Adding an admin goes through `lib/dashboard/provisioning-actions.ts`
(`addAdministratorAction` → `addSchoolAdministrator` → ERP
`/api/ops/schools/administrators`). Removing uses `tenant-admin-actions.ts`
above.

## Password reset

Same isolation: only ops staff (directory or accepted invite). Branded Resend
mail, token in `data/ops-staff.json` (`kind: reset`), complete on
`/reset-password`. Do not write `admin_password_resets`.

## Session guard

- `proxy.ts` — cookie session required for `/dashboard/*` (any Auth user).
- `getPlatformSession` / dashboard layout — **ops staff only**; unauthorized
  sessions are signed out.
- Login: `/` (`LoginShell`). `/login` redirects to `/`.

## Env

| Variable | Role |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Cookie session (anon client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Create/update Auth users, platform reads |
| `RESEND_API_KEY`, `RESEND_FROM` | Branded invite + reset (required for invite) |
| `WEEON_OPS_ORIGIN` | Canonical link origin (`https://ops.weeon.school`) |
| `AUTH_ALLOWED_STAFF_EMAILS` | Optional extra allow-list (dev). Do not paste tenant admins. |

## Code map

| Path | Role |
| --- | --- |
| `lib/auth/policy.ts` | Domain, owner, directory, cap |
| `lib/auth/platform-staff.ts` | List, invite, `canAccessOpsConsole` |
| `lib/auth/ops-staff-store.ts` | Invite/reset tokens + invited members |
| `lib/auth/auth-user.ts` | Auth user resolve without generic mail |
| `lib/email/*` | Branded Resend templates |
| `lib/dashboard/tenant-admin-actions.ts` | Remove a school administrator (offboarding) |
| `lib/dashboard/tenant-module-actions.ts` | Toggle a paid module for a school |
| `lib/dashboard/tenant-status-actions.ts` | Suspend / reactivate a school |
| `lib/platform/tenant-modules.ts` | Module catalog + tenant module state (service-role) |
| `lib/platform/tenant-status.ts` | Manual tenant status subset (suspend/reactivate) |
| `components/dashboard/remove-administrator.tsx` | Offboarding confirm dialog |
| `app/dashboard/security/page.tsx` | Administrators UI (ops staff) |
| `app/accept-invite/page.tsx` | Accept branded invite |
