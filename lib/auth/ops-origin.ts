import "server-only";

/**
 * Resolves the public origin of THIS ops console (weeon-management). Reset and
 * transactional emails must point the user back to this origin, which is
 * `https://ops.weeon.school` in production.
 *
 * Order (environment aware):
 *   1. `WEEON_OPS_ORIGIN` if set (canonical; allowlisted in Supabase Auth).
 *   2. Production default `https://ops.weeon.school`.
 *   3. Local dev: reflect an optional caller-provided Host so email links work
 *      against http://localhost:<port>.
 */
export function opsAppOrigin(requestOrigin?: string | null): string {
  const fromEnv = process.env.WEEON_OPS_ORIGIN?.trim();

  if (process.env.NODE_ENV === "production") {
    return (fromEnv || "https://ops.weeon.school").replace(/\/+$/, "");
  }

  // Local dev: honor an explicit Host header first, else an https env hint.
  if (requestOrigin?.trim() && /^https?:\/\//.test(requestOrigin.trim())) {
    return requestOrigin.trim().replace(/\/+$/, "");
  }
  const scheme = fromEnv?.startsWith("https://") ? "https" : "http";
  const host = requestOrigin?.trim()
    ? requestOrigin.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "")
    : "";
  return host ? `${scheme}://${host}` : (fromEnv || "https://ops.weeon.school").replace(/\/+$/, "");
}
