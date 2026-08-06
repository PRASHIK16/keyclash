"use client";

import { Sun, Moon } from "lucide-react";
import { useSettings } from "@/lib/use-settings";

export function ThemeToggle() {
  const { settings, updateSetting, loaded } = useSettings();

  if (!loaded) return null;

  const isDark = settings.theme === "dark";

  return (
    <button
      onClick={() => updateSetting("theme", isDark ? "light" : "dark")}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="rounded-md p-2 text-kc-ink-muted transition-colors hover:bg-kc-surface-2 hover:text-kc-ink"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
