import "server-only";

/** True when public Supabase env is present (guards for session/proxy code). */
export function isApiKeyConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_ANON_KEY?.trim(),
  );
}
