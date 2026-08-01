import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@keyclash/database";

/**
 * Service-role client. This BYPASSES Row Level Security entirely — it must
 * never be imported into any client component or exposed to the browser.
 * Use only in Route Handlers for operations the RLS policies deliberately
 * don't grant to regular users, e.g.:
 *   - writing match results / rating deltas after server-side validation
 *   - writing leaderboard snapshots
 *   - writing daily challenge XP/coin awards
 *
 * If you ever see this imported in a file under `"use client"`, that's a
 * security bug — stop and fix it before shipping.
 */
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
