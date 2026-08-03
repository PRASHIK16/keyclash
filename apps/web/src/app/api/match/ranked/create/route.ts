import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { PRACTICE_TEXTS } from "@keyclash/shared";

interface CreateMatchBody {
  opponentId: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as CreateMatchBody;
  if (!body.opponentId || typeof body.opponentId !== "string") {
    return NextResponse.json({ error: "opponentId is required" }, { status: 400 });
  }
  if (body.opponentId === user.id) {
    return NextResponse.json({ error: "Cannot match against yourself" }, { status: 400 });
  }

  const service = createServiceRoleClient();

  // Confirm the opponent is a real profile before creating a match against
  // them — the lobby pairing happens client-side over Realtime presence, so
  // this is our server-side sanity check on that untrusted input.
  const { data: opponent } = await service
    .from("profiles")
    .select("id")
    .eq("id", body.opponentId)
    .single();
  if (!opponent) {
    return NextResponse.json({ error: "Opponent profile not found" }, { status: 404 });
  }

  const textContent =
    PRACTICE_TEXTS[Math.floor(Math.random() * PRACTICE_TEXTS.length)] ?? PRACTICE_TEXTS[0]!;

  const { data: match, error } = await service
    .from("matches")
    .insert({
      mode: "ranked_1v1",
      status: "in_progress",
      text_content: textContent,
      player_one_id: user.id,
      player_two_id: body.opponentId,
    })
    .select()
    .single();

  if (error || !match) {
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }

  return NextResponse.json({ matchId: match.id, textContent });
}
