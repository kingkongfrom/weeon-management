import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy.
 *
 * Mirrors `weeon-tenants` so the products stay aligned: a deliberately *static*
 * CSP (no nonces) keeps pages statically rendered and CDN-cacheable. That still
 * blocks the major vectors:
 *   - object-src disabled
 *   - base-uri locked to self (prevents base-tag injection)
 *   - frame-ancestors 'none' (blocks clickjacking; supersedes X-Frame-Options)
 *   - form-action locked to self
 *   - upgrade-insecure-requests (forces HTTPS)
 *
 * 'unsafe-eval' is development-only (React error-stack reconstruction).
 * 'unsafe-inline' on script-src is required by the App Router, which injects
 * inline bootstrap / flight-data scripts on every page; without it client
 * components never hydrate.
 *
 * Ops has no third-party script origins (the console is first-party plus
 * Supabase only). The two external origins that ARE required:
 *   - `demotiles.maplibre.org` — MapLibre glyphs for country labels on the
 *     analytics map (`lib/analytics/map-basemap-style.ts`). Needed on both
 *     connect-src (fetch) and font-src (the .pbf glyphs).
 *   - Supabase — session/auth and any images served from the project.
 */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com https://demotiles.maplibre.org;
  img-src 'self' blob: data: https://wlyrqyiqrgelsehjmtta.supabase.co;
  connect-src 'self' https://wlyrqyiqrgelsehjmtta.supabase.co wss://wlyrqyiqrgelsehjmtta.supabase.co https://demotiles.maplibre.org;
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

/** Security hardening headers applied to every response. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // The ops console is an internal staff tool with no business being indexed or
  // linked; keep it out of search engines entirely.
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Do not advertise the framework/version.
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
