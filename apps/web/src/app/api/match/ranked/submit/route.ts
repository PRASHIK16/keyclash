import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  calculateEloChange,
  deriveFinalResult,
  calculateXpReward,
  calculateCoinReward,
  calculateLevelFromXp,
} from "@keyclash/game-engine";
import { updateStreak } from "@/lib/streak";

interface SubmitBody {
  matchId: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as SubmitBody;
  const service = createServiceRoleClient();

  const { data: match } = await service.from("matches").select("*").eq("id", body.matchId).single();
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  if (match.player_one_id !== user.id && match.player_two_id !== user.id) {
    return NextResponse.json({ error: "Not a participant in this match" }, { status: 403 });
  }

  // Idempotent: if this match was already finalized (the other player's
  // client beat us to calling this endpoint), just return the existing
  // result rather than recomputing/re-awarding anything.
  if (match.status === "completed") {
    return NextResponse.json({
      status: "completed",
      playerOneWpm: match.player_one_wpm,
      playerTwoWpm: match.player_two_wpm,
      playerOneAccuracy: match.player_one_accuracy,
      playerTwoAccuracy: match.player_two_accuracy,
      winnerId: match.winner_id,
      playerOneRatingDelta: match.player_one_rating_delta,
      playerTwoRatingDelta: match.player_two_rating_delta,
      playerOneStats: match.player_one_stats,
      playerTwoStats: match.player_two_stats,
    });
  }

  if (!match.player_one_id || !match.player_two_id) {
    return NextResponse.json({ error: "Match is missing a participant" }, { status: 400 });
  }

  const [{ data: p1Events }, { data: p2Events }] = await Promise.all([
    service
      .from("match_events")
      .select("correct_chars, total_chars, elapsed_ms")
      .eq("match_id", body.matchId)
      .eq("player_id", match.player_one_id)
      .order("elapsed_ms", { ascending: true }),
    service
      .from("match_events")
      .select("correct_chars, total_chars, elapsed_ms")
      .eq("match_id", body.matchId)
      .eq("player_id", match.player_two_id)
      .order("elapsed_ms", { ascending: true }),
  ]);

  if (!p1Events?.length || !p2Events?.length) {
    // One or both players haven't reported any checkpoints yet — the race
    // genuinely isn't finished from the server's point of view. The client
    // should keep waiting/polling rather than treat this as an error.
    return NextResponse.json({ status: "in_progress" }, { status: 202 });
  }

  const p1Checkpoints = p1Events.map((e) => ({
    correctChars: e.correct_chars,
    totalChars: e.total_chars,
    elapsedMs: e.elapsed_ms,
  }));
  const p2Checkpoints = p2Events.map((e) => ({
    correctChars: e.correct_chars,
    totalChars: e.total_chars,
    elapsedMs: e.elapsed_ms,
  }));

  const p1Result = deriveFinalResult(p1Checkpoints);
  const p2Result = deriveFinalResult(p2Checkpoints);

  // If either side's data looks implausible (cheating or a client bug), we
  // still finalize the match — abandoning it would let a player stall a
  // ranked match forever — but we zero out that side's WPM and treat them
  // as the loser rather than propagate a fabricated result into ratings.
  const p1Wpm = p1Result.isPlausible ? p1Result.wpm : 0;
  const p2Wpm = p2Result.isPlausible ? p2Result.wpm : 0;

  let outcome: 1 | 0.5 | 0;
  if (p1Wpm > p2Wpm) outcome = 1;
  else if (p1Wpm < p2Wpm) outcome = 0;
  else outcome = 0.5;

  const [{ data: p1Profile }, { data: p2Profile }] = await Promise.all([
    service
      .from("profiles")
      .select("rating, peak_rating, xp, coins, matches_played, matches_won")
      .eq("id", match.player_one_id)
      .single(),
    service
      .from("profiles")
      .select("rating, peak_rating, xp, coins, matches_played, matches_won")
      .eq("id", match.player_two_id)
      .single(),
  ]);

  if (!p1Profile || !p2Profile) {
    return NextResponse.json({ error: "Participant profile missing" }, { status: 500 });
  }

  const elo = calculateEloChange(p1Profile.rating, p2Profile.rating, outcome);
  const winnerId = outcome === 1 ? match.player_one_id : outcome === 0 ? match.player_two_id : null;

  const p1Xp = calculateXpReward(p1Wpm, p1Result.accuracy, "ranked");
  const p2Xp = calculateXpReward(p2Wpm, p2Result.accuracy, "ranked");
  const p1Coins = calculateCoinReward(p1Wpm, p1Result.accuracy, outcome === 1);
  const p2Coins = calculateCoinReward(p2Wpm, p2Result.accuracy, outcome === 0);

  const p1NewXp = p1Profile.xp + p1Xp;
  const p2NewXp = p2Profile.xp + p2Xp;

  await Promise.all([
    service
      .from("profiles")
      .update({
        rating: elo.playerOneNewRating,
        peak_rating: Math.max(p1Profile.peak_rating, elo.playerOneNewRating),
        xp: p1NewXp,
        coins: p1Profile.coins + p1Coins,
        level: calculateLevelFromXp(p1NewXp).level,
        matches_played: p1Profile.matches_played + 1,
        matches_won: outcome === 1 ? p1Profile.matches_won + 1 : p1Profile.matches_won,
        updated_at: new Date().toISOString(),
      })
      .eq("id", match.player_one_id),
    service
      .from("profiles")
      .update({
        rating: elo.playerTwoNewRating,
        peak_rating: Math.max(p2Profile.peak_rating, elo.playerTwoNewRating),
        xp: p2NewXp,
        coins: p2Profile.coins + p2Coins,
        level: calculateLevelFromXp(p2NewXp).level,
        matches_played: p2Profile.matches_played + 1,
        matches_won: outcome === 0 ? p2Profile.matches_won + 1 : p2Profile.matches_won,
        updated_at: new Date().toISOString(),
      })
      .eq("id", match.player_two_id),
  ]);

  const { data: updatedMatch } = await service
    .from("matches")
    .update({
      status: "completed",
      player_one_wpm: p1Wpm,
      player_one_accuracy: p1Result.accuracy,
      player_two_wpm: p2Wpm,
      player_two_accuracy: p2Result.accuracy,
      winner_id: winnerId,
      player_one_rating_delta: elo.playerOneDelta,
      player_two_rating_delta: elo.playerTwoDelta,
      completed_at: new Date().toISOString(),
    })
    .eq("id", body.matchId)
    .select("player_one_stats, player_two_stats")
    .single();

  await Promise.all([updateStreak(match.player_one_id!), updateStreak(match.player_two_id!)]);

  return NextResponse.json({
    status: "completed",
    playerOneWpm: p1Wpm,
    playerTwoWpm: p2Wpm,
    playerOneAccuracy: p1Result.accuracy,
    playerTwoAccuracy: p2Result.accuracy,
    winnerId,
    playerOneRatingDelta: elo.playerOneDelta,
    playerTwoRatingDelta: elo.playerTwoDelta,
    playerOneStats: updatedMatch?.player_one_stats ?? null,
    playerTwoStats: updatedMatch?.player_two_stats ?? null,
  });
}
