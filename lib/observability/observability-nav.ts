import "server-only";

import { loadObservabilitySnapshot } from "@/lib/observability/sentry-platform";

export type ObservabilityNavState = {
  configured: boolean;
  openIssues: number;
  uptimeDown: number;
  showAlert: boolean;
};

async function computeNavState(): Promise<ObservabilityNavState> {
  const snapshot = await loadObservabilitySnapshot();

  const configured = !snapshot.reason;
  const openIssues = snapshot.totalUnresolved;
  const uptimeDown = snapshot.uptimeDown;

  return {
    configured,
    openIssues,
    uptimeDown,
    showAlert: openIssues > 0 || uptimeDown > 0,
  };
}

/** Uses the same cached snapshot as the Health page (see sentry-platform). */
export function getObservabilityNavState(): Promise<ObservabilityNavState> {
  return computeNavState();
}
