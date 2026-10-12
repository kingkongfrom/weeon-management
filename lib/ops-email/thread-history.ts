import type { InboundEmailRow } from "@/lib/platform/inbound-email";
import type { OutboundEmailRow } from "@/lib/platform/outbound-email";

export type OpsThreadHistoryMessage = {
  id: string;
  fromLabel: string;
  toLabel: string;
  subject: string;
  sentAt: string;
  bodyText: string;
  bodyHtml: string | null;
};

export function inboundToHistory(row: InboundEmailRow): OpsThreadHistoryMessage {
  return {
    id: row.id,
    fromLabel: row.fromEmail.trim(),
    toLabel: row.toEmails.join(", ") || "Ops",
    subject: row.subject.trim() || "(Sin asunto)",
    sentAt: row.createdAt,
    bodyText: row.bodyText,
    bodyHtml: row.bodyHtml,
  };
}

export function outboundToHistory(row: OutboundEmailRow): OpsThreadHistoryMessage {
  const from = row.actorEmail.trim() || "Weeon Ops";
  return {
    id: row.id,
    fromLabel: from,
    toLabel: row.toEmail.trim(),
    subject: row.subject.trim() || "(Sin asunto)",
    sentAt: row.createdAt,
    bodyText: row.bodyText,
    bodyHtml: null,
  };
}
