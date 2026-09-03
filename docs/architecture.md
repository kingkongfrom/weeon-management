# Architecture

*Stack, routes, Supabase clients, and — critically — **platform vs tenant**
authorization.* Read before writing code or wiring credentials.

## Stack

Aligned with the sibling Next.js repos (`weeon-admin`, `weeon-marketing`):

- Next.js **16.3.3** (App Router, Turbopack)
- React **19.2** · TypeScript **strict**
- Tailwind **v4** (`@import "tailwindcss"` + `@theme`)
- Supabase `@supabase/supabase-js`; Zod for validation
- Windows PowerShell for commands

Next.js 16 differs from training data — `middleware` is now `proxy`, etc. When
unsure, check `node_modules/next/dist/docs/`.

## Routes

| Route | Type | Purpose |
| ----- | ---- | ------- |
| `/` | RSC (static) | Public hub / architecture map |
| `/login` | Client | Platform staff sign-in (auth wiring is a build task) |
| `/dashboard` | RSC | Overview: totals, trials, at-risk tenants |
| `/dashboard/tenants` | RSC | All tenants + users-per-tenant table |
| `/dashboard/tenants/[id]` | RSC (dynamic) | Single tenant detail |
| `/api/health` | Route handler | Liveness probe |
| `/_not-found` | RSC | 404 |

## Supabase clients

Two clients exist — keep them separate.

| Client | File | Scope | Allowed where |
| ------ | ---- | ----- | ------------- |
| **Platform client** | `lib/supabase/platform.ts` | Service-role, **bypasses RLS**, reads **across all tenants** | Server-only (RSC / route handlers / server actions with their own platform authorization) |
| **Anon client** | `lib/supabase/client.ts` | Public anon (RLS-bound) | Browser; **not** for cross-tenant reads (RLS is tenant-scoped) |

### Platform-scope reads (why service-role, but carefully)

`weeon-admin` and `weeon-school` read one school each through tenant-scoped RLS.
`weeon-management` must see **all** schools, so it cannot use tenant RLS. It uses
the **server-only service-role client** (`lib/supabase/platform.ts`).

Guardrails (see `security.md`):

1. The service-role key never leaves the server and never appears in
   `NEXT_PUBLIC_*` or the browser bundle.
2. `lib/supabase/platform.ts` imports `server-only` so it cannot be pulled into
   client components.
3. Only *trusted* platform staff reach the operations dashboard. Platform
   authentication is a dedicated model (staff role / platform claim) — never
   the single-school `profiles.role = 'admin'` used by `weeon-admin`.
4. Do **not** mix the anon/tenant client into management reads.

### Authentication model (build task)

The skeleton has a `/login` screen but no live auth yet. The intended model:

- A dedicated **staff / platform** authorization, separate from school admin
  roles, enforced at the server for every dashboard read.
- Because this console is internal and exposes cross-tenant/seat/audit data,
  treat access like an ops credential, not a public endpoint.

## Data access direction

Aggregation should happen **in the database** (a platform view or `RPC` owned
additively in `weeon-admin`) rather than N+1 client loops. Until that view
exists, `lib/platform/metrics.ts` provides a small skeleton that lists tenants
and counts `profiles` per tenant. See `data-model.md` and `metrics.md`.

## Conventions

- Server Components load data; client components render and interact.
- Plain CSS + Tailwind utilities; no component library dependency in the
  skeleton (small `components/ui/*` primitives kept local).
- Never display service-role-gated raw rows or keys to the browser.
- Domain types live in `lib/domain.ts`, mirroring the live schema.
