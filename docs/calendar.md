# Ops dashboard — day band and the Cal.com demo pipeline

*Live since 28 Oct 2026. Page: `/dashboard`. Related: `docs/ui.md`,
`../weeon-marketing/docs/sprint-22-contact-scheduling.md`,
`../weeon-tenants/supabase/migrations/20261028150000_demo_meetings.sql`.*

## Why Cal.com for the slot and our own table for the pipeline

Cal.com owns **availability and booking** (timezones, buffers, concurrency,
confirmation/reminder email, ICS, video link, reschedule). That is a
correctness engine we deliberately do not rebuild
(see the product decision in `docs/handover.md`).

Ops owns the **pipeline**: which school asked, whether the demo happened, and
what tenant it became. So Cal.com is mirrored into
`public.demo_meetings`, and every Ops screen reads that table — never Cal.com
on the request path.

```
marketing /contacto ──▶ Cal.com (weeon-school/meeting)
                              │
        ┌─────────────────────┼─────────────────────┐
        │ webhook (instant)   │ reconcile (15 min)  │
        ▼                     ▼                     │
          public.demo_meetings  ◀───────────────────┘
                    │
                    ▼
         ops.weeon.school/dashboard
```

## Landing page blocks

| Block | Where | Source |
| --- | --- | --- |
| Weekday, day number, month, live clock | upper-left | local clock, Costa Rica civil time |
| Current weather (icon, temp, high/low) | beside the day number | MET Norway (same module as the ERP) |
| **Reuniones de la semana** strip (Mon–Fri) | under the band | `demo_meetings` |
| Meetings calendar (month · week · agenda) | `/dashboard/meetings` | `demo_meetings` + Ops-owned follow-up |

Amber dot on a card = the booking is `pending` / `awaiting_host` in Cal.com,
i.e. requested but not confirmed.

## Meetings page (`/dashboard/meetings`)

One dataset, three views, no new queries or tables — the server loads a
bounded window (12 months back, 4 ahead, cap 1000) and everything else is
client-side on that array, so switching views, searching and opening a day are
instant.

| View | What it is for | Detail |
| --- | --- | --- |
| **Mes** | the default; see density at a glance | six Monday-first weeks (42 cells, never shifts columns), up to two chips per day + "+N más", today in the brand circle |
| **Semana** | the week you are actually doing demos | seven columns, full titles, amber dot for pending, "Ya" badge inside the hour |
| **Lista** | phone / quick scan | agenda grouped by day, próximas then recientes |

Right-hand **day panel** (is a selected day or meeting): day heading, every
demo with time, school, attendee, e-mail/phone, status and outcome pills, notes,
relative time (`en 25 min`, `mañana`), and the inline **JoinMeeting** control.
It syncs from the month grid, the week columns and the agenda; `Esc` closes it.

Filters live in the toolbar and apply to every view: free-text search
(attendee, e-mail, phone, school, title, notes) and **Por confirmar**.

Shareable state (no navigation, `history.replaceState`):

| Query | Meaning |
| --- | --- |
| `?view=week` / `?view=agenda` | omitted for month (the default) |
| `?m=<meeting id>` | opens that meeting in the day panel; the landing StatCard links here |

Keyboard: `←` `→` move the period, `T` today, `1` / `2` / `3` switch views
(ignored while typing in the search box).

Colour: pending/awaiting bookings carry the amber dot everywhere; cancelled
meetings render struck through and muted; outcome pills use the same tones as
the ERP. Dates and slots are Costa Rica civil time; CSS-only layouts (no date
lib) and a single `now` per render so hydration matches.

### Phones (iOS Safari, Petal, Android WebKit)

The page is built mobile-first, then widens — not a desktop table that shrinks.

| Piece | Phone behaviour |
| --- | --- |
| Header | title + inline counts only; the intro sentence is hidden |
| Toolbar | two rows: period arrows, **Hoy** and the title, then a full-width 3-up Mes/Semana/Lista switch, then search + **Por confirmar** |
| Month | fluid seven columns (no horizontal scroll): one-letter weekdays, 3.25rem cells with up to three colour **dots** (+N), tap opens the day sheet |
| Week | native `scroll-snap` day columns (86% width), today first reachable — same swipe as the mobile ERP; seven-column grid from `md` |
| Agenda | full-width rows, bigger touch targets, date column centred |
| Day panel | **bottom sheet** above the mobile nav, dimmed backdrop, drag-free close (backdrop, X, Esc); desktop keeps the sticky side panel |
| Panel content | larger type, `mailto:` / `tel:` links for the attendee, safe-area padding |

Safari-specific guards:

- Search input is `text-base` (16px) on phones so iOS does not zoom on focus;
  `type="search"` + `enterKeyHint="search"` give the native keyboard.
- Sheet height uses `dvh` (not `vh`) and sits above the fixed bottom nav via
  `calc(4rem + env(safe-area-inset-bottom))`; body scroll is locked while open.
- Horizontal areas use `.no-scrollbar` (`app/globals.css`) with
  `-webkit-overflow-scrolling: touch` and `overscroll-contain` so a swipe does
  not bounce the whole page.
- Touch targets are ≥40–44px on phones for arrows, tabs, filter and close.



## Data flow

### 1. Webhook — `POST /api/calcom/webhook`

Cal.com → Settings → Developer → Webhooks:

| Field | Value |
| --- | --- |
| Subscriber URL | `https://ops.weeon.school/api/calcom/webhook` |
| Secret | same value as `CALCOM_WEBHOOK_SECRET` |
| Version | `2026-07-27` |
| Triggers | `BOOKING_CREATED`, `BOOKING_REQUESTED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`, `BOOKING_REJECTED`, `MEETING_ENDED` |

- Signature: `x-cal-signature-256` = `HMAC-SHA256(rawBody, secret)`, verified in
  constant time against the **raw** body (never `request.json()` first).
- Idempotent: the SQL upsert is keyed on `cal_uid`, so Cal.com's at-least-once
  retries are harmless.
- Unhandled triggers answer `200 { ignored }` so Cal.com stops retrying them.
- A mapping failure answers `200 { skipped }` (retrying will not help), a store
  failure answers `500` (so Cal.com retries — the booking must not vanish).

### 2. Reconcile — `GET|POST /api/calcom/reconcile`

Webhooks are lossy (endpoint down, deploy in flight). This job re-reads
`GET /v2/bookings?status=upcoming` and upserts, scheduled by
`vercel.json` every 15 minutes. Auth: `Authorization: Bearer $CRON_SECRET`
(Vercel sends it automatically for crons).

### 3. Storage — `public.demo_meetings` (weeon-tenants)

Service-role only; `anon`/`authenticated` revoked. The SQL helper
`upsert_demo_meeting(jsonb)` keeps **Ops-owned columns** (`outcome`, `notes`,
`tenant_id`) untouched on update, so a late webhook can never undo a
`converted` demo or wipe notes. A cancellation always forces
`outcome = 'cancelled'`.

Columns of record:

| Column | Owner |
| --- | --- |
| `cal_uid`, `starts_at`, `ends_at`, `cal_status`, attendee fields, `booking_responses` | Cal.com (sync overwrites) |
| `meeting_date` | derived once from `starts_at` in Costa Rica time |
| `outcome`, `notes`, `tenant_id` | **Ops** (never overwritten by sync) |

## Joining a demo

Cal.com puts the destination in `location` (for **Cal Video**:
`https://app.cal.com/video/<uid>`). We store it verbatim and never rewrite it,
so switching the event type to Zoom / Meet / in-person in Cal.com needs no
code change here.

`lib/calendar/meeting-link.ts` decides what the UI offers:

| Window | UI |
| --- | --- |
| > 15 min before start | start time, opens 15 min before |
| 15 min before → 15 min after end | **Entrar** (opens the room in a new tab) |
| after the window | "Finalizada" — still links, Cal.com keeps the room |
| in-person address / phone | shown as text, never a link |
| no location | "Sin enlace" |

Rules: only `http(s)` (or protocol-relative) values become an `href` —
`javascript:` and friends are rendered as plain text. `now` is computed once
per render and passed to `<JoinMeeting>` so the server HTML and the client
hydration agree.

Where it appears: the week strip (inline, on the first meeting of a day) and
the day panel on `/dashboard/meetings` (inline).

## Code map

| Concern | File |
| --- | --- |
| Normalise webhook + API payloads | `lib/calendar/demo-meetings.ts` |
| Upsert / sync / read / update | `lib/calendar/demo-meetings-store.ts` |
| Webhook route | `app/api/calcom/webhook/route.ts` |
| Reconcile route + schedule | `app/api/calcom/reconcile/route.ts`, `vercel.json` |
| Landing strip data | `lib/calendar/week-strip.ts` |
| Meetings page views + date math | `components/dashboard/meetings-calendar.tsx`, `lib/calendar/meeting-views.ts` (+ `.test.ts`) |
| Monday–Friday window | `lib/calendar/week-window.ts` |
| Join link + time window | `lib/calendar/meeting-link.ts`, `components/dashboard/join-meeting.tsx` |
| Cal.com API read (legacy, page-independent) | `lib/calendar/ops-bookings.ts` |

## Environment

| Var | Required | Purpose |
| --- | --- | --- |
| `CALCOM_API_KEY` | yes | v2 API key for the reconcile job |
| `CALCOM_WEBHOOK_SECRET` | yes | verifies webhook signatures |
| `CRON_SECRET` | yes | authorises the reconcile cron |
| `CALCOM_EVENT_TYPE_ID` | no | narrow to one event type |
| `CALCOM_BOOKING_LINK` | no | default `weeon-school/meeting` |

Marketing needs none of these — it only publishes the public link
(`NEXT_PUBLIC_CALCOM_LINK`).

## Conventions

- **Never** call Cal.com from the browser; both the key and the webhook secret
  are server-only.
- **Never** read Cal.com on a page render — the strip reads our table.
- Costa Rica civil time (`WEEON_OPS_TIME_ZONE`) for dates, slots and grouping;
  Monday-first weeks.
- Ops never writes to Cal.com (no create/move/cancel from our side).
- Tests: `lib/calendar/demo-meetings.test.ts` (payload shapes, CR date
  rollover, unknown status coercion, week window) and
  `lib/calendar/ops-bookings.test.ts` (timezone conversion).

## Rollout order

1. Push the migration `20261028150000_demo_meetings.sql` to hosted Supabase.
2. Set `CALCOM_API_KEY`, `CALCOM_WEBHOOK_SECRET`, `CRON_SECRET` in
   `weeon-management` (local + Vercel).
3. Deploy, then create the Cal.com webhook pointing at `/api/calcom/webhook`.
4. Hit `/api/calcom/reconcile` once with the bearer token to backfill.
5. Book a test demo on the marketing site and confirm it lands on `/dashboard`
   and `/dashboard/meetings`.
