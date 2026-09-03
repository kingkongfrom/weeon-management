import { cn } from "@/lib/cn";
import type { TenantStatus } from "@/lib/domain";

const toneByStatus: Record<TenantStatus, string> = {
  active: "bg-ok-soft text-ok",
  trial: "bg-trial-soft text-trial",
  past_due: "bg-warn-soft text-warn",
  suspended: "bg-danger-soft text-danger",
};

export function StatusBadge({ status }: { status: string }) {
  const tone =
    toneByStatus[status as TenantStatus] ??
    "bg-paper-2 text-ink-2";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        tone,
      )}
    >
      {status.replace("_", "-")}
    </span>
  );
}
