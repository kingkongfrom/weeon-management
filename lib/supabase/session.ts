import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requireSupabasePublicEnv() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local",
    );
  }

  return { url, anonKey };
}

/** Cookie-backed Supabase client for server actions and RSC. */
export async function createSessionClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = requireSupabasePublicEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — proxy refreshes the cookie.
        }
      },
    },
  });
}
