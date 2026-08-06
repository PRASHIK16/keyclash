import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/play";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Google sign-in has no username field to fill in, so the
      // handle_new_user() trigger falls back to an auto-generated
      // "player_xxxxxxxx" placeholder. Route those straight to onboarding
      // to pick a real username before continuing — email/password
      // sign-ups already supplied a real username at signup, so they skip
      // this entirely.
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .single();

      if (profile?.username.startsWith("player_")) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
