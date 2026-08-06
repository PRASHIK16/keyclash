import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Route Handlers can mutate cookies (Server Components cannot), so this is
 * the one place sign-out is allowed to actually clear the session cookie.
 * Called from the client via lib/sign-out.ts, which also does a defensive
 * client-side storage sweep before redirecting.
 */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
