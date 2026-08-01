import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@keyclash/database";

/**
 * Browser-side Supabase client. Uses the public anon key — safe to expose,
 * Row Level Security policies (see packages/database/supabase/migrations)
 * are what actually restrict what this client can read/write, not secrecy
 * of the key.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
