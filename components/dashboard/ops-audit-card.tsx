import {
  Boxes,
  CirclePause,
  CirclePlay,
  History,
  UserMinus,
  UserPlus,
} from "lucide-react";
import type { ReactNode } from "react";
import { SectionCard } from "@/components/dashboard/section-card";
import type { TenantOpsAuditEntry } from "@/lib/platform/ops-audit";

type ActionMeta = { label: string; icon: ReactNode; tone: string };

const ACTION_META: Record<string, ActionMeta> = {
  "admin.added": {
    label: "Administrator added",
    icon: <UserPlus size={14} />,
    tone: "bg-success-subtle text-success",
  },
  "admin.removed": {
    label: "Administrator removed",
    icon: <UserMinus size={14} />,
    tone: "bg-error-subtle text-error",
  },
  "module.enabled": {
    label: "Module enabled",
    icon: <Boxes size={14} />,
    tone: "bg-icon-accent-bg text-icon-accent-fg",
  },
  "module.disabled": {
    label: "Module disabled",
    icon: <Boxes size={14} />,
    tone: "bg-surface-muted text-foreground/55",
  },
  "status.suspend": {
    label: "School suspended",
    icon: <CirclePause size={14} />,
    tone: "bg-error-subtle text-error",
  },
  "status.reactivate": {
    label: "School reactivated",
    icon: <CirclePlay size={14} />,
    tone: "bg-success-subtle text-success",
  },
  "status.past_due": {
    label: "Marked past due",
    icon: <CirclePause size={14} />,
    tone: "bg-warning-subtle text-warning",
  },
  "status.active": {
    label: "Marked active",
    icon: <CirclePlay size={14} />,
    tone: "bg-success-subtle text-success",
  },
  "demo.extended": {
    label: "Demo window extended",
    icon: <History size={14} />,
    tone: "bg-icon-accent-bg text-icon-accent-fg",
  },
};

function metaFor(action: string): ActionMeta {
  return (
    ACTION_META[action] ?? {
      label: action,
      icon: <History size={14} />,
      tone: "bg-surface-muted text-foreground/55",
    }
  );
}

function targetSummary(entry: TenantOpsAuditEntry): string | null {
  if (!entry.target) return null;
  if (entry.action.startsWith("status.")) return null;
  return entry.target;
}

/** Append-only ops audit trail for a school: who changed what, and when. */
export function OpsAuditCard({ entries }: { entries: TenantOpsAuditEntry[] }) {
  return (
    <SectionCard
      title="Ops activity"
      description={
        entries.length > 0
          ? `${entries.length} recorded ${entries.length === 1 ? "action" : "actions"} on this school.`
          : "Every change Ops made to this school."
      }
      icon={<History size={16} />}
      tone="brand"
    >
      {entries.length === 0 ? (
        <p className="px-4 py-4 text-sm font-medium text-foreground/45 sm:px-5">
          No ops actions recorded yet.
        </p>
      ) : (
        <ol className="divide-y divide-border/60">
          {entries.map((entry) => {
            const meta = metaFor(entry.action);
            return (
              <li
                key={entry.id}
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/40 sm:px-5"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${meta.tone}`}
                  aria-hidden
                >
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {meta.label}
                    {targetSummary(entry) ? (
                      <span className="font-medium text-foreground/55">
                        {" · "}
                        {targetSummary(entry)}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-foreground/50">
                    {entry.actorEmail ?? "Unknown staff"}
                  </p>
                </div>
                <time
                  className="shrink-0 text-[11px] font-medium tabular-nums text-foreground/45"
                  dateTime={entry.createdAt}
                >
                  {new Date(entry.createdAt).toLocaleString()}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}
