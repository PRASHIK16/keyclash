/**
 * Game mode configuration.
 *
 * Only "time", "words", and "zen" are implemented in this batch. "quote",
 * "numbers", "punctuation", and "programming" are listed here deliberately —
 * same pattern as ProviderId in @keyclash/ai's factory — so:
 *   1. TypeScript flags any code that tries to select an unimplemented mode,
 *   2. adding a mode later is "write a text generator + register it here",
 *      not a rewrite of the race engine itself.
 */
export type GameModeKind =
  "time" | "words" | "zen" | "custom" | "quote" | "numbers" | "punctuation" | "programming";

export interface GameModeConfig {
  kind: GameModeKind;
  /** Required for "time" mode. Seconds the race runs for. */
  durationSeconds?: number;
  /** Required for "words" mode. Number of words to type. */
  wordCount?: number;
  /** Required for "custom" mode. User-supplied text to race against. */
  customText?: string;
}

export const TIME_MODE_DURATIONS = [15, 30, 60, 120] as const;
export const WORDS_MODE_COUNTS = [10, 25, 50, 100] as const;

export class ModeNotImplementedError extends Error {
  constructor(kind: GameModeKind) {
    super(
      `Game mode "${kind}" is not yet implemented. Only "time", "words", and ` +
        `"zen" ship in this batch. To add it: write a text generator in ` +
        `packages/shared/src/word-banks.ts and register it in the mode's ` +
        `text-generation switch — no changes needed to the race engine itself.`
    );
    this.name = "ModeNotImplementedError";
  }
}
