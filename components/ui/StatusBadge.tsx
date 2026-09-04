import { cn } from "@/lib/cn";
import type { TenantStatus } from "@/lib/domain";

const toneByStatus: Record<TenantStatus, string> = {
  active: "bg-success-subtle text-success",
  trial: "bg-trial-subtle text-trial",
  past_due: "bg-warning-subtle text-warning",
  suspended: "bg-error-subtle text-error",
};

export function StatusBadge({ status }: { status: string }) {
  const tone =
    toneByStatus[status as TenantStatus] ?? "bg-surface-muted text-foreground/70";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        tone,
      )}
    >
      {status.replace("_", "-")}
    </span>
  );
}
