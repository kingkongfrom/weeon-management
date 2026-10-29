"use client";

import { OpsEmailCompose, type OpsFromOption } from "@/components/ops-email/ops-email-compose";
import type { OpsComposeInitial } from "@/lib/ops-email/reply-compose";

/** Same shell as school ERP `MessagesComposeClient`. */
export function OpsEmailComposeClient({
  initial = null,
  replyAllSeed = null,
  expandReplyAll = false,
  fromOptions = [],
  defaultFromKey = "",
  draftId = null,
}: {
  initial?: OpsComposeInitial | null;
  replyAllSeed?: OpsComposeInitial | null;
  expandReplyAll?: boolean;
  fromOptions?: OpsFromOption[];
  defaultFromKey?: string;
  draftId?: string | null;
}) {
  return (
    <div className="min-h-[calc(100dvh-9rem)] bg-surface-muted/35 px-2 py-2 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-xl bg-surface px-2 py-2 sm:rounded-2xl sm:px-10 sm:py-10 lg:px-12 lg:py-11">
          <OpsEmailCompose
            initial={initial}
            replyAllSeed={replyAllSeed}
            expandReplyAll={expandReplyAll}
            fromOptions={fromOptions}
            defaultFromKey={defaultFromKey}
            draftId={draftId}
          />
        </div>
      </div>
    </div>
  );
}
