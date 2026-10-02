import type { InboundEmailRow } from "@/lib/platform/inbound-email";
import type { OutboundEmailRow } from "@/lib/platform/outbound-email";

export type OpsMailboxMessage =
  | ({ kind: "outbound" } & OutboundEmailRow)
  | ({ kind: "inbound" } & InboundEmailRow);

export function outboundToMailbox(row: OutboundEmailRow): OpsMailboxMessage {
  return { kind: "outbound", ...row };
}

export function inboundToMailbox(row: InboundEmailRow): OpsMailboxMessage {
  return { kind: "inbound", ...row };
}

export function mailboxListTitle(row: OpsMailboxMessage): string {
  return row.kind === "inbound" ? row.fromEmail : row.toEmail;
}

export function mailboxPreviewText(row: OpsMailboxMessage): string {
  return row.kind === "inbound" ? row.bodyText : row.bodyText;
}

export function mailboxIsUnread(row: OpsMailboxMessage): boolean {
  if (row.kind === "inbound") return row.readAt == null;
  return row.status === "failed";
}
