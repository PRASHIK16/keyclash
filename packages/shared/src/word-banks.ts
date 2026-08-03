import type { GameModeConfig } from "@keyclash/game-engine";
import { ModeNotImplementedError } from "@keyclash/game-engine";

/**
 * Common English words for Time and Words modes — the same category
 * Monkeytype's default mode draws from (short, common, no punctuation),
 * built independently here rather than reusing any external word list.
 *
 * Quote/Numbers/Punctuation/Programming banks are Batch 2 — this file only
 * needs a `generateWordStream` export today; adding a mode later means
 * adding a sibling generator here (e.g. `generateQuoteText`), not touching
 * any consuming component.
 */
export const COMMON_WORDS: string[] = [
  "the",
  "of",
  "and",
  "a",
  "to",
  "in",
  "is",
  "you",
  "that",
  "it",
  "he",
  "was",
  "for",
  "on",
  "are",
  "as",
  "with",
  "his",
  "they",
  "at",
  "be",
  "this",
  "have",
  "from",
  "or",
  "one",
  "had",
  "by",
  "word",
  "but",
  "not",
  "what",
  "all",
  "were",
  "we",
  "when",
  "your",
  "can",
  "said",
  "there",
  "use",
  "each",
  "which",
  "she",
  "how",
  "their",
  "will",
  "up",
  "other",
  "about",
  "out",
  "many",
  "then",
  "them",
  "these",
  "so",
  "some",
  "her",
  "would",
  "make",
  "like",
  "him",
  "into",
  "time",
  "has",
  "look",
  "two",
  "more",
  "write",
  "go",
  "see",
  "number",
  "no",
  "way",
  "could",
  "people",
  "than",
  "first",
  "water",
  "been",
  "call",
  "who",
  "its",
  "now",
  "find",
  "long",
  "down",
  "day",
  "did",
  "get",
  "come",
  "made",
  "may",
  "part",
  "over",
  "new",
  "sound",
  "take",
  "only",
  "little",
  "work",
  "know",
  "place",
  "year",
  "live",
  "back",
  "give",
  "most",
  "very",
  "after",
  "thing",
  "our",
  "just",
  "name",
  "good",
  "sentence",
  "man",
  "think",
  "say",
  "great",
  "where",
  "help",
  "through",
  "much",
  "before",
  "line",
  "right",
  "too",
  "mean",
  "old",
  "any",
  "same",
  "tell",
  "boy",
  "follow",
  "came",
  "want",
  "show",
  "also",
  "around",
  "form",
  "three",
  "small",
  "set",
  "put",
  "end",
  "does",
  "another",
  "well",
  "large",
  "must",
  "big",
  "even",
  "such",
  "because",
  "turn",
  "here",
  "why",
  "ask",
  "went",
  "men",
  "read",
  "need",
  "land",
  "different",
  "home",
  "us",
  "move",
  "try",
  "kind",
  "hand",
  "picture",
  "again",
  "change",
  "off",
  "play",
  "spell",
  "air",
  "away",
  "animal",
];

/**
 * Generates a space-joined word stream. `count` is exact for Words mode; for
 * Time mode, pass a generously oversized count (see TIME_MODE_BUFFER_MULTIPLIER
 * usage in the race component) so the typist never runs out of text before
 * the timer ends, without needing dynamic mid-race text extension.
 */
export function generateWordStream(count: number): string {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * COMMON_WORDS.length);
    words.push(COMMON_WORDS[index] ?? "the");
  }
  return words.join(" ");
}

/**
 * Fastest plausible human typing is ~250 WPM sustained. At that ceiling,
 * a player could type roughly (250/60) ≈ 4.2 words/second. We generate a
 * buffer generous enough to never run dry even at that extreme, for any
 * duration up to the longest Time mode option (120s).
 */
export function wordBufferSizeForDuration(durationSeconds: number): number {
  return Math.ceil(durationSeconds * 4.5) + 20;
}

/**
 * Original short lines written for Keyclash — deliberately not sourced from
 * any existing quote database, to avoid attribution/copyright questions
 * entirely rather than manage them.
 */
export const QUOTES: string[] = [
  "Speed without accuracy is just noise dressed up as progress.",
  "Every great typist was once someone who refused to stop after a bad run.",
  "The keyboard does not care how you feel about Mondays.",
  "Consistency beats intensity when the race is long enough.",
  "A clean line of text is a small, honest kind of art.",
  "Practice does not make perfect, it makes permanent, so practice well.",
  "The fastest way to type a word correctly is to have typed it wrong before.",
  "Discipline looks boring right up until it starts winning.",
  "Small daily reps compound into skills nobody can take from you.",
  "Errors are not the opposite of progress, they are the proof of it.",
];

export function generateQuoteText(): string {
  const index = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[index] ?? QUOTES[0]!;
}

export function generateNumbersText(wordCount: number): string {
  const chunks: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const length = 1 + Math.floor(Math.random() * 3);
    let chunk = "";
    for (let d = 0; d < length; d++) {
      chunk += Math.floor(Math.random() * 10).toString();
    }
    chunks.push(chunk);
  }
  return chunks.join(" ");
}

const PUNCTUATION_WRAPPERS: Array<(word: string) => string> = [
  (w) => `${w},`,
  (w) => `${w}.`,
  (w) => `"${w}"`,
  (w) => `${w.charAt(0).toUpperCase()}${w.slice(1)}`,
  (w) => `(${w})`,
  (w) => `${w}'s`,
  (w) => `${w};`,
  (w) => `${w}!`,
];

export function generatePunctuationText(wordCount: number): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const base = COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)] ?? "the";
    const shouldWrap = Math.random() < 0.35;
    words.push(
      shouldWrap
        ? PUNCTUATION_WRAPPERS[Math.floor(Math.random() * PUNCTUATION_WRAPPERS.length)]!(base)
        : base
    );
  }
  return words.join(" ");
}

/**
 * Single entry point for "give me race text for this mode." Practice mode
 * and any future caller should go through this rather than reaching for
 * individual generators directly — it's the one place that has to change
 * when a new mode's content generator is added.
 */
export function generateTextForMode(mode: GameModeConfig): string {
  switch (mode.kind) {
    case "time":
      return generateWordStream(wordBufferSizeForDuration(mode.durationSeconds ?? 30));
    case "words":
      return generateWordStream(mode.wordCount ?? 25);
    case "zen":
      return generateWordStream(200);
    case "quote":
      return generateQuoteText();
    case "numbers":
      return generateNumbersText(mode.wordCount ?? 25);
    case "punctuation":
      return generatePunctuationText(mode.wordCount ?? 25);
    case "programming":
      throw new ModeNotImplementedError(mode.kind);
    default: {
      const _exhaustive: never = mode.kind;
      throw new ModeNotImplementedError(_exhaustive);
    }
  }
}
