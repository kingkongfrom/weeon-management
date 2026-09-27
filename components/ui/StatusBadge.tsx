import { cn } from "@/lib/cn";
import type { TenantStatus } from "@/lib/domain";

const toneByStatus: Record<TenantStatus, string> = {
  active: "bg-success-subtle text-success",
  demo: "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300",
  demo_expired: "bg-warning-subtle text-warning",
  trial: "bg-trial-subtle text-trial",
  trial_expired: "bg-warning-subtle text-warning",
  past_due: "bg-warning-subtle text-warning",
  suspended: "bg-error-subtle text-error",
};

const LABEL_BY_STATUS: Partial<Record<TenantStatus, string>> = {
  demo_expired: "demo expired",
  trial_expired: "trial expired",
  past_due: "past due",
  suspended: "suspended",
};

/**
 * Lifecycle pill. `suspendReason` splits a suspension at a glance: a payment
 * hold (set automatically by the billing system) reads "suspended · payment",
 * while an ops hold reads "suspended · manual".
 */
export function StatusBadge({
  status,
  suspendReason,
}: {
  status: string;
  suspendReason?: string | null;
}) {
  const tone =
    toneByStatus[status as TenantStatus] ?? "bg-surface-muted text-foreground/70";
  const base =
    LABEL_BY_STATUS[status as TenantStatus] ?? status.replace("_", "-");
  const label =
    status === "suspended" && suspendReason
      ? `${base} · ${suspendReason === "delinquency" ? "payment" : "manual"}`
      : base;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        tone,
      )}
    >
      {label}
    </span>
  );
}
