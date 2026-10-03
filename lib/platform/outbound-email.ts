import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";

export type OutboundEmailRow = {
  id: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  actorEmail: string;
  status: "sent" | "failed";
  resendId: string | null;
  errorMessage: string | null;
  labelId: string | null;
  createdAt: string;
};

export type ListOutboundEmailsResult =
  | { ok: true; rows: OutboundEmailRow[] }
  | { ok: false; reason: string; rows: OutboundEmailRow[] };

function mapRow(row: Record<string, unknown>): OutboundEmailRow {
  return {
    id: String(row.id),
    toEmail: String(row.to_email),
    subject: String(row.subject),
    bodyText: String(row.body_text),
    actorEmail: String(row.actor_email),
    status: row.status === "failed" ? "failed" : "sent",
    resendId: (row.resend_id as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    labelId: (row.label_id as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export async function listOutboundEmails(
  limit = 40,
  labelId?: string | null,
): Promise<ListOutboundEmailsResult> {
  const client = createPlatformClient();
  let query = client
    .from("platform_outbound_emails")
    .select(
      "id, to_email, subject, body_text, actor_email, status, resend_id, error_message, label_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (labelId) {
    query = query.eq("label_id", labelId);
  }

  const { data, error } = await query;

  if (error) {
    const missing =
      error.code === "42P01" ||
      error.message.includes("platform_outbound_emails") ||
      error.message.includes("does not exist");
    return {
      ok: false,
      reason: missing
        ? "The outbound email log table is not on the database yet. Apply migration 20261002110000_platform_outbound_emails.sql from weeon-tenants."
        : error.message,
      rows: [],
    };
  }

  return {
    ok: true,
    rows: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
  };
}

export async function getOutboundEmailById(
  id: string,
): Promise<{ ok: true; row: OutboundEmailRow } | { ok: false; reason: string }> {
  const client = createPlatformClient();
  const { data, error } = await client
    .from("platform_outbound_emails")
    .select(
      "id, to_email, subject, body_text, actor_email, status, resend_id, error_message, label_id, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: error.message };
  }
  if (!data) {
    return { ok: false, reason: "not_found" };
  }
  return { ok: true, row: mapRow(data as Record<string, unknown>) };
}

export async function insertOutboundEmailLog(input: {
  actorUserId: string | null;
  actorEmail: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  status: "sent" | "failed";
  resendId?: string | null;
  errorMessage?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = createPlatformClient();
  const { error } = await client.from("platform_outbound_emails").insert({
    actor_user_id: input.actorUserId,
    actor_email: input.actorEmail,
    to_email: input.toEmail.trim().toLowerCase(),
    subject: input.subject.trim(),
    body_text: input.bodyText,
    status: input.status,
    resend_id: input.resendId ?? null,
    error_message: input.errorMessage ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
