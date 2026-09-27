"use client";

import { useActionState } from "react";
import { CirclePause, CirclePlay, Loader2 } from "lucide-react";
import {
  setTenantStatusAction,
  type TenantStatusActionState,
} from "@/lib/dashboard/tenant-status-actions";
import type { TenantStatusAction } from "@/lib/platform/tenant-status";

/**
 * Suspend / reactivate control. Rendered as an inline footer band (no card
 * shell) so it can live inside the People section instead of being its own box.
 * Trial/demo transitions stay lifecycle-driven and are not offered here.
 *
 * This button performs a **manual** hold only. A delinquency (payment) hold is
 * set automatically by the billing system — Ops never chooses it by hand.
 */
export function SchoolStatusControl({
  tenantId,
  status,
  suspendReason,
  readOnlyOn,
  variant = "band",
}: {
  tenantId: string;
  status: string;
  /** Raw `tenants.suspend_reason`, when currently suspended. */
  suspendReason?: string | null;
  /** Preformatted date the hold becomes read-only, when set. */
  readOnlyOn?: string | null;
  /**
   * `band` — full-width strip with a title + description (inline sections).
   * `hero` — compact, no chrome: a state hint plus the button, for the school
   * page header where the surrounding hero already carries the identity.
   */
  variant?: "band" | "hero";
}) {
  const [state, action, pending] = useActionState<
    TenantStatusActionState,
    FormData
  >(setTenantStatusAction, null);

  const suspended = status === "suspended";
  const nextAction: TenantStatusAction = suspended ? "reactivate" : "suspend";
  const currentReason =
    suspendReason === "manual"
      ? "manual"
      : suspendReason === "delinquency"
        ? "delinquency"
        : null;

  const description = suspended
    ? currentReason === "delinquency"
      ? readOnlyOn
        ? `Payment hold (set by billing) — read-only on ${readOnlyOn}.`
        : "Payment hold (set by billing) — currently read-only."
      : "Manual hold — users can read but not edit."
    : "Suspending is a manual hold: users can read but not edit until you reactivate.";

  if (variant === "hero") {
    return (
      <div className="flex flex-col items-start gap-1.5 sm:items-end">
        {state?.error ? (
          <span className="text-xs font-medium text-error">{state.error}</span>
        ) : null}
        {state?.ok ? (
          <span className="text-xs font-medium text-success">{state.ok}</span>
        ) : null}
        <form action={action}>
          <input type="hidden" name="tenantId" value={tenantId} />
          <input type="hidden" name="action" value={nextAction} />
          <input type="hidden" name="reason" value="manual" />
          <button
            type="submit"
            disabled={pending}
            title={description}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 ${
              suspended ? "bg-brand-600" : "bg-error"
            }`}
          >
            {pending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : suspended ? (
              <CirclePlay size={14} />
            ) : (
              <CirclePause size={14} />
            )}
            {suspended ? "Reactivate school" : "Suspend school"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-muted/40 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">
          {suspended
            ? currentReason === "delinquency"
              ? "School is suspended (payment)"
              : "School is suspended (manual)"
            : "Access control"}
        </p>
        <p className="mt-0.5 text-xs text-foreground/55">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {state?.error ? (
          <span className="text-xs font-medium text-error">{state.error}</span>
        ) : null}
        <form action={action}>
          <input type="hidden" name="tenantId" value={tenantId} />
          <input type="hidden" name="action" value={nextAction} />
          {/* Ops suspend is always a manual hold; delinquency is automatic. */}
          <input type="hidden" name="reason" value="manual" />
          <button
            type="submit"
            disabled={pending}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 ${
              suspended ? "bg-brand-600" : "bg-error"
            }`}
          >
            {pending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : suspended ? (
              <CirclePlay size={14} />
            ) : (
              <CirclePause size={14} />
            )}
            {suspended ? "Reactivate" : "Suspend"}
          </button>
        </form>
      </div>
    </div>
  );
}
