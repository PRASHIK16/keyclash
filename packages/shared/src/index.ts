export const APP_NAME = "Keyclash";

export const PRACTICE_TEXTS: string[] = [
  "The quick brown fox jumps over the lazy dog while the storm gathers on the horizon.",
  "Discipline is choosing between what you want now and what you want most in the long run.",
  "Every keystroke tells a story of patience, precision, and the pursuit of mastery.",
  "In the depths of winter, I finally learned that within me there lay an invincible summer.",
  "Code is read far more often than it is written, so clarity always outranks cleverness.",
];

export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.round(diffHour / 24);
  return `${diffDay}d ago`;
}

export function pickDeterministicDailyText(dateSeed: string, pool: string[]): string {
  let hash = 0;
  for (let i = 0; i < dateSeed.length; i++) {
    hash = (hash * 31 + dateSeed.charCodeAt(i)) >>> 0;
  }
  const item = pool[hash % pool.length];
  return item ?? pool[0] ?? "";
}
