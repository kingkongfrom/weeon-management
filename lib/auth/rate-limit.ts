import "server-only";

/**
 * In-process rate limiter (sliding window).
 *
 * Purpose: blunt brute-force / credential-stuffing and password-reset abuse
 * against the ops login. It is deliberately **not** an account lockout — no
 * account is ever locked or disabled, and a legitimate user is never permanently
 * blocked. Limits reset automatically, so there is no "unlock" support burden
 * and no way for an attacker to lock a real admin out of the console.
 *
 * LIMITATION — read before relying on this:
 * This state lives in the Node process. On a multi-instance or serverless
 * deployment each instance keeps its own counters, so the effective limit is
 * `limit x instances`. It still stops the common case (one attacker hammering
 * one instance) and is a meaningful speed bump, but for a hard guarantee across
 * instances move the store to Redis/Upstash (or a shared table) without changing
 * the call sites: `consume()` is the only seam.
 *
 * Supabase Auth also applies its own project-level rate limits on
 * `signInWithPassword`, so this is defence in depth rather than the only control.
 */

type Bucket = { hits: number[]; };

const buckets = new Map<string, Bucket>();

/** Drop empty/stale buckets so the map cannot grow without bound. */
const MAX_BUCKETS = 10_000;

function prune(now: number, windowMs: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    const live = bucket.hits.filter((t) => now - t < windowMs);
    if (live.length === 0) buckets.delete(key);
    else bucket.hits = live;
  }
}

export type RateLimitResult = {
  allowed: boolean;
  /** Attempts remaining in the current window (never negative). */
  remaining: number;
  /** Seconds until the oldest hit leaves the window; 0 when allowed. */
  retryAfterSeconds: number;
};

export type RateLimitOptions = {
  /** Max attempts allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

/**
 * Record an attempt for `key` and report whether it is allowed.
 *
 * Call this on EVERY attempt (success or failure) so a successful login also
 * counts; the caller decides whether a success should clear the bucket via
 * `resetRateLimit`.
 */
export function consumeRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  prune(now, windowMs);

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowMs - (now - oldest)) / 1000),
    );
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.hits.length),
    retryAfterSeconds: 0,
  };
}

/** Clear a bucket — call after a successful sign-in so successes reset the count. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Best-effort client identity for a server action.
 *
 * Prefers platform-provided forwarding headers. These are only trustworthy when
 * the app sits behind a proxy that overwrites them (Vercel does); a direct
 * connection could spoof them, so the limiter is scoped per email AND per IP to
 * limit the blast radius of a spoofed value.
 */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
