/**
 * Race statistics engine. Split from validation.ts (which is specifically
 * about server-side anti-cheat derivation from checkpoints) because these
 * functions apply to ANY race — practice, daily, or ranked — regardless of
 * whether the result needs anti-cheat scrutiny.
 */

export interface WordComparisonResult {
  correctWords: number;
  incorrectWords: number;
}

/** Compares typed words to target words, word by word, up to however many were attempted. */
export function compareWords(targetText: string, typedText: string): WordComparisonResult {
  const targetWords = targetText.trim().split(/\s+/);
  const typedWords = typedText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  let correctWords = 0;
  let incorrectWords = 0;

  for (let i = 0; i < typedWords.length; i++) {
    if (typedWords[i] === targetWords[i]) {
      correctWords++;
    } else {
      incorrectWords++;
    }
  }

  return { correctWords, incorrectWords };
}

/**
 * Consistency score (0-100), the same concept Monkeytype popularized:
 * how steady your WPM was across the race, not just its average. Computed
 * from periodic WPM samples using coefficient of variation — lower
 * variation relative to the mean produces a higher score. A perfectly
 * steady typist scores 100; wildly bursty typing scores low even with a
 * high average WPM.
 */
export function calculateConsistency(wpmSamples: number[]): number {
  const samples = wpmSamples.filter((w) => w > 0);
  if (samples.length < 2) return 100;

  const mean = samples.reduce((sum, w) => sum + w, 0) / samples.length;
  if (mean === 0) return 100;

  const variance = samples.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / samples.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;

  return Math.max(0, Math.min(100, Math.round(100 - coefficientOfVariation * 100)));
}

/** Raw WPM counts every typed character regardless of correctness — the "how fast were your fingers moving" number, as distinct from net WPM (correct chars only). */
export function calculateRawWpm(totalTypedChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return Math.round((totalTypedChars / 5 / minutes) * 100) / 100;
}

export interface FullRaceStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctWords: number;
  incorrectWords: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  mistakes: number;
  consistency: number;
  completionPct: number;
  timePlayedMs: number;
}
