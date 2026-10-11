import "server-only";

import type { SentrySurfaceId } from "@/lib/observability/sentry-surfaces";

const PROBE_TIMEOUT_MS = 10_000;

/** Production URLs probed from Ops (override with env in non-prod). */
const DEFAULT_PROBE_URL: Record<SentrySurfaceId, string> = {
  app: "https://app.weeon.school/login",
  marketing: "https://weeon.school/",
  teachers: "https://teachers.weeon.school/",
  ops: "https://ops.weeon.school/api/health",
};

const PROBE_ENV: Record<SentrySurfaceId, string> = {
  app: "OBSERVABILITY_PROBE_URL_APP",
  marketing: "OBSERVABILITY_PROBE_URL_MARKETING",
  teachers: "OBSERVABILITY_PROBE_URL_TEACHERS",
  ops: "OBSERVABILITY_PROBE_URL_OPS",
};

export type UptimeProbeResult = {
  id: SentrySurfaceId;
  url: string;
  ok: boolean;
  statusCode?: number;
  latencyMs: number;
  error?: string;
};

function trimEnv(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

export function resolveProbeUrl(id: SentrySurfaceId): string {
  const key = PROBE_ENV[id];
  return trimEnv(process.env[key]) ?? DEFAULT_PROBE_URL[id];
}

export async function probeUrl(url: string): Promise<Omit<UptimeProbeResult, "id">> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      headers: { Accept: "text/html,application/json" },
      cache: "no-store",
    });
    const latencyMs = Date.now() - started;
    const ok = res.status >= 200 && res.status < 400;
    return {
      url,
      ok,
      statusCode: res.status,
      latencyMs,
      error: ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (cause) {
    const latencyMs = Date.now() - started;
    const message = cause instanceof Error ? cause.message : "Probe failed";
    return { url, ok: false, latencyMs, error: message };
  }
}

export async function probeAllSurfaces(): Promise<UptimeProbeResult[]> {
  const ids = Object.keys(DEFAULT_PROBE_URL) as SentrySurfaceId[];
  return Promise.all(
    ids.map(async (id) => {
      const url = resolveProbeUrl(id);
      const result = await probeUrl(url);
      return { id, ...result };
    }),
  );
}
