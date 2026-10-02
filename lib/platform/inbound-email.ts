import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";

export type InboundEmailRow = {
  id: string;
  resendEmailId: string;
  messageId: string | null;
  fromEmail: string;
  toEmails: string[];
  ccEmails: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ListInboundEmailsResult =
  | { ok: true; rows: InboundEmailRow[]; unreadCount: number }
  | { ok: false; reason: string; rows: InboundEmailRow[]; unreadCount: number };

function mapRow(row: Record<string, unknown>): InboundEmailRow {
  return {
    id: String(row.id),
    resendEmailId: String(row.resend_email_id),
    messageId: (row.message_id as string | null) ?? null,
    fromEmail: String(row.from_email),
    toEmails: Array.isArray(row.to_emails) ? row.to_emails.map(String) : [],
    ccEmails: Array.isArray(row.cc_emails) ? row.cc_emails.map(String) : [],
    subject: String(row.subject),
    bodyText: String(row.body_text ?? ""),
    bodyHtml: (row.body_html as string | null) ?? null,
    readAt: (row.read_at as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

function missingTableMessage(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "42P01" ||
    (error.message?.includes("platform_inbound_emails") ?? false) ||
    (error.message?.includes("does not exist") ?? false)
  );
}

export async function getInboundEmailById(
  id: string,
): Promise<{ ok: true; row: InboundEmailRow } | { ok: false; error: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false, error: "invalid_id" };
  }

  const client = createPlatformClient();
  const { data, error } = await client
    .from("platform_inbound_emails")
    .select(
      "id, resend_email_id, message_id, from_email, to_emails, cc_emails, subject, body_text, body_html, read_at, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: missingTableMessage(error)
        ? "Inbound table missing."
        : error.message,
    };
  }
  if (!data) {
    return { ok: false, error: "not_found" };
  }
  return { ok: true, row: mapRow(data as Record<string, unknown>) };
}

export async function countUnreadInboundEmails(): Promise<number> {
  const client = createPlatformClient();
  const { count, error } = await client
    .from("platform_inbound_emails")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    if (missingTableMessage(error)) return 0;
    return 0;
  }
  return count ?? 0;
}

export async function listInboundEmails(limit = 40): Promise<ListInboundEmailsResult> {
  const client = createPlatformClient();

  const [listResult, unreadCount] = await Promise.all([
    client
      .from("platform_inbound_emails")
      .select(
        "id, resend_email_id, message_id, from_email, to_emails, cc_emails, subject, body_text, body_html, read_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit),
    countUnreadInboundEmails(),
  ]);

  const { data, error } = listResult;

  if (error) {
    return {
      ok: false,
      reason: missingTableMessage(error)
        ? "The inbound email table is not on the database yet. Apply migration 20261002130000_platform_inbound_emails.sql from weeon-tenants."
        : error.message,
      rows: [],
      unreadCount: 0,
    };
  }

  return {
    ok: true,
    rows: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
    unreadCount,
  };
}

export async function insertInboundEmail(input: {
  resendEmailId: string;
  messageId?: string | null;
  fromEmail: string;
  toEmails: string[];
  ccEmails?: string[];
  receivedFor?: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const client = createPlatformClient();
  const { data, error } = await client
    .from("platform_inbound_emails")
    .upsert(
      {
        resend_email_id: input.resendEmailId.trim(),
        message_id: input.messageId ?? null,
        from_email: input.fromEmail.trim(),
        to_emails: input.toEmails.map((e) => e.trim()).filter(Boolean),
        cc_emails: (input.ccEmails ?? []).map((e) => e.trim()).filter(Boolean),
        received_for: (input.receivedFor ?? []).map((e) => e.trim()).filter(Boolean),
        subject: input.subject.trim() || "(no subject)",
        body_text: input.bodyText,
        body_html: input.bodyHtml ?? null,
      },
      { onConflict: "resend_email_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.id) {
    return { ok: true, id: input.resendEmailId };
  }
  return { ok: true, id: String(data.id) };
}

export async function markInboundEmailRead(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = createPlatformClient();
  const { error } = await client
    .from("platform_inbound_emails")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
