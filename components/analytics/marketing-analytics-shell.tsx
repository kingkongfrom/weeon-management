"use client";

import { useRouter } from "next/navigation";
import { MarketingGeoDashboard } from "@/components/analytics/marketing-geo-map";
import type {
  MarketingAnalyticsRange,
  MarketingAnalyticsSnapshot,
} from "@/lib/platform/marketing-analytics";

export function MarketingAnalyticsShell({
  snapshot,
  rangeDays,
}: {
  snapshot: MarketingAnalyticsSnapshot;
  rangeDays: MarketingAnalyticsRange;
}) {
  const router = useRouter();

  function onRangeChange(days: MarketingAnalyticsRange) {
    router.push(`/dashboard?range=${days}`);
  }

  return (
    <MarketingGeoDashboard
      snapshot={snapshot}
      rangeDays={rangeDays}
      onRangeChange={onRangeChange}
    />
  );
}
