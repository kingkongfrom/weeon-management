# Handover — Weeon Management (Ops console)

*State of the repo as of 2026-09-27, after the access-control, suspension,
hardening, and 2FA work. Written so another engineer (or agent) can pick this up
without re-deriving decisions.*

---

## 1. What this repo is

**Internal platform operations console** for Weeon (`ops.weeon.school`). It is a
**cross-tenant** dashboard: every school ("tenant"), their users, subscription
state, backups, and access control.

It is **not** the school ERP. That is `weeon-tenants` (`app.weeon.school`).
See `docs/repositories.md` for the five-repo map.

**Two identities that must never be confused:**

| | Who | Where the record lives |
| --- | --- | --- |
| **Ops staff** (Weeon employees) | You and future Weeon people | `lib/auth/policy.ts` + `data/ops-staff.json` — **not** `public.profiles` |
| **School admin** (a school's own admin) | The customer | `public.profiles`, `role = 'admin'`, in the shared Supabase DB |

The *Access control* page manages **school admins**. The *Security* page manages
**ops staff**. Do not mix them.

---

## 2. Deployment prerequisites — DO THESE FIRST

Nothing below works until these are done. Both are outside this repo.

### 2.1 Apply pending migrations (schema owner: `weeon-tenants`)

Two migrations are **committed but not applied** to the hosted DB:

```
weeon-tenants/supabase/migrations/
  20260927100000_tenant_suspension.sql        -- school suspension (reason-aware)
  20260927140000_admin_access_lifecycle.sql   -- admin suspend / delete + 72h retention
```

Apply with:

```powershell
# from weeon-tenants, with .env.local linked
npx supabase db push --linked --include-all
```

`--include-all` is **required**: both migrations predate already-applied ones
(there was drift). Without it `db push` refuses.

**Until these land, these features error at runtime:**
- School **Suspend / Reactivate** (Danger zone) — needs `suspend_reason` etc.
- Admin **Suspend / Reactivate / Delete** — needs `deleted_at` etc.

### 2.2 Enable TOTP in Supabase

Supabase dashboard → **Auth → Multi-Factor Auth → enable TOTP**.
Without it, `supabase.auth.mfa.enroll()` fails and the drawer's *Turn on
two-factor* button errors.

### 2.3 Environment

Required in `.env.local` (and the Vercel project):

| Var | Purpose |
| --- | --- |
| `SUPABASE_URL` | project URL |
| `SUPABASE_ANON_KEY` | browser/session client |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** platform client |
| `RESEND_API_KEY` | invite + suspension email |
| `WEEON_OPS_ORIGIN` | links in email |

---

## 3. Feature inventory

### 3.1 Access control (`/dashboard/access`)

Sidebar → **Access control**. Cross-tenant **administrator** directory
(teachers/students/guardians are out of scope by decision).

- **Table**: Full name (+ email), Role, School, Status.
- **Search**: name, email, username, school, id.
- **Filters**: All / Active / Pending first login / Suspended / Inactive.
- **Row click → popover**: Login email (under name), Role, Account status,
  Last sign-in, Password set.
- **Actions**: Suspend / Reactivate, Reset 2FA, Delete (type `DELETE` to
  confirm).

Read path: `lib/platform/access-control.ts` (service-role). Docs:
`docs/access-control.md`.

**Non-obvious things worth knowing:**

- **Last sign-in comes from Supabase Auth**, not `profiles`. `profiles
  .first_login_at` is populated for *roster* users but never for admins.
  Resolution uses `auth.admin.getUserById` **per admin** — `listUsers()` returns
  **HTTP 500 "Database error finding users"** on this project. Do not switch
  back to `listUsers`.
- **Password set** is a proxy: last consumed `admin_password_resets` row, else
  `profiles.created_at`. Supabase Auth exposes **no** password timestamp.
- **Role** values are unconstrained `text`; live values are `admin`, `teacher`,
  `student`, `parent`. Labels are humanised in `lib/domain.ts`
  (`resolveRoleLabel`).

### 3.2 Admin suspend / delete

- **Suspend (deactivate)** = `profiles.account_status = 'suspended'`. One state,
  not two. Blocks sign-in **and** live sessions.
- **Delete** = soft delete (`deleted_at`) + **Auth user anonymized** (email
  replaced, password randomized, banned). Row kept **72h**, then purged by the
  hourly `purge_deleted_records()` cron.
- Enforcement lives in **`weeon-tenants`** in two places — sign-in
  (`lib/auth/actions.ts`) and every request
  (`lib/dashboard/require-school-admin.ts`). A JWT alone would otherwise let a
  suspended admin keep working until it expired.

### 3.3 School suspension (Danger zone)

School page → **Overview → Danger zone** → *Suspend school* (confirm step) /
*Reactivate school* (one click).

- **Manual hold** only from Ops (read-only immediately).
- **Delinquency hold** is set by the **billing system**, not Ops (read-only
  after a grace window).
- Suspended schools keep **read** access; only writes are refused.
- Messages are reason-aware for admins; teachers/students/guardians never learn
  why (they get a neutral message).

Docs: `docs/lifecycle.md`, and `weeon-tenants/docs/lifecycle.md` for the
canonical contract.

### 3.4 Security hardening

- **CSP + security headers** in `next.config.ts` (static CSP, mirrored from
  `weeon-tenants`). Allowlisted external origins: **Supabase** and
  **`demotiles.maplibre.org`** (MapLibre glyphs for the analytics map). Adding a
  third-party origin means editing the CSP — do not loosen it.
- **Throttling** (`lib/auth/rate-limit.ts`): sign-in 10/10min per email and
  30/10min per IP; password reset 5/15min per IP. **Not** an account lockout —
  nothing is disabled and a success clears the email bucket.
  *Limitation:* the store is **in-process**, so on multi-instance/serverless
  deploys the effective limit is `limit × instances`. `consumeRateLimit()` is the
  single seam to move to Redis/Upstash.
- **TOTP 2FA** — see §3.5.

### 3.5 TOTP two-factor auth

- **Enroll**: **Security** page → *Two-factor authentication* → *Turn on* → QR +
  secret → confirm 6-digit code.
- **Sign in**: password → 6-digit challenge → dashboard.
- **Gate**: `getPlatformSession()` rejects a non-`aal2` session when the user has
  a verified factor.
- **Disable**: requires a fresh `aal2` session.
- **Recovery**: another ops admin uses **Access control → Reset 2FA**.
- **Opt-in per account** — not enforced by the app.

Files: `lib/auth/mfa.ts`, `lib/auth/mfa-actions.ts`,
`components/dashboard/mfa-settings.tsx` (mounted on `/dashboard/security`),
`components/auth/login-form.tsx`. Docs: `docs/security.md`.

---

## 4. Conventions that matter

- **Next.js 16** — `middleware` is now `proxy.ts`. Read
  `node_modules/next/dist/docs/` before Next-specific work.
- **PowerShell on Windows** — chain with `cmd1; if ($?) { cmd2 }`, no `&&`.
- **Never import the platform (service-role) client into a client component.**
- **Schema changes belong in `weeon-tenants`**, additive, mobile-safe.
- **Migration filenames must be unique.** A duplicate version prefix breaks
  `db push` (this happened — see `platform-hygiene.md` in `weeon-tenants`).
- **i18n**: the drawer/shell/nav use `lib/i18n/` (ES/EN). Page bodies are still
  hardcoded English — a known gap.

## 5. Verify commands

```powershell
npm run typecheck
npm run lint
npm run build
```

---

## 6. Known gaps / next steps

| Item | Notes |
| --- | --- |
| **Migrations not applied** | Blocks school suspend + admin suspend/delete. Highest priority. |
| **TOTP not enabled in Supabase** | Blocks 2FA enrollment. |
| **In-process rate limiting** | Move to Redis/Upstash for multi-instance correctness. `consumeRateLimit()` is the seam. |
| **Billing must write delinquency stamps** | Ops only does manual holds; `suspend_reason='delinquency'` + `suspended_grace_ends_at` must be written by billing. |
| **Ops inbound mailbox** | Not built. Needs a provider decision (Resend inbound / Postmark / Mailgun) + MX access. UI could be adapted from `weeon-teachers` messaging, but the data layer is tenant-RLS and must be replaced with ops-owned tables. |
| **Page-body i18n** | Console chrome is translated; page content is not. |
| **`profiles.last_sign_in_at`** | Mirroring Auth's value would remove the per-user Admin API lookups. |
| **`password_updated_at`** | Would make "Password set" exact instead of a proxy. |
