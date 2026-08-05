import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  calculateXpReward,
  calculateCoinReward,
  calculateLevelFromXp,
} from "@keyclash/game-engine";
import { updateStreak } from "@/lib/streak";

interface DailySubmitBody {
  challengeDate: string;
  wpm: number;
  accuracy: number;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as DailySubmitBody;

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

  const xpAwarded = calculateXpReward(body.wpm, body.accuracy, "daily");
  const coinsAwarded = calculateCoinReward(body.wpm, body.accuracy, false);

  // The unique (challenge_date, player_id) constraint on this table is the
  // real enforcement of "one attempt per day" — this insert simply fails if
  // they've already submitted today, rather than us needing a separate check
  // that could race under concurrent requests.
  const { error: insertError } = await service.from("daily_challenge_attempts").insert({
    challenge_date: body.challengeDate,
    player_id: user.id,
    wpm: body.wpm,
    accuracy: body.accuracy,
    xp_awarded: xpAwarded,
    coins_awarded: coinsAwarded,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "You've already completed today's challenge" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 });
  }

  const { data: profile } = await service
    .from("profiles")
    .select("xp, coins")
    .eq("id", user.id)
    .single();

  if (profile) {
    const newXp = profile.xp + xpAwarded;
    const { level } = calculateLevelFromXp(newXp);
    await service
      .from("profiles")
      .update({
        xp: newXp,
        coins: profile.coins + coinsAwarded,
        level,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  }

  await updateStreak(user.id);

  return NextResponse.json({ xpAwarded, coinsAwarded });
}
