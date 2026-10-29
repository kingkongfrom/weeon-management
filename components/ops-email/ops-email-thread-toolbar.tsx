"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import Link from "next/link";
import { Forward, Loader2, Printer, Reply, ReplyAll, Star, Trash2 } from "lucide-react";
import { OpsEmailActionBar } from "@/components/ops-email/ops-email-action-bar";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import type { OpsEmailFolder } from "@/lib/ops-email/folders";
import type { OpsMailboxMessage } from "@/lib/ops-email/mailbox-message";

const iconBtn =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-foreground/55 transition-colors hover:border-border hover:bg-surface-muted hover:text-foreground disabled:opacity-45";

const OPS_COMPOSE = "/dashboard/email/nuevo";

function IconTooltip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip content={label} placement="bottom">
      {children}
    </Tooltip>
  );
}

export function OpsEmailThreadToolbar({
  message,
  folder,
  isFavorite,
  busy = false,
  onToggleFavorite,
  onMoveToTrash,
  onOpenCompose,
  onOpenReplyAll,
  onOpenForward,
}: {
  message: OpsMailboxMessage;
  folder: OpsEmailFolder;
  isFavorite: boolean;
  busy?: boolean;
  onToggleFavorite: () => void;
  onMoveToTrash: () => void;
  onOpenCompose: () => void;
  onOpenReplyAll: () => void;
  onOpenForward: () => void;
}) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inTrash = folder === "trash";
  const favoriteLabel = isFavorite ? t.opsEmail.removedFromFavorites : t.opsEmail.addedToFavorites;
  const isInbound = message.kind === "inbound";

  const replyHref =
    isInbound
      ? `${OPS_COMPOSE}?reply=${encodeURIComponent(message.id)}`
      : `${OPS_COMPOSE}?replySent=${encodeURIComponent(message.id)}`;
  const replyAllHref = isInbound
    ? `${OPS_COMPOSE}?reply=${encodeURIComponent(message.id)}&mode=replyAll`
    : null;
  const forwardHref = isInbound ? `${OPS_COMPOSE}?forward=${encodeURIComponent(message.id)}` : null;

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      {busy ? (
        <span className="inline-flex h-10 w-10 items-center justify-center text-foreground/35">
          <Loader2 className="h-5 w-5 animate-spin" />
        </span>
      ) : null}

      {!inTrash ? (
        <OpsEmailActionBar
          onReply={onOpenCompose}
          onReplyAll={onOpenReplyAll}
          onForward={onOpenForward}
          showReplyAll={isInbound}
          showForward={isInbound}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-1">
        {!inTrash ? (
          <IconTooltip label={favoriteLabel}>
            <button
              type="button"
              className={cn(iconBtn, isFavorite && "text-amber-500 hover:text-amber-600")}
              aria-label={favoriteLabel}
              disabled={busy}
              onClick={onToggleFavorite}
            >
              <Star className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </IconTooltip>
        ) : null}

        {!inTrash ? (
          <IconTooltip label={t.opsEmail.moveToTrash}>
            <button
              type="button"
              className={cn(iconBtn, "hover:border-error/30 hover:bg-error/10 hover:text-error")}
              disabled={busy}
              onClick={onMoveToTrash}
              aria-label={t.opsEmail.moveToTrash}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </IconTooltip>
        ) : null}

        <div ref={menuRef} className="relative">
          <IconTooltip label={t.common.moreActions}>
            <button
              type="button"
              className={iconBtn}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={t.common.moreActions}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <KebabIcon />
            </button>
          </IconTooltip>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-1.5 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg"
            >
              <Link
                role="menuitem"
                href={replyHref}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground/80 hover:bg-surface-muted"
                onClick={() => setMenuOpen(false)}
              >
                <Reply className="h-4 w-4 shrink-0" />
                {t.opsEmail.replyAction}
              </Link>
              {replyAllHref ? (
                <Link
                  role="menuitem"
                  href={replyAllHref}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground/80 hover:bg-surface-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  <ReplyAll className="h-4 w-4 shrink-0" />
                  {t.opsEmail.replyAll}
                </Link>
              ) : null}
              {forwardHref ? (
                <Link
                  role="menuitem"
                  href={forwardHref}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground/80 hover:bg-surface-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  <Forward className="h-4 w-4 shrink-0" />
                  {t.opsEmail.forward}
                </Link>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground/80 hover:bg-surface-muted"
                onClick={() => {
                  setMenuOpen(false);
                  window.print();
                }}
              >
                <Printer className="h-4 w-4 shrink-0" />
                {t.opsEmail.printThread}
              </button>
              {!inTrash ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground/80 hover:bg-surface-muted"
                  onClick={() => {
                    setMenuOpen(false);
                    onMoveToTrash();
                  }}
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  {t.opsEmail.moveToTrash}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function KebabIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="12" cy="19" r="2.5" />
    </svg>
  );
}
