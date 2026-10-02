import "server-only";

import { Resend } from "resend";

export type FetchedInboundEmail = {
  resendEmailId: string;
  messageId: string;
  fromEmail: string;
  toEmails: string[];
  ccEmails: string[];
  receivedFor: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
};

function resendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/** Full message body from Resend Receiving API (webhook metadata is not enough). */
export async function fetchInboundEmailContent(
  resendEmailId: string,
): Promise<{ ok: true; email: FetchedInboundEmail } | { ok: false; error: string }> {
  const resend = resendClient();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const { data, error } = await resend.emails.receiving.get(resendEmailId);
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not load received email from Resend." };
  }

  const bodyText = data.text?.trim() || stripHtmlToText(data.html) || "";

  return {
    ok: true,
    email: {
      resendEmailId: data.id,
      messageId: data.message_id,
      fromEmail: data.from,
      toEmails: data.to ?? [],
      ccEmails: data.cc ?? [],
      receivedFor: data.received_for ?? [],
      subject: data.subject?.trim() || "(no subject)",
      bodyText,
      bodyHtml: data.html ?? null,
    },
  };
}

function stripHtmlToText(html: string | null | undefined): string {
  if (!html?.trim()) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Optional allow-list (comma-separated). Empty = accept all received mail Resend forwards. */
export function inboundAddressAllowed(receivedFor: string[]): boolean {
  const raw = process.env.OPS_INBOUND_ADDRESSES?.trim();
  if (!raw) return true;
  const allowed = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  const targets = receivedFor.map((e) => e.trim().toLowerCase());
  return targets.some((target) => allowed.some((rule) => target === rule || target.endsWith(rule)));
}
