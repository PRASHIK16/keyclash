/**
 * User settings. Persisted to localStorage (see apps/web/src/lib/use-settings.ts)
 * rather than the database — these are device-local preferences (font size,
 * sound), not account data that needs to follow you across devices. If that
 * changes later, this is the one interface to extend.
 */
export type UserSettings = {
  theme: "dark" | "light";
  fontSize: "sm" | "md" | "lg";
  caretStyle: "line" | "block" | "underline";
  soundEffects: boolean;
  liveWpm: boolean;
  liveAccuracy: boolean;
  restartShortcut: "tab" | "escape";
  /**
   * "en" is the only language with real word-bank content right now.
   * "es"/"fr" are listed so the selector UI can show them as real options
   * with a "coming soon" state rather than not existing at all — same
   * honesty pattern as ModeNotImplementedError in @keyclash/game-engine.
   * Selecting them is blocked in the settings UI until content exists.
   */
  language: "en" | "es" | "fr";
  difficulty: "normal" | "expert" | "master";
  blindMode: boolean;
  focusMode: boolean;
  animationSpeed: "slow" | "normal" | "fast";
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: "dark",
  fontSize: "md",
  caretStyle: "line",
  soundEffects: false,
  liveWpm: true,
  liveAccuracy: true,
  restartShortcut: "tab",
  language: "en",
  difficulty: "normal",
  blindMode: false,
  focusMode: false,
  animationSpeed: "normal",
};

export const SETTINGS_STORAGE_KEY = "keyclash:settings";

export const FONT_SIZE_CLASSES: Record<UserSettings["fontSize"], string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

export const ANIMATION_SPEED_MULTIPLIER: Record<UserSettings["animationSpeed"], number> = {
  slow: 1.6,
  normal: 1,
  fast: 0.55,
};
