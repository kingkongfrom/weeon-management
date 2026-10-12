"use client";

import type { OpsThreadHistoryMessage } from "@/lib/ops-email/thread-history";

export function OpsMessageBodyView({ message }: { message: OpsThreadHistoryMessage }) {
  if (message.bodyHtml) {
    return (
      <div
        className="rte-content text-[15px] leading-relaxed text-foreground/90"
        dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
      />
    );
  }
  return (
    <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
      {message.bodyText}
    </div>
  );
}
