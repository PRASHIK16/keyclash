/**
 * User settings. Persisted to localStorage (see apps/web/src/lib/use-settings.ts)
 * rather than the database — these are device-local preferences (font size,
 * sound), not account data that needs to follow you across devices. If that
 * changes later, this is the one interface to extend.
 */
export interface UserSettings {
  fontSize: "sm" | "md" | "lg";
  caretStyle: "line" | "block" | "underline";
  soundEffects: boolean;
  liveWpm: boolean;
  liveAccuracy: boolean;
  restartShortcut: "tab" | "escape";
  language: "en";
}

export const DEFAULT_SETTINGS: UserSettings = {
  fontSize: "md",
  caretStyle: "line",
  soundEffects: false,
  liveWpm: true,
  liveAccuracy: true,
  restartShortcut: "tab",
  language: "en",
};

export const SETTINGS_STORAGE_KEY = "keyclash:settings";

export const FONT_SIZE_CLASSES: Record<UserSettings["fontSize"], string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};
