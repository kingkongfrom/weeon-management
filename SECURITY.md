# Security

Weeon Management is the **internal platform operations console** for the Weeon /
EduNova organization. It reads the shared Supabase project **across every
tenant**, so treat it as an ops-credential surface, not a public app.

Read the full rules in `docs/security.md`. Highlights:

- **Service-role key is server-only.** Cross-tenant reads happen in
  `lib/supabase/platform.ts` (`import "server-only"`). The key never ships to
  the browser, never goes in `NEXT_PUBLIC_*`, never gets logged.
- **RLS is tenant-scoped; this console is the exception.** We bypass school RLS
  with the service-role client on purpose — so we must authorize staff on the
  server before any management read.
- **Never commit secrets.** `.env*` is git-ignored; only `.env.example` is
  committed, and it ships empty.
- **Keep exposure minimal.** Aggregate in SQL; don't dump `settings`/backup
  payloads to the UI unless a specific detail view needs them.
- Internal by design: the site is `noindex`.

Anything requiring dedicated staff/operator auth (the console's default state)
must not be reachable by school-admin roles. Report concerns privately to the
org; do not open issues with operational data.
