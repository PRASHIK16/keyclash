import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/play", "/settings"];

// Visiting any of these must ALWAYS show a fresh login/signup prompt — never
// silently continue an existing session. This is what actually fixes "I
// logged in once and now every visit skips straight to the dashboard": we
// don't fight Supabase's session-cookie lifetime (its @supabase/ssr version
// hardcodes a long cookie Max-Age on every session write, so there's no
// supported way to make the cookie itself session-only) — instead, we
// proactively end the session the moment someone lands on one of these
// paths, before the page even renders. Landing here is the exact signal
// that "the user is starting a fresh visit," so it's the right place to
// enforce this rather than on every protected route (which would make the
// app unusable — you'd get signed out mid-use on every refresh).
const FORCE_SIGNOUT_PATHS = ["/", "/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: this call is what actually refreshes an expiring session
  // token. Skipping it (e.g. only checking cookies without calling
  // getUser()) means sessions silently expire mid-use.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (FORCE_SIGNOUT_PATHS.includes(request.nextUrl.pathname) && user) {
    await supabase.auth.signOut();
    return response;
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (isProtected && !user) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
