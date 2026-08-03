import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createRankedMatch } from "@/lib/create-ranked-match";

// Fixed at 30s Time mode for quick-match — pre-match mode/duration selection
// is what room-based multiplayer (api/rooms/*) exists for. Quick-match stays
// single-duration since there's no pre-race UI moment to choose it in.
const RANKED_DURATION_SECONDS = 30;

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
  const { data: opponent } = await service
    .from("profiles")
    .select("id")
    .eq("id", body.opponentId)
    .single();
  if (!opponent) {
    return NextResponse.json({ error: "Opponent profile not found" }, { status: 404 });
  }

  try {
    const { matchId, textContent } = await createRankedMatch({
      playerOneId: user.id,
      playerTwoId: body.opponentId,
      modeKind: "time",
      durationSeconds: RANKED_DURATION_SECONDS,
      wordTarget: null,
    });
    return NextResponse.json({ matchId, textContent, durationSeconds: RANKED_DURATION_SECONDS });
  } catch {
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
