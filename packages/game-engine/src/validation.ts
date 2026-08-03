/**
 * Core typing metrics + anti-cheat validation.
 *
 * WHY THIS MATTERS: on a ranked/competitive platform, WPM reported by the
 * client can never be trusted at face value — anyone can open devtools and
 * POST a fake result. The real defense is requiring the client to send
 * periodic checkpoints (correct_chars, total_chars, elapsed_ms) *during* the
 * race, timestamped by the server on arrival (see match_events table), then
 * recomputing the final WPM from those server-observed checkpoints rather
 * than trusting a single client-reported final number.
 *
 * This module provides the shared math; the actual route handler
 * (apps/web/src/app/api/match/submit/route.ts) is what calls it with real
 * checkpoint data pulled from the database.
 */

export interface TypingCheckpoint {
  correctChars: number;
  totalChars: number;
  elapsedMs: number;
}

/** Standard WPM formula: (correct characters / 5) / minutes elapsed. */
export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  const words = correctChars / 5;
  return Math.round((words / minutes) * 100) / 100;
}

export function calculateAccuracy(correctChars: number, totalChars: number): number {
  if (totalChars <= 0) return 100;
  return Math.round((correctChars / totalChars) * 10000) / 100;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  computedWpm: number;
  computedAccuracy: number;
}

/**
 * Recomputes WPM/accuracy from server-timestamped checkpoints and sanity-checks
 * the claimed final result against them. This is intentionally conservative —
 * false negatives (rejecting a legitimately fast but unusual run) are far
 * cheaper to handle (the player can contest / it can be manually reviewed)
 * than false positives (letting an obviously faked score onto a ranked
 * leaderboard undermine the entire platform's credibility).
 */
export function validateMatchResult(
  checkpoints: TypingCheckpoint[],
  claimedWpm: number,
  claimedAccuracy: number
): ValidationResult {
  if (checkpoints.length === 0) {
    return {
      isValid: false,
      reason: "No checkpoints recorded",
      computedWpm: 0,
      computedAccuracy: 0,
    };
  }

  const last = checkpoints[checkpoints.length - 1];
  if (!last) {
    return {
      isValid: false,
      reason: "No checkpoints recorded",
      computedWpm: 0,
      computedAccuracy: 0,
    };
  }

  const computedWpm = calculateWpm(last.correctChars, last.elapsedMs);
  const computedAccuracy = calculateAccuracy(last.correctChars, last.totalChars);

  // Absolute ceiling: the fastest verified human typists peak around
  // 200-220 WPM in short bursts. Anything meaningfully above that on a
  // full passage is not a real human result.
  if (computedWpm > 250) {
    return {
      isValid: false,
      reason: `Computed WPM (${computedWpm}) exceeds plausible human maximum`,
      computedWpm,
      computedAccuracy,
    };
  }

  // The client-claimed number must be reasonably close to what we
  // independently computed from server-timestamped checkpoints.
  const wpmDifference = Math.abs(claimedWpm - computedWpm);
  if (wpmDifference > computedWpm * 0.15 + 5) {
    return {
      isValid: false,
      reason: `Claimed WPM (${claimedWpm}) diverges too far from server-computed WPM (${computedWpm})`,
      computedWpm,
      computedAccuracy,
    };
  }

  // Checkpoint cadence sanity check: too few checkpoints for the elapsed
  // time suggests the client isn't actually reporting live progress (e.g. a
  // single fabricated final POST rather than genuine periodic updates).
  const totalElapsedSeconds = last.elapsedMs / 1000;
  const expectedMinimumCheckpoints = Math.floor(totalElapsedSeconds / 5); // one per ~5s minimum
  if (checkpoints.length < expectedMinimumCheckpoints && totalElapsedSeconds > 10) {
    return {
      isValid: false,
      reason: "Insufficient checkpoint cadence for claimed race duration",
      computedWpm,
      computedAccuracy,
    };
  }

  const accuracyDifference = Math.abs(claimedAccuracy - computedAccuracy);
  if (accuracyDifference > 5) {
    return {
      isValid: false,
      reason: `Claimed accuracy (${claimedAccuracy}) diverges from computed accuracy (${computedAccuracy})`,
      computedWpm,
      computedAccuracy,
    };
  }

  return { isValid: true, computedWpm, computedAccuracy };
}

export interface DerivedResult {
  wpm: number;
  accuracy: number;
  isPlausible: boolean;
  reason?: string;
}

/**
 * For ranked matches we don't need a "claimed" number from the client at
 * all — every checkpoint already arrived with a server timestamp, so the
 * final result can be derived entirely from data the client couldn't have
 * forged. This is stricter than validateMatchResult() above (which exists
 * for the case where you *do* have a claimed value to sanity-check against).
 */
export function deriveFinalResult(checkpoints: TypingCheckpoint[]): DerivedResult {
  if (checkpoints.length === 0) {
    return { wpm: 0, accuracy: 0, isPlausible: false, reason: "No checkpoints recorded" };
  }

  const last = checkpoints[checkpoints.length - 1];
  if (!last) {
    return { wpm: 0, accuracy: 0, isPlausible: false, reason: "No checkpoints recorded" };
  }

  const wpm = calculateWpm(last.correctChars, last.elapsedMs);
  const accuracy = calculateAccuracy(last.correctChars, last.totalChars);

  if (wpm > 250) {
    return {
      wpm,
      accuracy,
      isPlausible: false,
      reason: `WPM (${wpm}) exceeds plausible human maximum`,
    };
  }

  // Progress must be monotonically non-decreasing across checkpoints —
  // correctChars going backwards over time isn't possible in a real race.
  for (let i = 1; i < checkpoints.length; i++) {
    const prev = checkpoints[i - 1];
    const curr = checkpoints[i];
    if (!prev || !curr) continue;
    if (curr.correctChars < prev.correctChars || curr.elapsedMs < prev.elapsedMs) {
      return { wpm, accuracy, isPlausible: false, reason: "Non-monotonic checkpoint sequence" };
    }
  }

  return { wpm, accuracy, isPlausible: true };
}
