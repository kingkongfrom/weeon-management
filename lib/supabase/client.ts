import { createClient } from "@supabase/supabase-js";

// Browser / generic anon client for PUBLIC data only.
//
// CAUTION: Weeon Management operates at PLATFORM scope. The anon client is
// bound by RLS, which is tenant-scoped for school data. Prefer the server-only
// service-role client (lib/supabase/platform.ts) for cross-tenant reads.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env.local",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
