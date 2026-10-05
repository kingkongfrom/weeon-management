# Security — platform scope & secrets

*Read before wiring credentials or exposing any cross-tenant data.*

## Core fact: RLS is tenant-scoped; we are the platform exception

`weeon-tenants` and `weeon-mobile` read one school through RLS. **`weeon-management`
reads across all tenants**, so it cannot use tenant-scoped RLS and instead uses
the **service-role key server-only**. That is powerful and dangerous — treat this
repo as an **ops credential surface**.

## Rules

1. **Service-role key is server-only.**
   - Lives in `SUPABASE_SERVICE_ROLE_KEY` (`.env.local`, git-ignored).
   - Used only from `lib/supabase/platform.ts`, which `import "server-only"`.
   - Never in `NEXT_PUBLIC_*`, never returned to the client, never logged.
2. **No tenant-scoped RLS mix.**
   - Don't try to read cross-tenant data with the anon client — RLS will (and
     should) hide the other schools, but bypassing it with anon+service mix is a
     bug vector. Use the platform client for management reads only.
3. **Authorization before exposure.**
   - Dashboard reads are guarded by **Weeon Ops staff** (`docs/auth.md`).
     Never rely on a single-school `profiles.role` from a browser session to
     authorize a cross-tenant read.
   - Security → Administrators is the ops directory, not tenant `profiles`.
   - Any route that returns platform/audit data must enforce staff auth.
4. **Minimal data.**
   - Aggregate in SQL; don't dump `tenants.settings` or backup `payload` blobs
     unless a specific detail view needs them.
5. **Secrets hygiene.**
   - `.gitignore` keeps `.env*` out except `.env.example`. Only `.env.example`
     is committed, and it ships empty.
   - `CRON_SECRET`, `TRIAL_HMAC_SECRET`, `RESEND_API_KEY`, etc. (used by
     siblings) also stay server-only here.
6. **Robots / discovery.** The site is internal: `robots: noindex` is set on the
   root layout metadata.

## What must never appear in the browser

- The service-role key.
- Full per-tenant roster PII dumps (unless a specific, authorized staff view).
- Audit payload blobs.

## Hardening (implemented)

### Security headers (`next.config.ts`)

Mirrors `weeon-tenants` so the products stay aligned. A **static CSP** (no
nonces) keeps pages statically rendered and CDN-cacheable while still blocking
the major vectors: `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
`frame-ancestors 'none'` (clickjacking), `upgrade-insecure-requests`.

- `'unsafe-inline'` on `script-src` is required by the App Router (it injects
  inline bootstrap/flight scripts); `'unsafe-eval'` is **development only**.
- Two external origins are required and allowlisted deliberately:
  **Supabase** (auth/session, project images) and
  **`demotiles.maplibre.org`** (MapLibre glyphs for country labels on the
  analytics map — see `lib/analytics/map-basemap-style.ts`). Adding a new
  third-party script/origin means editing the CSP here, not loosening it.
- Also sets `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and
  `X-Robots-Tag: noindex, nofollow, noarchive` (belt-and-braces with the layout
  metadata `robots`). `poweredByHeader` is disabled.

### Login / reset throttling (`lib/auth/rate-limit.ts`)

Sliding-window throttle on the two unauthenticated, abusable actions:

| Action | Limit |
| ------ | ----- |
| Sign-in, per email | 10 attempts / 10 min |
| Sign-in, per client IP | 30 attempts / 10 min |
| Password reset, per IP | 5 requests / 15 min |

This is **not account lockout, by design.** Nothing is ever disabled, counters
expire on their own, and a successful sign-in clears the email bucket — so a
real admin cannot be locked out and no "unlock" support flow is needed. It is a
speed bump against brute force, not a lock.

> **Limitation:** the store is in-process. On multi-instance/serverless deploys
> each instance keeps its own counters, so the effective limit is
> `limit × instances`. `consumeRateLimit()` is the single seam — move the store
> to Redis/Upstash or a shared table for a hard cross-instance guarantee.
> Supabase Auth applies its own project-level limits on `signInWithPassword`,
> so this is defence in depth.

### Two-factor authentication (TOTP) — implemented

Ops supports **TOTP** (authenticator app: Google Authenticator, Authy, 1Password).
Chosen over email/SMS OTP because it is native to Supabase (no vendor, no
per-message cost), the secret lives on the device so a compromised inbox does
not defeat it, and it works offline.

**Supabase requirement — do this first:** the Supabase project must have
**Auth → Multi-Factor Auth → TOTP enabled**. Until then `mfa.enroll()` fails.
*(Dashboard action; it cannot be set from this repo.)*

How it works — Supabase models this as **AAL**:

| Level | Meaning |
| ----- | ------- |
| `aal1` | Password only |
| `aal2` | Password **+** verified TOTP code |

Flow:

1. **Enroll** (self-service) — **Security** page → *Two-factor authentication* →
   *Turn on*. Shows a QR code + manual secret; the factor is **unverified**
   until a 6-digit code is confirmed, so an abandoned attempt cannot lock
   anyone out.
2. **Sign in** — password → if a verified factor exists, the login action
   reports `mfaRequired` and the form switches to the 6-digit challenge. Only a
   successful `verify` upgrades the session to `aal2`.
3. **Gate** — `getPlatformSession()` treats a non-`aal2` session as
   unauthenticated when the user has a verified factor, so navigating straight
   to a `/dashboard` URL from a half-finished login does not work.
4. **Disable** — requires a **fresh `aal2` session**; a password-only session
   cannot remove the second factor (that would defeat it).
5. **Recovery** — if a phone is lost, another ops admin uses **Access control →
   Reset 2FA**, which deletes the factors through the Auth Admin API
   (`auth.admin.mfa.deleteFactor`) and drops the target's sessions. This is the
   deliberate substitute for recovery codes, so a lost phone is never a
   permanent lockout.

Code files: `lib/auth/mfa.ts` (API helpers), `lib/auth/mfa-actions.ts` (server
actions), `components/dashboard/mfa-settings.tsx` (enroll/manage panel, mounted
on `/dashboard/security`), `components/auth/login-form.tsx` (challenge step).

**Rollout advice:** enroll your own account first and confirm the full
challenge works before making it mandatory for other staff. TOTP is **not
enforced** by the app — it is opt-in per account.

### Not implemented, on purpose

- **Account lockout** — rejected. It adds a denial-of-service vector (an attacker
  can lock a real admin out) while stopping little at this scale. Manual
  **suspend** / **delete** cover the real cases and are audited.

## Reference

Sibling `weeon-tenants` keeps a fuller `SECURITY.md`/`docs/security.md`. When that
repo defines platform-private tables or an operator role, align the staff auth
model here rather than inventing a parallel one.
