import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { PlayerRaceStats } from "@keyclash/database";

interface ReportStatsBody {
  matchId: string;
  stats: PlayerRaceStats;
}

/**
 * Each ranked client only ever knows its own detailed stat breakdown (raw
 * WPM, consistency, keystrokes, mistakes) — the server can't derive those
 * from match_events checkpoints without also transmitting keystroke-level
 * data, which isn't worth adding complexity for fields that don't affect
 * rating. So each client reports its own side here, best-effort, purely for
 * display on the results screen. This never touches wpm/accuracy/winner_id/
 * rating deltas — those remain exclusively derived server-side in
 * api/match/ranked/submit from data the client can't forge.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as ReportStatsBody;
  const service = createServiceRoleClient();

  const { data: match } = await service
    .from("matches")
    .select("player_one_id, player_two_id")
    .eq("id", body.matchId)
    .single();

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  if (match.player_one_id !== user.id && match.player_two_id !== user.id) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  const isPlayerOne = match.player_one_id === user.id;

  await service
    .from("matches")
    .update(isPlayerOne ? { player_one_stats: body.stats } : { player_two_stats: body.stats })
    .eq("id", body.matchId);

  return NextResponse.json({ ok: true });
}
