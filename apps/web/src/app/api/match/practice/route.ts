import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  calculateXpReward,
  calculateCoinReward,
  calculateLevelFromXp,
} from "@keyclash/game-engine";
import type { PlayerRaceStats } from "@keyclash/database";

interface PracticeSubmitBody {
  modeKind: string;
  durationSeconds: number | null;
  textContent: string;
  wpm: number;
  accuracy: number;
  stats: PlayerRaceStats;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as PracticeSubmitBody;

  if (
    typeof body.wpm !== "number" ||
    typeof body.accuracy !== "number" ||
    body.wpm < 0 ||
    body.wpm > 300 ||
    body.accuracy < 0 ||
    body.accuracy > 100
  ) {
    return NextResponse.json({ error: "Invalid result payload" }, { status: 400 });
  }

  const service = createServiceRoleClient();

  const xpAwarded = calculateXpReward(body.wpm, body.accuracy, "practice");
  const coinsAwarded = calculateCoinReward(body.wpm, body.accuracy, false);

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("xp, coins, matches_played")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const newXp = profile.xp + xpAwarded;
  const { level } = calculateLevelFromXp(newXp);

  await service
    .from("profiles")
    .update({
      xp: newXp,
      coins: profile.coins + coinsAwarded,
      level,
      matches_played: profile.matches_played + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  await service.from("matches").insert({
    mode: body.modeKind === "zen" ? "practice_zen" : "practice_classic",
    mode_kind: body.modeKind,
    duration_seconds: body.durationSeconds,
    status: "completed",
    text_content: body.textContent,
    player_one_id: user.id,
    player_one_wpm: body.wpm,
    player_one_accuracy: body.accuracy,
    player_one_stats: body.stats,
    completed_at: new Date().toISOString(),
  });

  return NextResponse.json({ xpAwarded, coinsAwarded, newLevel: level });
}
