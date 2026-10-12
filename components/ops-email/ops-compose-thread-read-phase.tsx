"use client";

import type { ReactNode } from "react";
import {
  formatComposeHeaderTime,
  formatComposeLongSent,
  parseFromLabel,
} from "@/lib/ops-email/compose-display-utils";
import { OpsMessageBodyView } from "@/components/ops-email/ops-message-body-view";
import type { OpsThreadHistoryMessage } from "@/lib/ops-email/thread-history";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-x-3 text-sm leading-snug sm:grid-cols-[6.5rem_1fr]">
      <span className="font-semibold text-foreground/50">{label}</span>
      <span className="min-w-0 break-words font-medium text-foreground/90">{value}</span>
    </div>
  );
}

function MessageMetaBlock({
  message,
  subjectLine,
}: {
  message: OpsThreadHistoryMessage;
  subjectLine: string;
}) {
  const t = useT();
  return (
    <div className="space-y-2">
      <MetaRow label={t.opsEmail.historyFrom} value={message.fromLabel} />
      <MetaRow label={t.opsEmail.toLabel} value={message.toLabel} />
      <MetaRow label={t.opsEmail.historySent} value={formatComposeLongSent(message.sentAt)} />
      <MetaRow label={t.opsEmail.subject} value={message.subject || subjectLine} />
    </div>
  );
}

function buildQuotedBlocks(
  messages: OpsThreadHistoryMessage[],
  subjectLine: string,
  t: ReturnType<typeof useT>,
  replying: boolean,
): Array<{ message: OpsThreadHistoryMessage; sectionLabel: string | null }> {
  const latest = messages[messages.length - 1];
  if (!latest) return [];
  const earlier = messages.slice(0, -1);

  if (replying) {
    return [
      { message: latest, sectionLabel: null },
      ...[...earlier].reverse().map((message, index, list) => ({
        message,
        sectionLabel:
          index === list.length - 1
            ? t.opsEmail.threadSectionInitial
            : t.opsEmail.threadSectionReply,
      })),
    ];
  }

  return [...earlier].reverse().map((message, index, list) => ({
    message,
    sectionLabel:
      index === list.length - 1 ? t.opsEmail.threadSectionInitial : t.opsEmail.threadSectionReply,
  }));
}

function QuotedThreadBlock({
  message,
  subjectLine,
  sectionLabel,
}: {
  message: OpsThreadHistoryMessage;
  subjectLine: string;
  sectionLabel: string | null;
}) {
  return (
    <article className="space-y-4">
      {sectionLabel ? (
        <p className="text-sm font-medium text-foreground/45">{sectionLabel}:</p>
      ) : null}
      <MessageMetaBlock message={message} subjectLine={subjectLine} />
      <div className="border-l-[3px] border-foreground/12 pl-5">
        <OpsMessageBodyView message={message} />
      </div>
    </article>
  );
}

export function OpsComposeThreadQuotedSection({
  messages,
  subject,
  replying,
}: {
  messages: OpsThreadHistoryMessage[];
  subject: string;
  replying: boolean;
}) {
  const t = useT();
  if (messages.length === 0) return null;

  const latest = messages[messages.length - 1]!;
  const subjectLine = subject.trim() || latest.subject.trim() || t.opsEmail.draftNoSubject;
  const quotedBelow = buildQuotedBlocks(messages, subjectLine, t, replying);
  if (quotedBelow.length === 0) return null;

  return (
    <div
      className={cn(
        "border-t border-border/60 pt-6",
        replying ? "mt-6 space-y-5" : "mt-10 space-y-10 pt-8",
      )}
    >
      {quotedBelow.map(({ message, sectionLabel }) => (
        <QuotedThreadBlock
          key={message.id}
          message={message}
          subjectLine={subjectLine}
          sectionLabel={sectionLabel}
        />
      ))}
    </div>
  );
}

export function OpsComposeThreadReadPhase({
  subject,
  messages,
  replyEditor = null,
  deferQuotedThread = false,
}: {
  subject: string;
  messages: OpsThreadHistoryMessage[];
  replyEditor?: ReactNode;
  deferQuotedThread?: boolean;
}) {
  const t = useT();
  if (messages.length === 0) return null;

  const latest = messages[messages.length - 1]!;
  const from = parseFromLabel(latest.fromLabel);
  const subjectLine = subject.trim() || latest.subject.trim() || t.opsEmail.draftNoSubject;
  const headerTime = formatComposeHeaderTime(latest.sentAt);
  const isReplying = replyEditor != null;
  const quotedBelow = deferQuotedThread
    ? []
    : buildQuotedBlocks(messages, subjectLine, t, isReplying);
  const hideReadHeader = isReplying && deferQuotedThread;

  return (
    <div className="space-y-0">
      {hideReadHeader ? null : (
        <header className="border-b border-border/50 pb-4">
          <h2 className="text-base font-semibold leading-snug text-foreground">{subjectLine}</h2>
          <p className="mt-1.5 text-sm text-foreground/55">
            <span className="font-medium text-foreground/75">{from.name}</span>
            {from.email ? <span className="text-foreground/45"> &lt;{from.email}&gt;</span> : null}
            {headerTime ? <span className="text-foreground/40"> · {headerTime}</span> : null}
          </p>
          <p className="mt-1 text-sm text-foreground/50">
            {t.opsEmail.toLabel}: {latest.toLabel}
          </p>
          <article className="mt-4">
            <OpsMessageBodyView message={latest} />
          </article>
        </header>
      )}

      {replyEditor ? (
        <div
          className={cn(
            isReplying ? (hideReadHeader ? "pt-0" : "pt-6") : "pt-4",
            "email-compose-fields",
          )}
        >
          {replyEditor}
        </div>
      ) : null}

      {quotedBelow.length > 0 ? (
        <div className="space-y-10 border-t border-border/60 pt-8">
          {quotedBelow.map(({ message, sectionLabel }) => (
            <QuotedThreadBlock
              key={message.id}
              message={message}
              subjectLine={subjectLine}
              sectionLabel={sectionLabel}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
