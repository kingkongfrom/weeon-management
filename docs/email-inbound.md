# Ops inbound email (Resend Receiving)

Outbound compose and invites keep using **`resend.emails.send`** and
`platform_outbound_emails`. Inbound is a **separate pipeline** so receiving
configuration cannot break send.

## Architecture

| Step | What happens |
| ---- | ------------- |
| 1 | Mail arrives at your **receiving** domain (Resend-managed or custom MX). |
| 2 | Resend POSTs `email.received` to **`/api/webhooks/resend`**. |
| 3 | Ops verifies the Svix signature (`RESEND_WEBHOOK_SECRET`). |
| 4 | Ops calls Resend **Receiving API** for HTML/text (webhook is metadata only). |
| 5 | Row stored in **`platform_inbound_emails`** (service-role). |
| 6 | **Recibidas** in `/dashboard/email?folder=inbox` lists stored mail. |
| 7 | **Responder** → `/dashboard/email/nuevo?reply=<id>` prefills Para, Asunto, and quoted body (same send pipeline as Redactar). |

## DNS (required — not in git)

**Do not enable receiving on `weeon.school` `@`.** Apex MX is Hostinger
(`mx1` / `mx2`); Resend will show “Conflicting MX records”.

Use subdomain **`inbound.weeon.school`** and add Resend’s receiving MX only on
`inbound` in **Hostinger DNS**. Full steps: **`docs/email-dns-receiving.md`**.

## Resend dashboard (one-time)

1. **Receiving domain** — Add **`inbound.weeon.school`** in Resend, enable
   Receiving, add the MX Hostinger (not on apex `@`).

2. **Webhook** — Webhooks → Add:
   - URL: `https://ops.weeon.school/api/webhooks/resend` (dev: tunnel + same path)
   - Event: **`email.received`**
   - Copy **`signing_secret`** → `RESEND_WEBHOOK_SECRET` on Vercel / `.env.local`

3. **`RESEND_API_KEY`** — Same key as outbound (already required for compose).

## Environment

| Variable | Required for inbound |
| -------- | -------------------- |
| `RESEND_API_KEY` | Yes (fetch body + send unchanged) |
| `RESEND_WEBHOOK_SECRET` | Yes (verify webhook) |
| `OPS_INBOUND_ADDRESSES` | Optional filter (comma-separated), e.g. `ops@weeon.school` |

## Database

Apply in **weeon-tenants** (schema owner):

`supabase/migrations/20261002130000_platform_inbound_emails.sql`

```powershell
cd weeon-tenants
npx supabase db push --linked
```

## Verify

1. Send a test email to your receiving address from an external mailbox.
2. Resend Webhooks → delivery should be **2xx**.
3. Ops → **Correo → Recibidas** should show the message after refresh.

## Troubleshooting

| Symptom | Check |
| ------- | ----- |
| Webhook 401 | `RESEND_WEBHOOK_SECRET` matches the webhook in Resend |
| Webhook 503 | `RESEND_WEBHOOK_SECRET` or `RESEND_API_KEY` missing |
| Empty inbox, webhook OK | Migration applied; check Vercel logs for insert errors |
| Send still works | Inbound does not touch `sendBrandedEmail` or outbound log |
