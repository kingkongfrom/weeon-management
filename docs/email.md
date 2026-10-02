# Ops outbound email

Weeon Management sends **real email** through [Resend](https://resend.com). The
UI mirrors tenant/teacher **Comunicación → Mensajes** (folder sidebar, sent list,
reading pane). Compose at `/dashboard/email/nuevo`; sent log at `/dashboard/email`.
Delivery uses the same branded Weeon School HTML as invites (`lib/email/send.ts`).

## Requirements

| Variable | Purpose |
| -------- | ------- |
| `RESEND_API_KEY` | Resend API key (server-only) |
| `RESEND_FROM` | Verified sender domain in Resend (defaults toward `Weeon School <ops@weeon.school>`) |
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

## Not in v1

- Reply-all / forward (single **Responder** from Recibidas → Redactar with quote).
- Tenant-linked recipient directory (Ops compose uses free-form email addresses).
