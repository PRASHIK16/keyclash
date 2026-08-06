"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/use-settings";
import { ANIMATION_SPEED_MULTIPLIER } from "@keyclash/shared";

/**
 * Mounted once in the root layout. Doesn't render anything — it just keeps
 * `document.documentElement`'s CSS custom properties in sync with the
 * user's persisted settings, so any component's CSS (globals.css keyframe
 * durations) can reference `var(--kc-anim-speed)` without each component
 * needing its own copy of this logic.
 */
export function GlobalSettingsEffects() {
  const { settings, loaded } = useSettings();

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.style.setProperty(
      "--kc-anim-speed",
      String(ANIMATION_SPEED_MULTIPLIER[settings.animationSpeed])
    );
  }, [loaded, settings.animationSpeed]);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(settings.theme);
  }, [loaded, settings.theme]);

  return null;
}
