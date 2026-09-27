"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export type SegmentedTab<T extends string> = {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
};

/**
 * Segmented workspace switcher. An animated thumb slides behind the active
 * tab (spring, same motion language as the theme toggle). Falls back to an
 * instant state change under `prefers-reduced-motion`.
 */
export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: readonly SegmentedTab<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === active),
  );
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <div
      role="tablist"
      aria-label="School sections"
      className={cn(
        "relative inline-grid w-full gap-1 rounded-xl border border-border bg-surface-muted p-1 sm:w-auto",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-1 rounded-lg border border-border bg-surface shadow-sm"
        style={{ width: `calc(${100 / tabs.length}% - 0.25rem)` }}
        animate={{ x: `${activeIndex * 100}%` }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 420, damping: 34 }
        }
        initial={false}
      />
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:px-4",
              isActive
                ? "text-foreground"
                : "text-foreground/55 hover:text-foreground",
            )}
          >
            {tab.icon ? (
              <span className="hidden sm:inline" aria-hidden>
                {tab.icon}
              </span>
            ) : null}
            {tab.label}
            {tab.badge !== undefined ? (
              <span
                className={cn(
                  "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  isActive
                    ? "bg-brand-600 text-white dark:bg-brand-500"
                    : "bg-surface text-foreground/50",
                )}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Client wrapper that owns the active-tab state and renders the pane for it.
 * Panes are passed as a map so the server keeps control of the content.
 */
export function SegmentedWorkspace<T extends string>({
  tabs,
  panels,
  initial,
}: {
  tabs: readonly SegmentedTab<T>[];
  panels: Record<T, ReactNode>;
  initial: T;
}) {
  const [active, setActive] = useState<T>(initial);

  return (
    <div className="flex flex-col gap-4">
      <SegmentedTabs tabs={tabs} active={active} onChange={setActive} />
      <div role="tabpanel" className="min-h-[16rem]">
        {panels[active]}
      </div>
    </div>
  );
}
