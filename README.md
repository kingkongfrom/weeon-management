# Weeon Management

**Weeon / EduNova — internal platform operations dashboard.**

This repository is the **management console** for the whole Weeon ecosystem. It
gives the **organization (Kingkongfrom / EduNova)** a single place to operate
every institution ("tenant"), see **how many users each tenant has**, per-tenant
stats, and the health/subscription signals the team needs to run efficiently.

> Internal tool for Weeon staff only. School administrators log into a
> different app (`weeon-admin`). Do **not** put school-ERP admin UI here.

---

## The product lives in four repositories

| Repo | URL | Role / surface | Stack |
| ---- | --- | -------------- | ----- |
| [`weeon-management`](https://github.com/kingkongfrom/weeon-management) | **This repo** | Internal ops console — tenants, users per tenant, tenant stats, subscription health (`ops.weeon.school`) | Next.js |
| [`weeon-marketing`](https://github.com/kingkongfrom/weeon-marketing) | Public marketing site & trial funnel (`weeon.school`) | Next.js |
| [`weeon-admin`](https://github.com/kingkongfrom/weeon-admin) | School web admin / ERP for **one tenant** (`app.weeon.school`) | Next.js |
| [`weeon-school`](https://github.com/kingkongfrom/weeon-school) | Mobile apps for teachers, students, parents (Android + iOS) | Flutter |

Full repo boundaries and what each app owns: [`docs/repositories.md`](docs/repositories.md).

All apps read the **same single Supabase project** (PostgreSQL + Row Level
Security). `weeon-management` is the only surface that legitimately reads
**across all tenants**, and it does so through a **server-only platform
(client, not tenant-scoped RLS).

---

## Status

Working internal console: sign-in, dashboard, tenants, settings, branded
ops-staff invite/reset. Live tenant rows come from the shared Supabase
project (service-role). Platform aggregation (a shared SQL view/RPC) is
still a follow-up — see `docs/data-model.md`.

Implemented now:

- Next.js **16.3.3** · React **19** · TypeScript (strict) · Tailwind **v4**
- Weeon Ops sign-in at `/` (not school-admin login)
- Dashboard: Overview, Tenants, tenant detail (school admins), Settings
- **Ops staff** isolated from tenants — `docs/auth.md`
- Branded Resend invite + password reset (not Supabase generic mail)
- Server-only platform Supabase client + domain types for `tenants` /
  `profiles` (owned by `weeon-admin`)
- `GET /api/health`

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com) |
| Language | TypeScript (strict) |
| Backend / DB | [Supabase](https://supabase.com) (`@supabase/supabase-js`) |
| Validation | [Zod](https://zod.dev) |
| Platform data access | Server-only service-role client (`lib/supabase/platform.ts`) |

---

## Getting started

### Prerequisites

- **Node.js** 20+
- **npm** (or pnpm / yarn / bun)
- Access to the shared **Supabase** project (URL + anon key + the
  **service-role key** for platform reads)

### 1. Install

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `SUPABASE_URL` | Yes | Project URL (Supabase → Settings → API) |
| `SUPABASE_ANON_KEY` | Yes | Public anon key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | **Server-only** — bypasses RLS so we can read across all tenants. Never expose to the browser. |
| `SUPABASE_PROJECT_REF` | No | Short project reference id (tooling) |
| `RESEND_API_KEY` | Yes* | Branded invite + password-reset email |
| `RESEND_FROM` | No | Defaults toward `Weeon Ops <…>` |
| `WEEON_OPS_ORIGIN` | Prod | `https://ops.weeon.school` — invite/reset link origin |
| `CRON_SECRET` | No | Same value as `weeon-admin` autosnapshot CRON secret (health overview) |
| `ENVIRONMENT` | No | `development` \| `production` (keep consistent with siblings) |

`*` The skeleton runs without it (shows a "not configured" hint); production
builds throw if it is missing. Read [`docs/security.md`](docs/security.md)
before enabling it.

Never commit `.env.local`. Only `.env.example` is tracked.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Purpose |
| ----- | ------- |
| `/` | Weeon Ops sign-in |
| `/dashboard` | Overview — tenants, trials, at-risk |
| `/dashboard/tenants` | All tenants (status / seats) |
| `/dashboard/tenants/[id]` | Tenant detail + school administrators |
| `/dashboard/security` | Weeon Ops administrators + invite |
| `/dashboard/settings` | Appearance |
| `/accept-invite` | Accept branded ops invite |
| `/api/health` | Liveness probe |

---

## Scripts

```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

---

## Project structure

```
app/
  page.tsx                # Weeon Ops sign-in
  accept-invite/          # Branded ops invite accept
  dashboard/
    layout.tsx            # Auth-gated ops shell
    page.tsx              # Overview
    tenants/              # Tenant list + detail (school admins)
    security/             # Weeon Ops administrators + invite
    settings/             # Appearance
  auth/callback/          # Auth code exchange
lib/
  auth/                   # Ops staff policy, invite, reset (not tenant profiles)
  email/                  # Branded Resend templates
  supabase/platform.ts    # SERVER-ONLY service-role (cross-tenant reads)
  supabase/session.ts     # Cookie session
  domain.ts               # Types mirroring the admin-owned schema
  platform/metrics.ts     # Tenant list / school-admin contacts
docs/                     # Agent + operating documentation
data/ops-staff.json       # Invited ops staff + tokens (git-ignored)
AGENTS.md, CLAUDE.md
```

---

## Documentation

Read these **before** editing. The AI docs (`AGENTS.md`, `CLAUDE.md`) index the
whole set so agents working in the repo start from the right place.

| Document | Contents |
| -------- | -------- |
| [`docs/ecosystem.md`](docs/ecosystem.md) | How marketing, admin, mobile, and this ops console share one product and one database |
| [`docs/repositories.md`](docs/repositories.md) | The four GitHub repos, who builds/reads what, shared DB vs this repo |
| [`docs/auth.md`](docs/auth.md) | Weeon Ops staff vs school admins; branded invite/reset |
| [`docs/architecture.md`](docs/architecture.md) | Stack, routes, Supabase clients, platform vs tenant authorization |
| [`docs/data-model.md`](docs/data-model.md) | Live shared schema: `tenants`, `profiles`, roster tables, platform audit tables; how users-per-tenant & stats are computed |
| [`docs/metrics.md`](docs/metrics.md) | The tenant metrics the ops console must expose and how to source them |
| [`docs/lifecycle.md`](docs/lifecycle.md) | Tenant lifecycle & subscription signals (`trial → active → past_due/suspended`) |
| [`docs/audit-log.md`](docs/audit-log.md) | Platform-internal audit tables already in the DB and how to read them |
| [`docs/security.md`](docs/security.md) | Secret handling & platform-scope authorization rules |

---

## Development notes

- **We are a reader at platform scope.** Prefer **additive, backward-compatible**
  database changes in `weeon-admin`; do not create conflicting columns/tables here.
- **RLS is tenant-scoped.** Do *not* rely on the anon client for cross-tenant
  reads. Use `lib/supabase/platform.ts` on the server only.
- **Next.js 16 differs from training data.** Check `node_modules/next/dist/docs/`
  when unsure (e.g. `proxy` replaces `middleware`).
- **Contributing** — run `npm run build`, `npm run lint`, and `npm run typecheck` before a PR.

---

## License

Private project — all rights reserved unless otherwise specified.
