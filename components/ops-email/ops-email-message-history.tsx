"use client";

import type { ReactNode } from "react";
import {
  formatComposeLongSent,
  initialsFromName,
  parseFromLabel,
} from "@/lib/ops-email/compose-display-utils";
import type { OpsThreadHistoryMessage } from "@/lib/ops-email/thread-history";
import { OpsMessageBodyView } from "@/components/ops-email/ops-message-body-view";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import { opsEmailTone } from "@/lib/ops-email/messages-tone";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[4.25rem_1fr] gap-x-3 text-sm leading-snug sm:grid-cols-[6.5rem_1fr]">
      <span className="font-semibold text-foreground/50">{label}</span>
      <span className="min-w-0 break-words font-medium text-foreground/90">{value}</span>
    </div>
  );
}

function displayFromLabel(message: OpsThreadHistoryMessage, isMine: boolean, youLabel: string): string {
  if (isMine) return youLabel;
  const parsed = parseFromLabel(message.fromLabel);
  if (parsed.email && parsed.name !== parsed.email) {
    return `${parsed.name} <${parsed.email}>`;
  }
  return message.fromLabel;
}

/** Full De/Para/Enviado/Asunto blocks — parity with school mailbox reading pane. */
export function OpsEmailMessageHistory({
  messages,
  subject,
  isLatestMine = false,
  deliveryFooter = null,
}: {
  messages: OpsThreadHistoryMessage[];
  subject?: string;
  isLatestMine?: boolean;
  deliveryFooter?: ReactNode;
}) {
  const t = useT();
  if (messages.length === 0) return null;

  const subjectLine = subject?.trim() || messages[messages.length - 1]?.subject || t.opsEmail.draftNoSubject;
  const ordered = [...messages].reverse();

  return (
    <div className="pb-4">
      <div className="space-y-6 sm:space-y-10">
        {ordered.map((message, index) => {
          const isLatest = index === 0;
          const isMine = isLatest && isLatestMine;
          const authorName = displayFromLabel(message, isMine, t.opsEmail.you);
          const sectionLabel =
            index === ordered.length - 1 ? t.opsEmail.threadSectionInitial : t.opsEmail.threadSectionReply;

          return (
            <article key={message.id} className={cn(!isLatest && "border-t border-border/60 pt-5 sm:pt-8")}>
              {!isLatest ? (
                <p className="mb-3 text-sm font-medium text-foreground/45 sm:mb-4">{sectionLabel}:</p>
              ) : null}
              <header className="flex items-start gap-2.5 sm:gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold sm:h-11 sm:w-11",
                    opsEmailTone.avatar,
                  )}
                  aria-hidden
                >
                  {initialsFromName(isMine ? t.opsEmail.you : parseFromLabel(message.fromLabel).name)}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-3">
                  <MetaRow label={t.opsEmail.historyFrom} value={authorName} />
                  <MetaRow label={t.opsEmail.toLabel} value={message.toLabel} />
                  <MetaRow label={t.opsEmail.historySent} value={formatComposeLongSent(message.sentAt)} />
                  <MetaRow label={t.opsEmail.subject} value={message.subject || subjectLine} />
                </div>
              </header>
              <div className="mt-3 border-l-[3px] border-foreground/12 pl-3 sm:mt-4 sm:pl-5">
                <OpsMessageBodyView message={message} />
              </div>
            </article>
          );
        })}
      </div>
      {deliveryFooter}
    </div>
  );
}
