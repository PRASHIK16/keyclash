import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") === "monthly" ? "monthly" : "weekly";
  const days = range === "monthly" ? 30 : 7;

  const periodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const service = createServiceRoleClient();

  const { data: matches } = await service
    .from("matches")
    .select("player_one_id, player_one_rating_delta, player_two_id, player_two_rating_delta")
    .eq("mode", "ranked_1v1")
    .eq("status", "completed")
    .gte("completed_at", periodStart);

  const deltaByPlayer = new Map<string, number>();
  for (const m of matches ?? []) {
    if (m.player_one_id && m.player_one_rating_delta !== null) {
      deltaByPlayer.set(
        m.player_one_id,
        (deltaByPlayer.get(m.player_one_id) ?? 0) + m.player_one_rating_delta
      );
    }
    if (m.player_two_id && m.player_two_rating_delta !== null) {
      deltaByPlayer.set(
        m.player_two_id,
        (deltaByPlayer.get(m.player_two_id) ?? 0) + m.player_two_rating_delta
      );
    }
  }

  const topPlayerIds = [...deltaByPlayer.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([id]) => id);

  if (topPlayerIds.length === 0) {
    return NextResponse.json({ entries: [] });
  }

  const { data: profiles } = await service
    .from("profiles")
    .select("id, username, avatar_url, rating")
    .in("id", topPlayerIds);

  const entries = topPlayerIds
    .map((id) => {
      const profile = profiles?.find((p) => p.id === id);
      if (!profile) return null;
      return { ...profile, periodDelta: deltaByPlayer.get(id) ?? 0 };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  return NextResponse.json({ entries });
}
