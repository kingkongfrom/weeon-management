import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketingAnalyticsShell } from "@/components/analytics/marketing-analytics-shell";
import { AnalyticsPageSkeleton } from "@/components/dashboard/skeleton";
import {
  loadMarketingAnalytics,
  type MarketingAnalyticsRange,
} from "@/lib/platform/marketing-analytics";

export const metadata: Metadata = {
  title: "Analytics",
};

function parseRange(value: string | undefined): MarketingAnalyticsRange {
  if (value === "7" || value === "90") return Number(value) as MarketingAnalyticsRange;
  return 30;
}

async function AnalyticsContent({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const rangeDays = parseRange(params.range);
  const snapshot = await loadMarketingAnalytics(rangeDays);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header>
        <h1 className="brand-page-title text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Marketing analytics
        </h1>
        <p className="mt-1 text-sm font-medium text-foreground/55">
          Geographic traffic on{" "}
          <span className="font-semibold text-foreground/70">weeon.school</span>.
        </p>
        {snapshot.reason ? (
          <p className="mt-3 rounded-xl border border-warning/30 bg-warning-subtle px-4 py-3 text-sm font-medium text-warning">
            {snapshot.reason}
          </p>
        ) : null}
      </header>

      <MarketingAnalyticsShell snapshot={snapshot} rangeDays={rangeDays} />
    </div>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  return (
    <Suspense fallback={<AnalyticsPageSkeleton />}>
      <AnalyticsContent searchParams={searchParams} />
    </Suspense>
  );
}
