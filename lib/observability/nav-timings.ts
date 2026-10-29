import "server-only";

import { unstable_cache } from "next/cache";

import { createPlatformClient } from "@/lib/supabase/platform";

/**
 * Teacher-web navigation timings, aggregated for the Ops observability panel.
 *
 * Source: `public.nav_timings` (migration `20261028120000_nav_timings.sql` in
 * weeon-tenants), written by `weeon-teachers /api/telemetry/nav`. Rows are
 * already hourly buckets, so this read is a few hundred rows even for a busy
 * week — no per-click data reaches Ops.
 *
 * Cross-tenant by design: Ops is the only cross-tenant reader, and the client
 * here is the service-role one.
 */
export type NavTimingPhase = {
  /** Wall time for a whole route change, vs. the two aula-virtual phases. */
  phase: "active" | "content" | "navigate";
  /** Weighted mean across the window (sum of durations / samples). */
  avgMs: number;
  p50Ms: number;
  p90Ms: number;
  maxMs: number;
  samples: number;
};

export type NavTimingSeries = {
  surface: string;
  route: string;
  kind: string;
  phases: NavTimingPhase[];
  samples: number;
  /** Worst p90 across the phases, for ranking. */
  worstP90Ms: number;
};

export type NavTimingSnapshot = {
  fetchedAt: string;
  windowDays: number;
  series: NavTimingSeries[];
  totalSamples: number;
  reason?: string;
};

export const NAV_WINDOW_DAYS = 7;

type Row = {
  surface: string;
  route: string;
  kind: string;
  phase: string;
  samples: number;
  sum_ms: number;
  max_ms: number;
  p50_ms: number;
  p90_ms: number;
};

/**
 * Budgets the panel colours against. A subject switch should feel instant; the
 * numbers come from weeon-teachers/docs/aula-virtual.md § Performance.
 */
export const NAV_BUDGET_MS: Record<"active" | "content" | "navigate", number> = {
  active: 50,
  content: 100,
  // A whole screen, not one interaction: the ceiling for a full navigation
  // on school Wi-Fi once it still reads as instant.
  navigate: 300,
};

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

type Bucket = {
  samples: number;
  sum: number;
  max: number;
  p50: number;
  p90: number;
};

/** Folds hourly buckets into one row per (surface, route, kind, phase). */
export function summarizeNavTimings(rows: Row[]): NavTimingSeries[] {
  const perKey = new Map<string, Bucket & { surface: string; route: string; kind: string; phase: string }>();

  for (const row of rows) {
    const key = `${row.surface}|${row.route}|${row.kind}|${row.phase}`;
    const acc = perKey.get(key);
    const samples = Number(row.samples) || 0;
    const sum = Number(row.sum_ms) || 0;
    const max = Number(row.max_ms) || 0;
    const p50 = Number(row.p50_ms) || 0;
    const p90 = Number(row.p90_ms) || 0;

    if (!acc) {
      perKey.set(key, {
        surface: row.surface,
        route: row.route,
        kind: row.kind,
        phase: row.phase,
        samples,
        sum,
        max,
        p50,
        p90,
      });
      continue;
    }
    acc.samples += samples;
    acc.sum += sum;
    acc.max = Math.max(acc.max, max);
    // Weighted mean of the hourly estimates, weighted by their sample counts.
    if (acc.samples > 0) {
      acc.p50 = (acc.p50 * (acc.samples - samples) + p50 * samples) / acc.samples;
      acc.p90 = (acc.p90 * (acc.samples - samples) + p90 * samples) / acc.samples;
    } else {
      acc.p50 = p50;
      acc.p90 = p90;
    }
  }

  const bySeries = new Map<string, NavTimingSeries>();

  for (const bucket of perKey.values()) {
    if (
      bucket.phase !== "active" &&
      bucket.phase !== "content" &&
      bucket.phase !== "navigate"
    ) {
      continue;
    }
    const seriesKey = `${bucket.surface}|${bucket.route}|${bucket.kind}`;
    const series =
      bySeries.get(seriesKey) ??
      ({
        surface: bucket.surface,
        route: bucket.route,
        kind: bucket.kind,
        phases: [],
        samples: 0,
        worstP90Ms: 0,
      } satisfies NavTimingSeries);

    series.phases.push({
      phase: bucket.phase,
      avgMs: round(bucket.samples > 0 ? bucket.sum / bucket.samples : 0),
      p50Ms: round(bucket.p50),
      p90Ms: round(bucket.p90),
      maxMs: round(bucket.max),
      samples: bucket.samples,
    });
    series.samples += bucket.samples;
    series.worstP90Ms = Math.max(series.worstP90Ms, round(bucket.p90));
    bySeries.set(seriesKey, series);
  }

  return [...bySeries.values()]
    .map((series) => ({
      ...series,
      phases: series.phases.sort((a, b) => a.phase.localeCompare(b.phase)),
    }))
    .sort((a, b) => b.worstP90Ms - a.worstP90Ms || b.samples - a.samples);
}

async function computeNavTimingSnapshot(): Promise<NavTimingSnapshot> {
  const fetchedAt = new Date().toISOString();
  const since = new Date(Date.now() - NAV_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  let client;
  try {
    client = createPlatformClient();
  } catch {
    return {
      fetchedAt,
      windowDays: NAV_WINDOW_DAYS,
      series: [],
      totalSamples: 0,
      reason: "Platform Supabase client is not configured.",
    };
  }

  const { data, error } = await client
    .from("nav_timings")
    .select("surface, route, kind, phase, samples, sum_ms, max_ms, p50_ms, p90_ms")
    .gte("bucket_start", since)
    .order("bucket_start", { ascending: false })
    .limit(2000);

  if (error) {
    return {
      fetchedAt,
      windowDays: NAV_WINDOW_DAYS,
      series: [],
      totalSamples: 0,
      // The table appears only after the migration is pushed; say so plainly
      // instead of showing an empty panel that looks healthy.
      reason: /does not exist|schema cache/i.test(error.message)
        ? "nav_timings not found — push 20261028120000_nav_timings.sql to the hosted database."
        : error.message,
    };
  }

  const series = summarizeNavTimings((data ?? []) as Row[]);
  return {
    fetchedAt,
    windowDays: NAV_WINDOW_DAYS,
    series,
    totalSamples: series.reduce((sum, item) => sum + item.samples, 0),
  };
}

export function loadNavTimingSnapshot(): Promise<NavTimingSnapshot> {
  return unstable_cache(computeNavTimingSnapshot, ["nav-timing-snapshot-v1"], {
    revalidate: 120,
  })();
}
