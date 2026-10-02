import { emptyDoc, type RichTextDoc } from "@/lib/comms/model";
import type { InboundEmailRow } from "@/lib/platform/inbound-email";

export type OpsComposeInitial = {
  to: string[];
  subject: string;
  body: RichTextDoc;
  allowReplies: boolean;
  inboundId: string;
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

function quotePlainText(text: string, maxLen = 8000): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, maxLen)}…`;
}

export function buildReplyBodyDoc(input: {
  fromDisplay: string;
  sentAtLabel: string;
  bodyText: string;
}): RichTextDoc {
  const quoted = quotePlainText(input.bodyText || "");
  const base = emptyDoc();

  return {
    type: "doc",
    content: [
      ...(base.content ?? []),
      { type: "paragraph" },
      {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                marks: [{ type: "bold" }],
                text: `${input.fromDisplay} · ${input.sentAtLabel}`,
              },
            ],
          },
          ...(quoted
            ? quoted.split("\n").map((line) => ({
                type: "paragraph" as const,
                content: line ? [{ type: "text" as const, text: line }] : [],
              }))
            : [{ type: "paragraph" as const }]),
        ],
      },
    ],
  };
}

export function inboundReplyComposeInitial(row: InboundEmailRow): OpsComposeInitial | null {
  const to = parseMailboxAddress(row.fromEmail);
  if (!to.includes("@")) return null;

  const sentAtLabel = new Date(row.createdAt).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    inboundId: row.id,
    to: [to],
    subject: replySubjectLine(row.subject),
    allowReplies: true,
    body: buildReplyBodyDoc({
      fromDisplay: row.fromEmail.trim(),
      sentAtLabel,
      bodyText: row.bodyText,
    }),
  };
}
