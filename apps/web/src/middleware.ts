import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/play", "/settings", "/onboarding"];

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
  //
  // NOTE: this used to also force-sign-out on "/", "/sign-in", "/sign-up" to
  // stop auto-redirecting an already-authenticated visitor to the
  // dashboard. That caused a real bug: Supabase's session cookie is shared
  // across every tab in the browser, not per-tab, so visiting "/" in a
  // SECOND tab silently killed the session in a first tab that had a room
  // lobby open — exactly the intermittent "sometimes Ready Up fails with
  // Authentication Failed" pattern reported. Removed. The pages themselves
  // simply don't auto-redirect based on session state anymore (see
  // src/app/page.tsx) — that alone stops the unwanted redirect without
  // destroying a session other tabs may be actively using.
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
