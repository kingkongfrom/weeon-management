/** Weeon deploy targets monitored from Ops (matches SDK `weeon.app` tags). */
export type SentrySurfaceId = "app" | "marketing" | "teachers" | "ops";

export type SentrySurfaceDefinition = {
  id: SentrySurfaceId;
  /** Value of Sentry tag `weeon.app` in the SDK. */
  appTag: string;
  origin: string;
  /** Default Sentry **project slug** (create matching names in Sentry.io). */
  defaultProjectSlug: string;
  /** Optional env override, e.g. `SENTRY_PROJECT_SLUG_APP`. */
  projectSlugEnv: string;
};

export const SENTRY_SURFACE_DEFINITIONS: readonly SentrySurfaceDefinition[] = [
  {
    id: "app",
    appTag: "weeon-app",
    origin: "app.weeon.school",
    defaultProjectSlug: "weeon-app",
    projectSlugEnv: "SENTRY_PROJECT_SLUG_APP",
  },
  {
    id: "marketing",
    appTag: "weeon-marketing",
    origin: "weeon.school",
    defaultProjectSlug: "weeon-marketing",
    projectSlugEnv: "SENTRY_PROJECT_SLUG_MARKETING",
  },
  {
    id: "teachers",
    appTag: "weeon-teachers",
    origin: "teachers.weeon.school",
    defaultProjectSlug: "weeon-teachers",
    projectSlugEnv: "SENTRY_PROJECT_SLUG_TEACHERS",
  },
  {
    id: "ops",
    appTag: "weeon-ops",
    origin: "ops.weeon.school",
    defaultProjectSlug: "weeon-ops",
    projectSlugEnv: "SENTRY_PROJECT_SLUG_OPS",
  },
] as const;

function trimEnv(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

export function resolveProjectSlug(surface: SentrySurfaceDefinition): string {
  const fromEnv = trimEnv(process.env[surface.projectSlugEnv]);
  return fromEnv ?? surface.defaultProjectSlug;
}

export function sentryOrgSlug(): string | undefined {
  return trimEnv(process.env.SENTRY_ORG_SLUG);
}

export function sentryAuthToken(): string | undefined {
  return trimEnv(process.env.SENTRY_AUTH_TOKEN);
}

export function isSentryPlatformApiConfigured(): boolean {
  return Boolean(sentryOrgSlug() && sentryAuthToken());
}
