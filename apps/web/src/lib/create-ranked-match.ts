import { createServiceRoleClient } from "@/lib/supabase/service";
import { generateTextForMode } from "@keyclash/shared";
import type { GameModeConfig } from "@keyclash/game-engine";

interface CreateMatchParams {
  playerOneId: string;
  playerTwoId: string;
  modeKind: string;
  durationSeconds: number | null;
  wordTarget: number | null;
}

/**
 * NOTE: room-based races currently affect rating exactly like quick-match
 * ranked does (same mode = "ranked_1v1", same Elo update path in
 * api/match/ranked/submit). This is a deliberate simplification, not an
 * oversight — the schema doesn't yet have a distinct "unranked custom
 * match" category, and adding one raises real questions (anti-collusion
 * between friends who could farm each other's rating) that deserve their
 * own design pass rather than a rushed toggle. Flagging this here so it's
 * an explicit, revisitable decision.
 */
export async function createRankedMatch({
  playerOneId,
  playerTwoId,
  modeKind,
  durationSeconds,
  wordTarget,
}: CreateMatchParams) {
  const service = createServiceRoleClient();

  const modeConfig: GameModeConfig = {
    kind: modeKind === "words" ? "words" : "time",
    durationSeconds: durationSeconds ?? undefined,
    wordCount: wordTarget ?? undefined,
  };
  const textContent = generateTextForMode(modeConfig);

  const { data: match, error } = await service
    .from("matches")
    .insert({
      mode: "ranked_1v1",
      mode_kind: modeConfig.kind,
      duration_seconds: durationSeconds,
      word_target: wordTarget,
      status: "in_progress",
      text_content: textContent,
      player_one_id: playerOneId,
      player_two_id: playerTwoId,
    })
    .select()
    .single();

  if (error || !match) {
    throw new Error("Failed to create match");
  }

  return { matchId: match.id as string, textContent };
}
