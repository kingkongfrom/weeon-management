"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MarketingVisitorsMap } from "@/components/analytics/marketing-visitors-map";
import { DEFAULT_MAP_STYLE_PRESET } from "@/lib/analytics/map-style-presets";
import { countryLabel, regionLabel } from "@/lib/analytics/country-labels";
import {
  TONE_CARD,
  TONE_COUNT,
  TONE_CYCLE,
  TONE_LABEL,
  TONE_RING,
  TONE_WASH,
  type Tone,
} from "@/lib/analytics/tone-palette";
import type {
  MarketingAnalyticsSnapshot,
  MarketingAnalyticsRange,
} from "@/lib/platform/marketing-analytics";

type Props = {
  snapshot: MarketingAnalyticsSnapshot;
  rangeDays: MarketingAnalyticsRange;
  onRangeChange: (days: MarketingAnalyticsRange) => void;
};

function SectionHeader({
  tone,
  title,
  subtitle,
}: {
  tone: Tone;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-w-0">
      <h3 className={`text-sm font-bold ${TONE_LABEL[tone]}`}>{title}</h3>
      {subtitle ? (
        <p className="mt-0.5 truncate text-xs font-medium text-foreground/50">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function Card({
  tone,
  children,
  className = "",
}: {
  tone: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl p-5 ${TONE_CARD[tone]} ${TONE_RING[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

export function MarketingGeoDashboard({
  snapshot,
  rangeDays,
  onRangeChange,
}: Props) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCountry) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCountry(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCountry]);

  const viewsByCountry = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of snapshot.byCountry) {
      m.set(row.countryCode.toUpperCase(), row.views);
    }
    return m;
  }, [snapshot.byCountry]);

  const maxViews = useMemo(() => {
    const values = snapshot.byCountry.map((c) => c.views);
    return Math.max(1, ...values, 0);
  }, [snapshot.byCountry]);

  const regionsForSelection = useMemo(() => {
    if (!selectedCountry) return [];
    return snapshot.byRegion.filter(
      (r) => r.countryCode.toUpperCase() === selectedCountry,
    );
  }, [selectedCountry, snapshot.byRegion]);

  const countryRows = selectedCountry
    ? snapshot.byCountry.filter(
        (c) => c.countryCode.toUpperCase() === selectedCountry,
      )
    : snapshot.byCountry.slice(0, 10);

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
      <section className="relative w-full min-w-0 lg:w-[585px] lg:shrink-0">
        {selectedCountry ? (
          <button
            type="button"
            onClick={() => setSelectedCountry(null)}
            title="Clear selection (Esc)"
            className="absolute right-3 top-3 z-10 rounded-full border border-border bg-surface/90 px-3 py-1.5 text-xs font-semibold text-foreground/70 shadow-sm backdrop-blur transition-colors hover:bg-surface hover:text-foreground"
          >
            Clear selection
          </button>
        ) : null}

        <MarketingVisitorsMap
          viewsByCountry={viewsByCountry}
          maxViews={maxViews}
          preset="latam"
          stylePreset={DEFAULT_MAP_STYLE_PRESET}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
        />
      </section>

      <aside className="flex w-full flex-col gap-4 lg:w-[360px] lg:shrink-0">
        <div className="inline-flex w-full rounded-full bg-surface-muted p-1">
          {([7, 30, 90] as const).map((days) => {
            const active = rangeDays === days;
            return (
              <button
                key={days}
                type="button"
                onClick={() => onRangeChange(days)}
                aria-pressed={active}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-all ${
                  active
                    ? "bg-surface text-[#124785] shadow-sm dark:text-[#bfdbfe]"
                    : "text-foreground/55 hover:text-foreground"
                }`}
              >
                {days}d
              </button>
            );
          })}
        </div>

        <Card tone="purple">
          <SectionHeader
            tone="purple"
            title={selectedCountry ? countryLabel(selectedCountry) : "Top countries"}
            subtitle={selectedCountry ? "Drill-down" : "Views by country"}
          />
          {countryRows.length === 0 ? (
            <p className="mt-4 text-sm font-medium text-foreground/45">
              No views recorded yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {countryRows.map((row, index) => {
                const code = row.countryCode.toUpperCase();
                const tone = TONE_CYCLE[index % TONE_CYCLE.length];
                return (
                  <li key={code}>
                    <button
                      type="button"
                      onClick={() => setSelectedCountry(code)}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-transform hover:scale-[1.01] ${TONE_WASH[tone]}`}
                    >
                      <span
                        className={`truncate text-sm font-semibold ${TONE_LABEL[tone]}`}
                      >
                        {countryLabel(row.countryCode)}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${TONE_COUNT[tone]}`}
                      >
                        {row.views.toLocaleString()}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {selectedCountry ? (
          <Card tone="rose">
            <SectionHeader
              tone="rose"
              title="Provinces / regions"
              subtitle="Subdivisions of the selected country"
            />
            {regionsForSelection.length === 0 ? (
              <p className="mt-4 text-sm font-medium text-foreground/45">
                No subdivision data yet (edge must send region codes).
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {regionsForSelection.map((row) => (
                  <li
                    key={`${row.countryCode}-${row.regionCode}`}
                    className={`flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 ${TONE_WASH.rose}`}
                  >
                    <span className={`truncate text-sm font-semibold ${TONE_LABEL.rose}`}>
                      {regionLabel(row.regionCode)}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${TONE_COUNT.rose}`}
                    >
                      {row.views.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}

        <Card tone="green">
          <SectionHeader
            tone="green"
            title="Top pages"
            subtitle="Most visited paths"
          />
          {snapshot.topPaths.length === 0 ? (
            <p className="mt-4 text-sm font-medium text-foreground/45">No data yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {snapshot.topPaths.map((row) => (
                <li
                  key={row.path}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 ${TONE_WASH.green}`}
                >
                  <span className={`truncate text-sm font-semibold ${TONE_LABEL.green}`}>
                    {row.path}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${TONE_COUNT.green}`}
                  >
                    {row.views.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </aside>
    </div>
  );
}
