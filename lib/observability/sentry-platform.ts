import "server-only";

import { unstable_cache } from "next/cache";

import {
  isSentryPlatformApiConfigured,
  resolveProjectSlug,
  SENTRY_SURFACE_DEFINITIONS,
  sentryAuthToken,
  sentryOrgSlug,
  type SentrySurfaceId,
} from "@/lib/observability/sentry-surfaces";
import { probeAllSurfaces, type UptimeProbeResult } from "@/lib/observability/uptime-probes";

const SENTRY_API = "https://sentry.io/api/0";
const ISSUE_LIMIT = 8;
/** Sentry allows ~5 project issue requests per second — stay under that. */
const ISSUE_FETCH_GAP_MS = 250;

export type SentryIssueSummary = {
  id: string;
  title: string;
  level: string;
  eventCount: number;
  lastSeen: string;
  permalink: string;
};

export type SentrySurfaceStatus = "ok" | "not_linked" | "api_error";

export type SentrySurfaceSnapshot = {
  id: SentrySurfaceId;
  appTag: string;
  origin: string;
  projectSlug: string;
  status: SentrySurfaceStatus;
  unresolvedCount: number;
  hasMoreUnresolved: boolean;
  issues: SentryIssueSummary[];
  error?: string;
};

export type ObservabilitySnapshot = {
  fetchedAt: string;
  orgSlug?: string;
  sentryOrgIssuesUrl?: string;
  reason?: string;
  surfaces: SentrySurfaceSnapshot[];
  totalUnresolved: number;
  uptime: UptimeProbeResult[];
  uptimeDown: number;
};

type RawSentryIssue = {
  id: string;
  title: string;
  level?: string;
  count?: string;
  lastSeen?: string;
  permalink?: string;
};

function parseIssue(raw: RawSentryIssue): SentryIssueSummary {
  return {
    id: raw.id,
    title: raw.title,
    level: raw.level ?? "unknown",
    eventCount: Number.parseInt(raw.count ?? "0", 10) || 0,
    lastSeen: raw.lastSeen ?? new Date().toISOString(),
    permalink: raw.permalink ?? `https://sentry.io/issues/${raw.id}/`,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOrgProjectSlugs(orgSlug: string, token: string): Promise<Set<string> | { error: string }> {
  try {
    const res = await fetch(`${SENTRY_API}/organizations/${orgSlug}/projects/`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      next: { revalidate: 120 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        error: `Could not list Sentry projects (${res.status})${body ? `: ${body.slice(0, 80)}` : ""}.`,
      };
    }
    const data = (await res.json()) as Array<{ slug?: string }>;
    if (!Array.isArray(data)) {
      return { error: "Unexpected Sentry project list response." };
    }
    return new Set(data.map((p) => p.slug).filter(Boolean) as string[]);
  } catch {
    return { error: "Could not reach Sentry (network)." };
  }
}

async function fetchUnresolvedIssues(
  orgSlug: string,
  projectSlug: string,
  token: string,
): Promise<{ issues: SentryIssueSummary[]; error?: string }> {
  const url = new URL(`${SENTRY_API}/projects/${orgSlug}/${projectSlug}/issues/`);
  url.searchParams.set("query", "is:unresolved");
  url.searchParams.set("limit", String(ISSUE_LIMIT));
  url.searchParams.set("sort", "date");

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (res.status === 429 && attempt === 0) {
        await sleep(1100);
        continue;
      }

      if (res.status === 401 || res.status === 403) {
        return {
          issues: [],
          error: "Sentry API rejected the auth token (check SENTRY_AUTH_TOKEN scopes).",
        };
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return {
          issues: [],
          error:
            res.status === 429
              ? "Sentry rate limit — wait a minute and refresh."
              : `Sentry API error ${res.status}${body ? `: ${body.slice(0, 100)}` : ""}.`,
        };
      }

      const data = (await res.json()) as RawSentryIssue[];
      if (!Array.isArray(data)) {
        return { issues: [], error: "Unexpected Sentry API response." };
      }

      return { issues: data.map(parseIssue) };
    } catch {
      return { issues: [], error: "Could not reach Sentry (network)." };
    }
  }

  return { issues: [], error: "Sentry rate limit — wait a minute and refresh." };
}

async function computeObservabilitySnapshot(): Promise<ObservabilitySnapshot> {
  const fetchedAt = new Date().toISOString();
  const emptySurfaces: SentrySurfaceSnapshot[] = SENTRY_SURFACE_DEFINITIONS.map((def) => ({
    id: def.id,
    appTag: def.appTag,
    origin: def.origin,
    projectSlug: resolveProjectSlug(def),
    status: "not_linked",
    unresolvedCount: 0,
    hasMoreUnresolved: false,
    issues: [],
  }));

  const uptime = await probeAllSurfaces();
  const uptimeDown = uptime.filter((p) => !p.ok).length;

  if (!isSentryPlatformApiConfigured()) {
    return {
      fetchedAt,
      reason:
        "Sentry API not configured — set SENTRY_ORG_SLUG and SENTRY_AUTH_TOKEN on this Vercel project (see docs/observability-sentry.md).",
      surfaces: emptySurfaces,
      totalUnresolved: 0,
      uptime,
      uptimeDown,
    };
  }

  const orgSlug = sentryOrgSlug()!;
  const token = sentryAuthToken()!;
  const sentryOrgIssuesUrl = `https://${orgSlug}.sentry.io/issues/?query=is%3Aunresolved`;

  const projectSlugs = await fetchOrgProjectSlugs(orgSlug, token);
  if (!(projectSlugs instanceof Set)) {
    return {
      fetchedAt,
      orgSlug,
      sentryOrgIssuesUrl,
      reason: projectSlugs.error,
      surfaces: emptySurfaces.map((s) => ({
        ...s,
        status: "api_error" as const,
        error: projectSlugs.error,
      })),
      totalUnresolved: 0,
      uptime,
      uptimeDown,
    };
  }

  const surfaces: SentrySurfaceSnapshot[] = [];

  for (const def of SENTRY_SURFACE_DEFINITIONS) {
    const projectSlug = resolveProjectSlug(def);

    if (!projectSlugs.has(projectSlug)) {
      surfaces.push({
        id: def.id,
        appTag: def.appTag,
        origin: def.origin,
        projectSlug,
        status: "not_linked",
        unresolvedCount: 0,
        hasMoreUnresolved: false,
        issues: [],
      });
      continue;
    }

    if (surfaces.length > 0) {
      await sleep(ISSUE_FETCH_GAP_MS);
    }

    const { issues, error } = await fetchUnresolvedIssues(orgSlug, projectSlug, token);
    surfaces.push({
      id: def.id,
      appTag: def.appTag,
      origin: def.origin,
      projectSlug,
      status: error ? "api_error" : "ok",
      unresolvedCount: issues.length,
      hasMoreUnresolved: issues.length >= ISSUE_LIMIT,
      issues,
      error,
    });
  }

  const totalUnresolved = surfaces.reduce(
    (sum, s) => sum + (s.status === "ok" ? s.unresolvedCount : 0),
    0,
  );

  return {
    fetchedAt,
    orgSlug,
    sentryOrgIssuesUrl,
    surfaces,
    totalUnresolved,
    uptime,
    uptimeDown,
  };
}

/** Cached ~60s — shared by the Health page and sidebar badge (avoids Sentry 429s). */
export function loadObservabilitySnapshot(): Promise<ObservabilitySnapshot> {
  return unstable_cache(computeObservabilitySnapshot, ["observability-snapshot-v2"], {
    revalidate: 60,
  })();
}
