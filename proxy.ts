import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDashboardAuthEnforced } from "@/lib/auth/policy";

function redirectWithSession(url: URL, sessionResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Server actions (POST login/logout) must not wait on auth here.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  if (!isDashboardAuthEnforced()) {
    return NextResponse.next();
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const enforceDashboard = pathname.startsWith("/dashboard");

  if (!url || !anonKey) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        const changed = cookiesToSet.some(
          ({ name, value }) => request.cookies.get(name)?.value !== value,
        );
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        if (changed) {
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        }
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && enforceDashboard) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    return redirectWithSession(loginUrl, supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
