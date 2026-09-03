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

## Scaffold status

> This is a working **project skeleton**: it builds, lints, and type-checks,
> and it encodes the intended domain and architecture in code + docs. Live
> data comes up once Supabase credentials are set and the platform aggregation
> (a shared SQL view/RPC) is added — see `docs/data-model.md`.

Implemented now:

- Next.js **16.3.3** · React **19** · TypeScript (strict) · Tailwind **v4**
  — identical stack and conventions to the sibling Next.js repos.
- Public hub (`/`) describing the four-repo architecture.
- `app/login`, dashboard shell with `Overview` + `Tenants` navigation, and a
  per-tenant page (`/dashboard/tenants/[id]`).
- Server-only platform Supabase client + typed domain model mirroring the
  live `tenants` / `profiles` schema owned by `weeon-admin`.
- `GET /api/health`.

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
| `/` | Public hub / architecture map |
| `/login` | Platform staff sign-in (auth wiring is a build task) |
| `/dashboard` | Overview — tenants, users, trials, at-risk tenants |
| `/dashboard/tenants` | All tenants + users-per-tenant table |
| `/dashboard/tenants/[id]` | Single tenant detail page |
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
  layout.tsx              # Root layout
  icon.svg                # Favicon
  page.tsx                # Public hub (architecture map)
  login/                  # Platform staff sign-in (skeleton)
  dashboard/
    layout.tsx            # Ops shell (sidebar nav)
    page.tsx              # Overview stats
    tenants/
      page.tsx            # Tenant list + users-per-tenant
      [id]/page.tsx       # Tenant detail
  api/health/route.ts     # Health probe
  not-found.tsx
components/
  ui/                     # Small reusable primitives (Card, StatCard, StatusBadge)
  DashboardNav.tsx
lib/
  cn.ts
  site-copy.ts            # Brand / product copy
  domain.ts               # Typed models mirroring the live Supabase schema
  supabase/
    client.ts             # Browser anon client (public data only)
    platform.ts           # SERVER-ONLY service-role client (cross-tenant)
  platform/metrics.ts     # Platform aggregation (skeleton)
docs/                     # Architecture + operating documentation
AGENTS.md, CLAUDE.md      # AI-agent onboarding docs (see above)
SECURITY.md               # Platform security notes
```

---

## Documentation

Read these **before** editing. The AI docs (`AGENTS.md`, `CLAUDE.md`) index the
whole set so agents working in the repo start from the right place.

| Document | Contents |
| -------- | -------- |
| [`docs/repositories.md`](docs/repositories.md) | The four GitHub repos, who builds/reads what, and repo boundary rules |
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
