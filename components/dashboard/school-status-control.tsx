"use client";

import { useActionState, useState } from "react";
import { CirclePause, CirclePlay, Loader2 } from "lucide-react";
import {
  setTenantStatusAction,
  type TenantStatusActionState,
} from "@/lib/dashboard/tenant-status-actions";

/**
 * Suspend / reactivate a whole school.
 *
 * This is a high-consequence, low-frequency action, so it lives in the school
 * page's Danger zone and **suspending requires a confirmation step**: nothing is
 * submitted on the first click. Reactivating is restorative and stays one click
 * — restore service, don't slow it down.
 *
 * Ops only performs a **manual** hold; a delinquency (payment) hold is set
 * automatically by the billing system and never chosen here.
 */
export function SchoolStatusControl({
  tenantId,
  status,
  suspendReason,
  readOnlyOn,
}: {
  tenantId: string;
  status: string;
  /** Raw `tenants.suspend_reason`, when currently suspended. */
  suspendReason?: string | null;
  /** Preformatted date the hold becomes read-only, when set. */
  readOnlyOn?: string | null;
}) {
  const [state, action, pending] = useActionState<
    TenantStatusActionState,
    FormData
  >(setTenantStatusAction, null);
  const [confirming, setConfirming] = useState(false);

  const suspended = status === "suspended";
  const currentReason =
    suspendReason === "manual"
      ? "manual"
      : suspendReason === "delinquency"
        ? "delinquency"
        : null;

  const stateLabel = suspended
    ? currentReason === "delinquency"
      ? "Suspended (payment hold)"
      : "Suspended (manual hold)"
    : "Active";

  const description = suspended
    ? currentReason === "delinquency"
      ? readOnlyOn
        ? `Set by billing. Read-only on ${readOnlyOn}.`
        : "Set by billing. Currently read-only."
      : "Users can read but not edit until you reactivate."
    : "Suspending blocks editing for every user at this school until you reactivate. Users keep read access.";

  return (
    <div className="border-t border-border/60 bg-error-subtle/30 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground/55">
            {suspended ? "Suspended" : "Suspend school"}
          </p>
          <p className="mt-0.5 text-xs font-medium text-foreground/55">
            {stateLabel} — {description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {state?.error ? (
            <span className="text-xs font-medium text-error">{state.error}</span>
          ) : null}
          {state?.ok ? (
            <span className="text-xs font-medium text-success">{state.ok}</span>
          ) : null}

          {/* Reactivate: one click, no confirmation. */}
          {suspended ? (
            <form action={action}>
              <input type="hidden" name="tenantId" value={tenantId} />
              <input type="hidden" name="action" value="reactivate" />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CirclePlay size={14} />
                )}
                Reactivate school
              </button>
            </form>
          ) : !confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-error/40 bg-surface px-3.5 py-2 text-xs font-semibold text-error transition-colors hover:bg-error-subtle"
            >
              <CirclePause size={14} />
              Suspend school
            </button>
          ) : null}
        </div>
      </div>

      {/* Confirmation step — suspension is never a single click. */}
      {!suspended && confirming ? (
        <form
          action={action}
          className="mt-3 rounded-xl border border-error/30 bg-surface p-3"
        >
          <input type="hidden" name="tenantId" value={tenantId} />
          <input type="hidden" name="action" value="suspend" />
          {/* Ops suspend is always a manual hold; delinquency is automatic. */}
          <input type="hidden" name="reason" value="manual" />
          <p className="text-xs font-medium text-foreground/70">
            Suspend this school? Every user will lose edit access immediately and
            keep read access only. You can reactivate at any time.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-error px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
            >
              {pending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CirclePause size={14} />
              )}
              Yes, suspend school
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-foreground/60 transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
