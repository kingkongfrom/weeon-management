import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Handles Supabase Auth redirects. Password-recovery links land here with a
 * `code` query param; we exchange it for a cookie session and send the (now
 * authenticated) staff user into the dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (url && anonKey) {
      const supabaseResponse = NextResponse.redirect(
        new URL(safeNext, origin),
      );

      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return supabaseResponse;
      }
    }
  }

  // Missing/unusable code — send them back to sign in.
  return NextResponse.redirect(new URL("/", origin));
}
