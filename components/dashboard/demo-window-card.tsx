"use client";

import { useActionState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import {
  extendDemoWindowAction,
  type DemoWindowActionState,
} from "@/lib/dashboard/demo-window-actions";
import { formatTenantDate } from "@/lib/domain";

/**
 * Extend the guided-demo evaluation window for schools in `demo` or
 * `demo_expired`. Calls the ERP ops API; audit is written from Ops.
 */
export function DemoWindowCard({
  tenantId,
  status,
  demoEndsAt,
  demoHint,
}: {
  tenantId: string;
  status: string;
  demoEndsAt: string | null;
  demoHint?: string;
}) {
  const [state, action, pending] = useActionState<
    DemoWindowActionState,
    FormData
  >(extendDemoWindowAction, null);

  const isDemoLifecycle = status === "demo" || status === "demo_expired";
  if (!isDemoLifecycle) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
          <CalendarClock size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Guided demo window</p>
          <p className="mt-0.5 text-xs text-foreground/55">
            Extend the evaluation period (1–30 days). Reopens full access if the
            demo had expired.
          </p>
          <p className="mt-2 text-xs font-medium text-foreground/70">
            Demo ends:{" "}
            <span className="font-semibold text-foreground">
              {demoEndsAt ? formatTenantDate(demoEndsAt) : "—"}
            </span>
            {demoHint ? (
              <span className="text-foreground/50"> · {demoHint}</span>
            ) : null}
          </p>

          <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="tenantId" value={tenantId} />
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/45">
                Extra days
              </span>
              <input
                name="extraDays"
                type="number"
                min={1}
                max={30}
                defaultValue={7}
                required
                className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm font-medium text-foreground"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-4 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : null}
              Extend demo
            </button>
          </form>

          {state && "error" in state ? (
            <p className="mt-2 text-xs font-medium text-error">{state.error}</p>
          ) : null}
          {state && "ok" in state ? (
            <p className="mt-2 text-xs font-medium text-success">{state.ok}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
