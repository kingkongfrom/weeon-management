const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
]);

/** Only allow internal redirect targets (never external / open redirect). */
export function safeNextPath(input: string, fallback = "/dashboard"): string {
  if (!input) return fallback;
  if (!input.startsWith("/")) return fallback;
  if (input.startsWith("//")) return fallback;
  try {
    const url = new URL(input, "http://local");
    if (url.origin !== "http://local") return fallback;
    const path = url.pathname;
    if (PUBLIC_PATHS.has(path)) return fallback;
    return `${path}${url.search}`;
  } catch {
    return fallback;
  }
}
