"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

/** External recipient delivery summary — parity with school read-receipt footer. */
export function OpsEmailDeliveryFooter({
  recipientLabel,
  delivered,
  failed,
  errorMessage,
}: {
  recipientLabel: string;
  delivered: boolean;
  failed?: boolean;
  errorMessage?: string | null;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const summary = failed
    ? t.opsEmail.deliveryFailedSummary
    : t.opsEmail.deliverySentSummary;

  return (
    <div className="mt-8 border-t border-border/60 pt-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex w-full items-center justify-between gap-2 rounded-lg px-1 py-2 text-left text-sm font-semibold text-foreground/55 hover:bg-surface-muted/40 hover:text-foreground/75"
      >
        <span>{summary}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>
      {open ? (
        <ul className="mt-1 divide-y divide-border/60 rounded-lg border border-border/50">
          <li className="flex items-baseline justify-between gap-4 px-3 py-2 text-sm">
            <span className="min-w-0 truncate text-foreground/80">{recipientLabel}</span>
            <span
              className={cn(
                "shrink-0 text-xs font-medium",
                failed ? "text-error" : "text-foreground/45",
              )}
            >
              {failed
                ? errorMessage?.trim() || t.opsEmail.deliveryFailed
                : t.opsEmail.deliveryDelivered}
            </span>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
