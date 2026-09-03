# Security — platform scope & secrets

*Read before wiring credentials or exposing any cross-tenant data.*

## Core fact: RLS is tenant-scoped; we are the platform exception

`weeon-admin` and `weeon-school` read one school through RLS. **`weeon-management`
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

## Reference

Sibling `weeon-admin` keeps a fuller `SECURITY.md`/`docs/security.md`. When that
repo defines platform-private tables or an operator role, align the staff auth
model here rather than inventing a parallel one.
