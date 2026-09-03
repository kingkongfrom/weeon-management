# CLAUDE.md

Claude/Codex-friendly onboarding for **Weeon Management** — the internal
**platform operations console** for the Weeon / EduNova organization.

This is **one of four repos** in the product. We are the **cross-tenant**
dashboard: manage every tenant, see **how many users each tenant has**, and the
stats/subscription health the org needs to run.

Read these before work (shortest to fastest signal):

1. `docs/repositories.md` — the four repos and who owns what (don't duplicate the
   marketing site, school ERP, or mobile screens here).
2. `docs/architecture.md` — routes, Supabase clients, and **platform vs tenant
   authorization** (read this before wiring any credential).
3. `docs/data-model.md` — the **live shared schema** and how users-per-tenant /
   tenant stats are computed.
4. `docs/security.md` — RLS is tenant-scoped; cross-tenant reads go **server-only
   with the service-role client**, never the anon client in the browser.
5. `AGENTS.md` — full rule set (keep it in sync with the docs it indexes).

Non-negotiable:

- School-ERP admin UI goes in **`weeon-admin`**; marketing in **`weeon-marketing`**;
  mobile in **`weeon-school`**. Don't recreate them here.
- The shared Supabase schema is owned by **`weeon-admin`**. Confirm against its
  live `database.types.ts`/`migrations/`; keep changes **additive** and safe for
  the Flutter app. Don't invent columns/tables in this repo.
- Cross-tenant reads: `lib/supabase/platform.ts` (server-only, service-role).
  Never expose the service-role key or gated data to the browser.
- Never commit `.env*` (only `.env.example`). Keep Next 16 / React 19 / TS strict
  / Tailwind v4 aligned with the sibling repos; this Next.js uses `proxy`, not `middleware`.

Verify with `npm run build`, `npm run lint`, `npm run typecheck`.
