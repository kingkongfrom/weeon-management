import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";
import { LATAM_COUNTRY_CODES } from "@/lib/analytics/latam";

export type MarketingAnalyticsRange = 7 | 30 | 90;

export type MarketingCountryViews = {
  countryCode: string;
  views: number;
};

export type MarketingRegionViews = {
  countryCode: string;
  regionCode: string;
  views: number;
};

export type MarketingPathViews = {
  path: string;
  views: number;
};

export type MarketingAnalyticsSnapshot = {
  rangeDays: MarketingAnalyticsRange;
  totalViews: number;
  latamViews: number;
  unknownGeoViews: number;
  byCountry: MarketingCountryViews[];
  byRegion: MarketingRegionViews[];
  topPaths: MarketingPathViews[];
  reason?: string;
};

type PageViewRow = {
  country_code: string | null;
  region_code: string | null;
  path: string;
};

const platformConfigured = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

const MIGRATION_HINT =
  "Apply weeon-tenants migration supabase/migrations/20260926120000_marketing_site_page_views.sql on the hosted DB (see weeon-tenants/docs/platform-hygiene.md).";

function isMissingMarketingViewsTable(error: {
  code?: string;
  message?: string;
}): boolean {
  const code = error.code ?? "";
  const blob = `${code} ${error.message ?? ""}`;
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    /Could not find the table|schema cache|marketing_site_page_views.*does not exist/i.test(
      blob,
    )
  );
}

function sinceIso(days: MarketingAnalyticsRange): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export async function loadMarketingAnalytics(
  rangeDays: MarketingAnalyticsRange = 30,
): Promise<MarketingAnalyticsSnapshot> {
  const empty: MarketingAnalyticsSnapshot = {
    rangeDays,
    totalViews: 0,
    latamViews: 0,
    unknownGeoViews: 0,
    byCountry: [],
    byRegion: [],
    topPaths: [],
  };

  if (!platformConfigured()) {
    return {
      ...empty,
      reason:
        "Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const client = createPlatformClient();
  const { data, error } = await client
    .from("marketing_site_page_views")
    .select("country_code, region_code, path")
    .gte("viewed_at", sinceIso(rangeDays))
    .limit(50_000);

  if (error) {
    if (isMissingMarketingViewsTable(error)) {
      return {
        ...empty,
        reason: `Marketing analytics table is not on the hosted database yet. ${MIGRATION_HINT}`,
      };
    }
    throw new Error(`Marketing analytics read failed: ${error.message}`);
  }

  const rows = (data ?? []) as PageViewRow[];
  const countryMap = new Map<string, number>();
  const regionMap = new Map<string, MarketingRegionViews>();
  const pathMap = new Map<string, number>();
  let latamViews = 0;
  let unknownGeoViews = 0;

  for (const row of rows) {
    const cc = row.country_code?.toUpperCase() ?? null;
    if (!cc) {
      unknownGeoViews += 1;
    } else {
      countryMap.set(cc, (countryMap.get(cc) ?? 0) + 1);
      if (LATAM_COUNTRY_CODES.has(cc)) latamViews += 1;
    }

    if (cc && row.region_code) {
      const key = `${cc}|${row.region_code}`;
      const existing = regionMap.get(key);
      if (existing) {
        existing.views += 1;
      } else {
        regionMap.set(key, {
          countryCode: cc,
          regionCode: row.region_code,
          views: 1,
        });
      }
    }

    pathMap.set(row.path, (pathMap.get(row.path) ?? 0) + 1);
  }

  const byCountry = [...countryMap.entries()]
    .map(([countryCode, views]) => ({ countryCode, views }))
    .sort((a, b) => b.views - a.views);

  const byRegion = [...regionMap.values()].sort((a, b) => b.views - a.views);

  const topPaths = [...pathMap.entries()]
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);

  return {
    rangeDays,
    totalViews: rows.length,
    latamViews,
    unknownGeoViews,
    byCountry,
    byRegion,
    topPaths,
  };
}
