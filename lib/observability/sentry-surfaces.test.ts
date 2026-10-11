import { afterEach, describe, expect, it } from "vitest";

import {
  isSentryPlatformApiConfigured,
  resolveProjectSlug,
  SENTRY_SURFACE_DEFINITIONS,
} from "@/lib/observability/sentry-surfaces";

describe("sentry-surfaces", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("requires org slug and auth token for the Ops API", () => {
    delete process.env.SENTRY_ORG_SLUG;
    delete process.env.SENTRY_AUTH_TOKEN;
    expect(isSentryPlatformApiConfigured()).toBe(false);

    process.env.SENTRY_ORG_SLUG = "weeon";
    process.env.SENTRY_AUTH_TOKEN = "token";
    expect(isSentryPlatformApiConfigured()).toBe(true);
  });

  it("resolves project slug overrides from env", () => {
    const app = SENTRY_SURFACE_DEFINITIONS.find((s) => s.id === "app")!;
    process.env.SENTRY_PROJECT_SLUG_APP = " custom-slug ";
    expect(resolveProjectSlug(app)).toBe("custom-slug");
  });
});
