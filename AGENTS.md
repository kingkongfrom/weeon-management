# Weeon Management — Agent Guide

*Onboarding index for AI agents (Kimi, DeepSeek, Composer, Codex, Claude, Grok)
working in this repo. Read the linked docs before feature or data work.*

## Repo in one line

**Weeon Management** is the **internal platform operations console** for the
Weeon / EduNova organization (Kingkongfrom). It is a **cross-tenant** dashboard:
manage every institution ("tenant"), see **how many users each tenant has**,
per-tenant stats, and the subscription/health signals the organization needs to
run efficiently.

It is **one of four repositories** that make up the product — see
`docs/repositories.md`. We read the same shared Supabase backend, but at the
**platform scope** (never tenant-scoped RLS).

## Must-read docs (in order)

| Doc | Read when |
| --- | --------- |
| `docs/ecosystem.md` | **How this repo relates to marketing, admin, mobile, and the shared DB** — sibling docs still call us a planned `weeon-platform-admin` |
| `docs/repositories.md` | **The four repos and who owns what** — before touching architecture, never duplicate the marketing/school ERP/mobile here |
| `docs/auth.md` | **Ops staff vs school admin** — Security administrators, branded invite, password reset. Never use `profiles` for Weeon Ops access |
| `docs/architecture.md` | Stack, routes, Supabase clients, **platform vs tenant authorization** |
| `docs/data-model.md` | **Live shared schema** — `tenants`, `profiles`, roster tables; compute users-per-tenant & stats correctly |
| `docs/metrics.md` | The specific metrics the console exposes and how to source them |
| `docs/lifecycle.md` | Tenant lifecycle & subscription signals (trial/active/past_due/suspended, seats) |
| `docs/audit-log.md` | Platform-internal audit tables (`tenant_backups`, `tenant_restore_log`, `tenant_admin_log`, …) |
| `docs/security.md` | Secret handling & platform-scope authorization (read before wiring credentials) |
| `README.md` | Status, run/verify commands, project structure |

Cross-reference when a task mentions schema or RLS: always confirm against the
**live admin-owned schema** in `weeon-admin`
(`lib/supabase/database.types.ts`, `supabase/migrations/`) — never invent
columns or tables.

## Non-negotiable rules

1. **You are in `weeon-management` — the internal ops console.** Do **not**
   build school-ERP admin UI here (that belongs in `weeon-admin`), public
   marketing pages (that belongs in `weeon-marketing`), or mobile screens
   (that belongs in `weeon-school`). See `docs/repositories.md`.
   **Weeon Ops staff ≠ tenant school admins.** Security → Administrators is
   the ops directory (`docs/auth.md`), never `public.profiles`.
2. **Cross-tenant reads use the server-only platform client**
   (`lib/supabase/platform.ts`, service-role) — **never** the tenant-scoped RLS
   path or the anon client, and **never** expose the service-role key or gated
   data to the browser.
3. **The shared schema is owned by `weeon-admin`.** Any schema/RLS change must
   be **additive** and made there, and must not break `weeon-school` mobile.
   Do not create conflicting columns/tables in this repo.
4. **RLS is tenant-scoped.** A single school is one tenant; schools never mix.
   Uniqueness is `(tenant_id, …)`. `tenants.saber_code` is the one
   cross-tenant-unique exception (one live claim per school).
5. **Never commit secrets.** `.env*` is git-ignored; only `.env.example` is
   committed. `.gitignore` keeps `.env*` out except `.env.example`.
6. **This Next.js differs from training data.** Read
   `node_modules/next/dist/docs/` before Next-specific code (`proxy` now
   replaces `middleware`, etc.). Keep the stack/versions aligned with the
   sibling repos (Next 16, React 19, TS strict, Tailwind v4).

## Stack facts

- Next.js **16.3.3** (App Router, Turbopack), React **19**, TS **strict**,
  Tailwind **v4**, Supabase `@supabase/supabase-js`, `zod`.
- Platform client: `lib/supabase/platform.ts`. Session client:
  `lib/supabase/session.ts`. Domain models: `lib/domain.ts`.
- Ops staff: `lib/auth/policy.ts` + `docs/auth.md`. Invites: branded Resend,
  not Supabase generic mail.
- Build/checks: `npm run build`, `npm run lint`, `npm run typecheck`.
- Commands use **PowerShell on Windows** here.

<!-- BEGIN:nextjs-agent-rules -->
<!-- This repo runs Next.js 16; the appended `nextjs-agent-rules` block (and
     the note in weeon-admin AGENTS.md) is auto-managed by `next dev`. Verify
     anything version-specific against node_modules/next/dist/docs/.
-->
<!-- END:nextjs-agent-rules -->
