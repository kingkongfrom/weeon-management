import { Building2 } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";
import type { SchoolActivityEntry } from "@/lib/platform/school-activity";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function actorLine(entry: SchoolActivityEntry): string {
  if (entry.actorName && entry.actorEmail) {
    return `${entry.actorName} · ${entry.actorEmail}`;
  }
  if (entry.actorName) return entry.actorName;
  if (entry.actorEmail) return entry.actorEmail;
  return "School admin (actor not recorded)";
}

/** School ERP actions — roster, users — for liability / support (not Weeon Ops staff). */
export function SchoolActivityCard({ entries }: { entries: SchoolActivityEntry[] }) {
  return (
    <SectionCard
      title="School activity"
      description={
        entries.length > 0
          ? "Chronological audit from the school ERP: sign-in/out, teachers, students, groups, and new users."
          : "Sign-in/out and roster changes from app.weeon.school appear here after hosted migration 20261011210000 and the next ERP deploy."
      }
      icon={<Building2 size={16} />}
      tone="accent"
    >
      {entries.length === 0 ? (
        <p className="px-4 py-4 text-sm font-medium text-foreground/45 sm:px-5">
          No school-side events recorded yet. New teachers, students, and groups are logged
          automatically once hosted migrations include{" "}
          <code className="text-xs">20261011210000_school_activity_roster_audit.sql</code>.
        </p>
      ) : (
        <ol className="divide-y divide-border/60">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-surface-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-foreground/50">
                  {entry.eventType}
                </span>
                <time className="text-xs text-foreground/40">{formatWhen(entry.createdAt)}</time>
              </div>
              <p className="text-sm font-semibold text-foreground">{entry.summary}</p>
              <p className="text-xs font-medium text-foreground/50">{actorLine(entry)}</p>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
