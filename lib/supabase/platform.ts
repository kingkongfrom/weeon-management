import "server-only";

import { createClient } from "@supabase/supabase-js";

function platformEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Weeon Management in production.",
      );
    }
    console.warn(
      "[supabase:platform] SUPABASE_SERVICE_ROLE_KEY not set; platform client unavailable.",
    );
  }

  return { url, key };
}

/**
 * Platform-scope Supabase client (service-role). BYPASSES RLS.
 *
 * This is the ONLY client used for cross-tenant reads in Weeon Management
 * (list all tenants, count users per tenant, tenant stats). It must be called
 * exclusively from Server Components, route handlers, and server actions that
 * enforce their own platform-authorization.
 *
 * DANGER:
 *  - Never expose the service-role key (or results gated on it) to the browser.
 *  - Keep this path separate from the tenant-scoped RLS path used by
 *    `weeon-admin`. Do not mix anon/tenant clients here for management reads.
 */
export function createPlatformClient() {
  const { url, key } = platformEnv();
  return createClient(url ?? "", key ?? "", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${key ?? ""}` },
    },
  });
}
