"use client";

import { Forward, Reply, ReplyAll } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

const iconClass =
  "h-[1.5rem] w-[1.5rem] shrink-0 stroke-[2.25] text-[#5e25cc] dark:text-[#a78bfa]";

const chipBtn =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-surface-muted/40 text-foreground/80 transition-colors hover:border-border hover:bg-surface-muted hover:text-foreground";

export function OpsEmailActionBar({
  onReply,
  onReplyAll,
  onForward,
  showReplyAll = true,
  showForward = true,
  className,
}: {
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  showReplyAll?: boolean;
  showForward?: boolean;
  className?: string;
}) {
  const t = useT();

  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <Tooltip content={t.opsEmail.replyAction} placement="bottom">
        <button type="button" onClick={onReply} className={chipBtn} aria-label={t.opsEmail.replyAction}>
          <Reply className={iconClass} aria-hidden />
        </button>
      </Tooltip>
      {showReplyAll ? (
        <Tooltip content={t.opsEmail.replyAll} placement="bottom">
          <button type="button" onClick={onReplyAll} className={chipBtn} aria-label={t.opsEmail.replyAll}>
            <ReplyAll className={iconClass} aria-hidden />
          </button>
        </Tooltip>
      ) : null}
      {showForward ? (
        <Tooltip content={t.opsEmail.forward} placement="bottom">
          <button type="button" onClick={onForward} className={chipBtn} aria-label={t.opsEmail.forward}>
            <Forward className={iconClass} aria-hidden />
          </button>
        </Tooltip>
      ) : null}
    </div>
  );
}
