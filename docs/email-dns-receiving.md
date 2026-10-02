# DNS for Ops inbound mail (`weeon.school`)

**You cannot turn on Resend receiving on the root domain `@` (weeon.school).**
Live DNS already has Hostinger mail:

| Host | MX (priority) |
| ---- | ---------------- |
| `weeon.school` | `mx1.hostinger.com` (5), `mx2.hostinger.com` (10) |

That is almost certainly where **`support@weeon.school`** and other real inboxes
live. Resend’s “Conflicting MX records” banner appears when you enable receiving
on `@` while another MX (Hostinger, SES, etc.) already exists.

**Outbound send is unaffected.** It uses **`send.weeon.school`** (Resend / SES for
sending), not the receiving MX.

## Recommended layout

| Purpose | Domain / address | DNS |
| ------- | ---------------- | --- |
| Marketing / human inbox | `@weeon.school` (Hostinger) | Keep existing MX — **do not change** |
| Resend **send** | `send.weeon.school` | Already configured for Resend |
| Resend **receive** (Ops) | **`inbound.weeon.school`** | **One new MX** (Resend only) |

Ops will receive mail sent to **`anything@inbound.weeon.school`**, e.g.
`ops@inbound.weeon.school`. The webhook stores it in `platform_inbound_emails`.

To keep using **`support@weeon.school`**, add a **forward** in Hostinger:
`support@weeon.school` → `ops@inbound.weeon.school` (or an alias). Do **not**
point Hostinger MX to Resend.

---

## Step 1 — Resend (dashboard)

1. **Turn off** “Enable Receiving” on **`weeon.school` `@`** if it is on (avoids
   the conflict warning and a useless pending MX on apex).

2. **Domains → Add domain** → `inbound.weeon.school`  
   (Use the full subdomain as the domain name in Resend.)

3. Add the **DNS records Resend shows** for that domain (TXT/CNAME as needed for
   verification). Receiving may need only MX once the domain is verified — follow
   the Records tab for this domain.

4. Open **`inbound.weeon.school` → Enable Receiving** (toggle ON).

5. Copy the **MX** row Resend displays (host name, value, priority).  
   For US regions this is often along the lines of  
   `inbound-smtp.us-east-1.amazonaws.com` with priority **10** — **use your
   dashboard value exactly**, including a trailing `.` if Hostinger asks for FQDN.

6. Webhook (if not done): **`email.received`** →  
   `https://ops.weeon.school/api/webhooks/resend` → save **`RESEND_WEBHOOK_SECRET`**.

---

## Step 2 — Hostinger DNS

Log in → **Domains → weeon.school → DNS / DNS Zone**.

1. **Do not** add or change MX on **`@`** for Resend.

2. **Add one MX record** for the **subdomain** only:

   | Field | Value |
   | ----- | ----- |
   | Type | MX |
   | Name / Host | `inbound` (Hostinger usually means `inbound.weeon.school`) |
   | Mail server | Paste Resend’s MX target **exactly** |
   | Priority | Same as Resend (e.g. `10`) |
   | TTL | Default |

3. Save. Propagation often takes 5–30 minutes (up to 48h).

4. In Resend → **I’ve added the record** → wait until receiving MX shows **Verified**.

Verify from your machine:

```powershell
nslookup -type=MX inbound.weeon.school
```

You should see **only** Resend’s inbound MX (no Hostinger on this host).

---

## Step 3 — Ops env (Vercel + `.env.local`)

```env
OPS_INBOUND_ADDRESSES=ops@inbound.weeon.school,support@inbound.weeon.school
```

If you forward `support@weeon.school` from Hostinger, the webhook may still show
`to: support@weeon.school` — include that address too if you filter:

```env
OPS_INBOUND_ADDRESSES=ops@inbound.weeon.school,support@weeon.school
```

Leave unset to accept all mail Resend delivers for the receiving domain.

Redeploy **weeon-management** after changing env vars.

---

## Step 4 — Test

1. From Gmail (or similar), send to `ops@inbound.weeon.school`.
2. Resend → Webhooks → delivery **2xx**.
3. Ops → **Correo → Recibidas** → message appears.

---

## What not to do

| Action | Why |
| ------ | --- |
| Add Resend MX on `@` alongside Hostinger | Unpredictable delivery; breaks or steals Hostinger mail |
| Remove Hostinger MX on `@` | Breaks existing `@weeon.school` mailboxes |
| Forward Hostinger → raw `inbound-smtp…amazonaws.com` | Resend requires verified receiving domain; use **`@inbound.weeon.school`** |
| Change `send.weeon.school` MX for receiving | Send subdomain is for **outbound**; use **`inbound`** for receive |

---

## Who owns DNS?

Apex MX today points to **Hostinger**, so DNS for `weeon.school` is almost
certainly managed in **Hostinger** (not Vercel). Subdomains like `app.`, `ops.`,
`send.` may be CNAMEs elsewhere; only the **MX for `inbound.weeon.school`** must
be added in the same place that serves the `weeon.school` zone (Hostinger).

If the zone moves to Cloudflare later, recreate the same **`inbound` MX** there.
