"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { OpsEmailDeliveryFooter } from "@/components/ops-email/ops-email-delivery-footer";
import { OpsEmailMessageHistory } from "@/components/ops-email/ops-email-message-history";
import { OpsEmailThreadToolbar } from "@/components/ops-email/ops-email-thread-toolbar";
import { inboundToHistory, outboundToHistory } from "@/lib/ops-email/thread-history";
import type { OpsEmailFolder } from "@/lib/ops-email/folders";
import type { OpsMailboxMessage } from "@/lib/ops-email/mailbox-message";
import { Tooltip } from "@/components/ui/tooltip";
import { useT } from "@/lib/i18n/client";

const OPS_COMPOSE = "/dashboard/email/nuevo";

const readPaneHeaderClass =
  "sticky top-0 z-10 flex flex-wrap items-start gap-2 border-b border-border bg-surface/95 px-3 pt-3 pb-2.5 backdrop-blur-sm sm:px-5 sm:pt-5 sm:pb-3.5";

export function OpsEmailReadingPane({
  message,
  folder,
  viewerEmail = "",
  isFavorite = false,
  onToggleFavorite,
  onMoveToTrash,
  onBack,
  loading = false,
}: {
  message: OpsMailboxMessage | null;
  folder: OpsEmailFolder;
  viewerEmail?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onMoveToTrash?: () => void;
  /** Phone only: returns to the message list (the pane replaces it). */
  onBack?: () => void;
  loading?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const openHint = t.opsEmail.openMessage;

  function openCompose() {
    if (!message) return;
    if (message.kind === "inbound") {
      router.push(`${OPS_COMPOSE}?reply=${encodeURIComponent(message.id)}`);
      return;
    }
    router.push(`${OPS_COMPOSE}?replySent=${encodeURIComponent(message.id)}`);
  }

  function openReplyAll() {
    if (!message || message.kind !== "inbound") return;
    router.push(`${OPS_COMPOSE}?reply=${encodeURIComponent(message.id)}&mode=replyAll`);
  }

  function openForward() {
    if (!message || message.kind !== "inbound") return;
    router.push(`${OPS_COMPOSE}?forward=${encodeURIComponent(message.id)}`);
  }

  if (!message && !loading) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-center px-4 text-center">
        <div>
          <p className="text-sm font-semibold text-foreground">{t.opsEmail.emptyMessages}</p>
          <p className="mt-1 text-xs font-medium text-foreground/50">{t.opsEmail.emptyMessagesBody}</p>
        </div>
      </div>
    );
  }

  if (loading || !message) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-center text-foreground/40">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const history =
    message.kind === "inbound" ? [inboundToHistory(message)] : [outboundToHistory(message)];

  const viewer = viewerEmail.trim().toLowerCase();
  const isLatestMine =
    message.kind === "outbound" &&
    viewer.length > 0 &&
    message.actorEmail.trim().toLowerCase() === viewer;

  const deliveryFooter =
    message.kind === "outbound" ? (
      <OpsEmailDeliveryFooter
        recipientLabel={message.toEmail}
        delivered={message.status === "sent"}
        failed={message.status === "failed"}
        errorMessage={message.errorMessage}
      />
    ) : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Phone: the reader replaces the list, so it needs its own way back. */}
      <div className="flex items-center gap-1 border-b border-border/60 px-2 py-1.5 lg:hidden">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-brand-700 active:bg-surface-muted dark:text-brand-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.opsEmail.backToList}
        </button>
      </div>

      <header className={readPaneHeaderClass}>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="min-w-0 text-base font-semibold leading-snug text-foreground sm:text-lg">
            {message.subject}
          </h2>
          <OpsEmailThreadToolbar
            message={message}
            folder={folder}
            isFavorite={isFavorite}
            onToggleFavorite={() => onToggleFavorite?.()}
            onMoveToTrash={() => onMoveToTrash?.()}
            onOpenCompose={openCompose}
            onOpenReplyAll={openReplyAll}
            onOpenForward={openForward}
          />
        </div>
      </header>

      <Tooltip
        content={openHint}
        placement="bottom"
        className="flex min-h-0 min-w-0 flex-1 flex-col"
      >
        <article
          className="flex-1 cursor-pointer overflow-y-auto overscroll-contain px-3 py-4 [-webkit-overflow-scrolling:touch] sm:px-5 sm:py-5 hover:bg-surface-muted/20"
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest("button, a, input, [role='menu']")) return;
            openCompose();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openCompose();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <OpsEmailMessageHistory
            messages={history}
            subject={message.subject}
            isLatestMine={isLatestMine}
            deliveryFooter={deliveryFooter}
          />
        </article>
      </Tooltip>
    </div>
  );
}
