/** Progression math — XP/coin rewards and level curve. Kept simple and transparent for V1. */

export function calculateXpReward(
  wpm: number,
  accuracy: number,
  mode: "ranked" | "practice" | "daily"
): number {
  const baseXp = Math.round(wpm * (accuracy / 100));
  const modeMultiplier = mode === "ranked" ? 1.5 : mode === "daily" ? 1.25 : 1;
  return Math.round(baseXp * modeMultiplier);
}

export function calculateCoinReward(wpm: number, accuracy: number, won: boolean): number {
  const base = Math.round(wpm / 4);
  return won ? base * 2 : base;
}

/** XP required to reach a given level. Simple quadratic curve — tune later once real usage data exists. */
export function xpRequiredForLevel(level: number): number {
  return 100 * level * level;
}

export function calculateLevelFromXp(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
} {
  let level = 1;
  while (totalXp >= xpRequiredForLevel(level + 1)) {
    level++;
  }
  const xpAtLevelStart = xpRequiredForLevel(level);
  const xpForNextLevel = xpRequiredForLevel(level + 1) - xpAtLevelStart;
  const xpIntoLevel = totalXp - xpAtLevelStart;
  return { level, xpIntoLevel, xpForNextLevel };
}
