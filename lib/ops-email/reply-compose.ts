import { emptyDoc, type RichTextDoc } from "@/lib/comms/model";
import { ensureForwardSubject } from "@/lib/ops-email/compose-display-utils";
import {
  inboundToHistory,
  outboundToHistory,
  type OpsThreadHistoryMessage,
} from "@/lib/ops-email/thread-history";
import type { InboundEmailRow } from "@/lib/platform/inbound-email";
import type { OutboundEmailRow } from "@/lib/platform/outbound-email";

export type OpsComposeInitial = {
  to: string[];
  cc: string[];
  subject: string;
  body: RichTextDoc;
  allowReplies: boolean;
  inboundId?: string;
  outboundId?: string;
  sourceHistory: OpsThreadHistoryMessage[];
};

/** Extract bare address from `Name <user@host>` or plain email. */
export function parseMailboxAddress(raw: string): string {
  const trimmed = raw.trim();
  const angle = trimmed.match(/<([^>]+)>/);
  if (angle?.[1]) return angle[1].trim().toLowerCase();
  return trimmed.toLowerCase();
}

export function replySubjectLine(subject: string): string {
  const trimmed = subject.trim() || "(sin asunto)";
  if (/^re:\s/i.test(trimmed)) return trimmed;
  return `Re: ${trimmed}`;
}

function uniqueEmails(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const email = parseMailboxAddress(raw);
    if (!email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

function baseFromInbound(row: InboundEmailRow): Omit<OpsComposeInitial, "to" | "cc" | "subject" | "body"> {
  return {
    allowReplies: true,
    inboundId: row.id,
    sourceHistory: [inboundToHistory(row)],
  };
}

export function inboundReplyComposeInitial(row: InboundEmailRow): OpsComposeInitial | null {
  const to = parseMailboxAddress(row.fromEmail);
  if (!to.includes("@")) return null;

  return {
    ...baseFromInbound(row),
    to: [to],
    cc: [],
    subject: replySubjectLine(row.subject),
    body: emptyDoc(),
  };
}

export function inboundReplyAllComposeInitial(row: InboundEmailRow): OpsComposeInitial | null {
  const to = parseMailboxAddress(row.fromEmail);
  if (!to.includes("@")) return null;
  const cc = uniqueEmails(row.ccEmails);

  return {
    ...baseFromInbound(row),
    to: [to],
    cc,
    subject: replySubjectLine(row.subject),
    body: emptyDoc(),
  };
}

export function inboundForwardComposeInitial(row: InboundEmailRow): OpsComposeInitial | null {
  return {
    ...baseFromInbound(row),
    to: [],
    cc: [],
    subject: ensureForwardSubject(row.subject),
    body: emptyDoc(),
  };
}

export function outboundReplyComposeInitial(row: OutboundEmailRow): OpsComposeInitial | null {
  const to = parseMailboxAddress(row.toEmail);
  if (!to.includes("@")) return null;

  return {
    outboundId: row.id,
    to: [to],
    cc: [],
    subject: replySubjectLine(row.subject),
    allowReplies: true,
    body: emptyDoc(),
    sourceHistory: [outboundToHistory(row)],
  };
}
