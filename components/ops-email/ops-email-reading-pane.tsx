"use client";

import Link from "next/link";
import { Reply } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { OpsMailboxMessage } from "@/lib/ops-email/mailbox-message";
import { opsEmailTone } from "@/lib/ops-email/messages-tone";
import { cn } from "@/lib/cn";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function avatarColor(name: string): string {
  const colors = ["bg-[#0f766e]", "bg-[#2563b0]", "bg-[#7c3aed]", "bg-[#d97706]", "bg-[#e11d48]"];
  let hash = 0;
  for (const char of name) hash += char.charCodeAt(0);
  return colors[hash % colors.length] ?? colors[0];
}

export function OpsEmailReadingPane({ message }: { message: OpsMailboxMessage | null }) {
  const t = useT();

  if (!message) {
    return (
      <div className="flex min-w-[24rem] flex-1 items-center justify-center px-8 text-center">
        <div>
          <p className="text-sm font-semibold text-foreground">{t.opsEmail.emptyMessages}</p>
          <p className="mt-1 text-xs font-medium text-foreground/50">{t.opsEmail.emptyMessagesBody}</p>
        </div>
      </div>
    );
  }

  if (message.kind === "inbound") {
    const fromLabel = message.fromEmail;
    const toLine = message.toEmails.join(", ");

    const replyHref = `/dashboard/email/nuevo?reply=${encodeURIComponent(message.id)}`;

    return (
      <article className="min-w-[24rem] flex-1 overflow-y-auto px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="min-w-0 flex-1 text-xl font-semibold text-foreground">{message.subject}</h2>
          <Link
            href={replyHref}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold",
              opsEmailTone.primaryButton,
            )}
          >
            <Reply className="h-4 w-4" />
            {t.opsEmail.replyAction}
          </Link>
        </div>

        <div className="mt-5 flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(fromLabel)}`}
          >
            {fromLabel.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{fromLabel}</p>
              <p className="text-xs text-foreground/45">{formatDate(message.createdAt)}</p>
            </div>
            <p className="mt-0.5 text-xs text-foreground/55">
              <span className="font-semibold">{t.opsEmail.toLabel}:</span> {toLine}
            </p>
            <p className="mt-1 truncate font-mono text-[10px] text-foreground/35">
              Resend {message.resendEmailId}
            </p>
          </div>
        </div>

        {message.bodyHtml ? (
          <div
            className="rte-content mt-6 text-sm leading-relaxed text-foreground/90"
            dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
          />
        ) : (
          <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {message.bodyText}
          </div>
        )}
      </article>
    );
  }

  const fromLabel = message.actorEmail || "Weeon Ops";
  const replyHref = `/dashboard/email/nuevo?replySent=${encodeURIComponent(message.id)}`;

  return (
    <article className="min-w-[24rem] flex-1 overflow-y-auto px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="min-w-0 flex-1 text-xl font-semibold text-foreground">{message.subject}</h2>
        <Link
          href={replyHref}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold",
            opsEmailTone.primaryButton,
          )}
        >
          <Reply className="h-4 w-4" />
          {t.opsEmail.replyAction}
        </Link>
      </div>

      <div className="mt-5 flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(fromLabel)}`}
        >
          {fromLabel.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{fromLabel}</p>
            <p className="text-xs text-foreground/45">{formatDate(message.createdAt)}</p>
          </div>
          <p className="mt-0.5 text-xs text-foreground/55">
            <span className="font-semibold">{t.opsEmail.toLabel}:</span> {message.toEmail}
          </p>
          {message.status === "failed" ? (
            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
              Delivery failed{message.errorMessage ? `: ${message.errorMessage}` : "."}
            </p>
          ) : null}
          {message.resendId ? (
            <p className="mt-1 truncate font-mono text-[10px] text-foreground/35">
              Resend {message.resendId}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {message.bodyText}
      </div>
    </article>
  );
}
