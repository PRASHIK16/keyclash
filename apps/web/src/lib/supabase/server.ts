import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@keyclash/database";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions. Reads the session from cookies directly — there is no
 * separate "is this synced yet" step like the previous Clerk+webhook setup
 * needed, because Supabase Auth and the Postgres database are the same
 * system: the session cookie IS the source of truth, checked on every
 * request, with no async propagation delay to race against.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component (not a Route Handler/Server Action) —
            // Next.js disallows setting cookies there. Harmless as long as
            // middleware.ts is also refreshing the session (it is, see
            // src/lib/supabase/middleware.ts), so this is safe to swallow.
          }
        },
      },
    }
  );
}
