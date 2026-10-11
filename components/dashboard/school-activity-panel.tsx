"use client";

import { useMemo, useState } from "react";
import { Building2, Filter } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";
import {
  formatOpsDateTime,
  OPS_TIMEZONE_LABEL,
} from "@/lib/datetime/costa-rica";
import { displayActivitySummary } from "@/lib/platform/activity-summary-display";
import type {
  SchoolActivityCategory,
  SchoolActivityEntry,
} from "@/lib/platform/school-activity";
import { matchesActivityCategory } from "@/lib/platform/activity-event-category";
import { Select } from "@/components/ui/select";

/** Okta-style presets — smallest window is 30 minutes, not 7 days. */
export type SchoolActivityTimePreset =
  | "30m"
  | "1h"
  | "24h"
  | "7d"
  | "30d"
  | "90d"
  | "all";

const CATEGORY_OPTIONS: {
  id: SchoolActivityCategory;
  label: string;
  triggerLabel: string;
}[] = [
  { id: "all", label: "All event types", triggerLabel: "All event types" },
  { id: "auth", label: "Sign-in & sign-out", triggerLabel: "Sign-in & sign-out" },
  { id: "teacher", label: "Teachers", triggerLabel: "Teachers" },
  { id: "student", label: "Students", triggerLabel: "Students" },
  { id: "group", label: "Groups", triggerLabel: "Groups" },
  { id: "admin", label: "Administrators", triggerLabel: "Administrators" },
  { id: "fee", label: "Payments & fees", triggerLabel: "Payments & fees" },
];

const TIME_PRESETS: { id: SchoolActivityTimePreset; label: string }[] = [
  { id: "30m", label: "Last 30 minutes" },
  { id: "1h", label: "Last hour" },
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "all", label: "All time" },
];

function actorLine(entry: SchoolActivityEntry): string {
  const parts = [entry.actorName, entry.actorEmail].filter(Boolean);
  return `By ${parts.join(" · ")}`;
}

function presetCutoffMs(preset: SchoolActivityTimePreset): number | null {
  if (preset === "all") return null;
  const now = Date.now();
  switch (preset) {
    case "30m":
      return now - 30 * 60 * 1000;
    case "1h":
      return now - 60 * 60 * 1000;
    case "24h":
      return now - 24 * 60 * 60 * 1000;
    case "7d":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return now - 30 * 24 * 60 * 60 * 1000;
    case "90d":
      return now - 90 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

function matchesPreset(createdAt: string, preset: SchoolActivityTimePreset): boolean {
  const cutoff = presetCutoffMs(preset);
  if (cutoff === null) return true;
  return new Date(createdAt).getTime() >= cutoff;
}

/** School ERP actions — roster, users — for liability / support (not Weeon Ops staff). */
export function SchoolActivityPanel({ entries }: { entries: SchoolActivityEntry[] }) {
  const [category, setCategory] = useState<SchoolActivityCategory>("all");
  const [timePreset, setTimePreset] = useState<SchoolActivityTimePreset>("all");

  const filtered = useMemo(
    () =>
      entries.filter(
        (entry) =>
          matchesActivityCategory(entry.eventType, category) &&
          matchesPreset(entry.createdAt, timePreset),
      ),
    [entries, category, timePreset],
  );

  const activeTimeLabel =
    TIME_PRESETS.find((p) => p.id === timePreset)?.label ?? "All time";

  return (
    <SectionCard
      className="overflow-visible"
      title="School activity"
      description={
        entries.length > 0
          ? "Chronological audit from the school ERP. Filter by time and event type (Okta-style). Every row records who performed the action."
          : "Sign-in/out and roster changes from app.weeon.school appear here after hosted migrations and the next ERP deploy."
      }
      icon={<Building2 size={16} />}
      tone="accent"
    >
      {entries.length > 0 ? (
        <div className="overflow-visible border-b border-border/60 px-4 py-3 sm:px-5">
          <div className="mb-3 flex items-center gap-1.5 text-foreground/45">
            <Filter size={14} aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-wide">Filters</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Time"
              size="md"
              value={timePreset}
              onChange={(value) => setTimePreset(value as SchoolActivityTimePreset)}
              options={TIME_PRESETS.map((opt) => ({ value: opt.id, label: opt.label }))}
              className="min-w-0"
            />
            <Select
              label="Event type"
              size="md"
              value={category}
              onChange={(value) => setCategory(value as SchoolActivityCategory)}
              options={CATEGORY_OPTIONS.map((opt) => ({
                value: opt.id,
                label: opt.label,
                triggerLabel: opt.triggerLabel,
              }))}
              className="min-w-0"
            />
          </div>
          <p className="mt-3 text-xs font-medium text-foreground/45">
            {filtered.length} {filtered.length === 1 ? "event" : "events"} · {activeTimeLabel} ·{" "}
            {OPS_TIMEZONE_LABEL}
          </p>
        </div>
      ) : null}

      {entries.length === 0 ? (
        <p className="px-4 py-4 text-sm font-medium text-foreground/45 sm:px-5">
          No school-side events recorded yet. New teachers, students, and groups are logged
          automatically once hosted migrations include actor compliance (
          <code className="text-xs">20261011220000_activity_actor_compliance.sql</code>
          ).
        </p>
      ) : filtered.length === 0 ? (
        <p className="px-4 py-4 text-sm font-medium text-foreground/45 sm:px-5">
          No events match{" "}
          <span className="text-foreground/65">
            {CATEGORY_OPTIONS.find((c) => c.id === category)?.label ?? category}
          </span>{" "}
          in{" "}
          <span className="text-foreground/65">{activeTimeLabel.toLowerCase()}</span>. Try
          &quot;All event types&quot;, &quot;All time&quot;, or another combination.
        </p>
      ) : (
        <ol className="divide-y divide-border/60">
          {filtered.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-surface-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-foreground/50">
                  {entry.eventType}
                </span>
                <time
                  className="text-xs tabular-nums text-foreground/40"
                  dateTime={entry.createdAt}
                  title={OPS_TIMEZONE_LABEL}
                >
                  {formatOpsDateTime(entry.createdAt)}
                </time>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {displayActivitySummary(entry.summary)}
              </p>
              <p className="text-xs font-medium text-foreground/50">{actorLine(entry)}</p>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
