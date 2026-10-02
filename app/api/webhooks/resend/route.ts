import { NextResponse } from "next/server";
import { Resend } from "resend";
import { fetchInboundEmailContent, inboundAddressAllowed } from "@/lib/email/resend-inbound";
import { insertInboundEmail } from "@/lib/platform/inbound-email";

export const runtime = "nodejs";

/**
 * Resend inbound webhook (`email.received`). Outbound send uses `resend.emails.send`
 * elsewhere — this route only ingests received mail into `platform_inbound_emails`.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "resend_not_configured" }, { status: 503 });
  }

  const payload = await request.text();
  const resend = new Resend(apiKey);

  let event: ReturnType<Resend["webhooks"]["verify"]>;
  try {
    event = resend.webhooks.verify({
      payload,
      webhookSecret,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
    });
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const meta = event.data;
  const resendEmailId = meta.email_id;
  if (!resendEmailId) {
    return NextResponse.json({ error: "missing_email_id" }, { status: 400 });
  }

  const receivedFor = meta.received_for ?? meta.to ?? [];
  if (!inboundAddressAllowed(receivedFor)) {
    return NextResponse.json({ ok: true, skipped: "address_not_allowed" });
  }

  const fetched = await fetchInboundEmailContent(resendEmailId);
  if (!fetched.ok) {
    return NextResponse.json({ error: fetched.error }, { status: 502 });
  }

  const stored = await insertInboundEmail({
    resendEmailId: fetched.email.resendEmailId,
    messageId: fetched.email.messageId,
    fromEmail: fetched.email.fromEmail,
    toEmails: fetched.email.toEmails,
    ccEmails: fetched.email.ccEmails,
    receivedFor: fetched.email.receivedFor,
    subject: fetched.email.subject,
    bodyText: fetched.email.bodyText,
    bodyHtml: fetched.email.bodyHtml,
  });

  if (!stored.ok) {
    return NextResponse.json({ error: stored.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: stored.id });
}
