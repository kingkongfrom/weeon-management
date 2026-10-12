# Ops outbound email

Weeon Management sends **real email** through [Resend](https://resend.com). The
UI mirrors tenant/teacher **Comunicación → Mensajes** (folder sidebar, sent list,
reading pane). Compose at `/dashboard/email/nuevo`; sent log at `/dashboard/email`.
Delivery uses the same Weeon School letter as invites and the school app:
navy header and `public/email/logo-wordmark.png` (`lib/email/letter.ts`).

## Requirements

| Variable | Purpose |
| -------- | ------- |
| `RESEND_API_KEY` | Resend API key (server-only) |
| `RESEND_FROM` | Default From in compose (defaults toward `Weeon School <ops@weeon.school>`) |
| `OPS_EMAIL_FROM_ALIASES` | Optional comma/newline list of extra **De** identities (`Name <addr@weeon.school>`). Each address must be allowed on your Resend sending domain. If unset, compose offers `RESEND_FROM`, `support@`, and `hello@`, plus the signed-in `@weeon.school` mailbox. |
| `OPS_EMAIL_REPLY_TO` | Optional Reply-To when the signed-in user is not `@weeon.school` |
| `NEXT_PUBLIC_DROPBOX_APP_KEY` | Dropbox Chooser (compose attachments) — same app as school ERP or a separate Dropbox app with `ops.weeon.school` origin |
| `NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID` | Google OAuth client for Drive Picker |
| `NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY` | Google API key (Picker) |
| `NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID` | Google Cloud project number (optional but recommended) |

Compose cloud import uses `/api/ops-email/dropbox-import` and
`/api/ops-email/google-drive-import` (ops session required). CSP in
`next.config.ts` allowlists Dropbox and Google script/connect/frame origins.

## Inbound (receive)

Receiving DNS (Hostinger + **`inbound.weeon.school`**): **`docs/email-dns-receiving.md`**.
Webhook + app: **`docs/email-inbound.md`**. Webhook:
`/api/webhooks/resend` → table `platform_inbound_emails`. Outbound send is
unchanged.

## Data

Sent messages append to `public.platform_outbound_emails` (migration
`20261002110000_platform_outbound_emails.sql` in **weeon-tenants**). Service-role
only; schools never read this table.

## Mailbox UX (parity with school ERP)

- **35% / 65%** list vs reading pane; reading pane is read-only — click or double-click
  opens **Redactar** (`/dashboard/email/nuevo`) with thread context.
- Compose matches tenant **Mensajes**: read phase with reply / reply-all / forward icon
  chips (tooltips), quoted history with full **De / Para / Enviado / Asunto** rows,
  compact attachment strip, **Enviar** hidden until the user expands a reply or forward.
- **De** row shows `Nombre <correo>` (no `via Weeon` suffix). One allowed alias → read-only;
  several → same field card with a select.
- **Para / Cc:** inline chips + type an address (Enter, comma, or Tab) — same pattern as school ERP;
  Google Drive / Dropbox use the **compact** attachment row (not tall icon stacks).
- Query params: `?reply=` (inbound), `?replySent=` (outbound), `?forward=` (inbound forward).

## Not in v1

- Tenant-linked recipient directory (Ops compose uses free-form email addresses).
- Full thread storage (each inbound/outbound row is one message; quoted history is the
  selected message only until multi-message threading exists).
