"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, type UserSettings } from "@keyclash/shared";

/**
 * localStorage is only available client-side, so this hook always starts
 * with DEFAULT_SETTINGS on the server-rendered pass (avoiding a hydration
 * mismatch) and syncs from localStorage in an effect immediately after
 * mount. Every consumer of settings should read them through this hook,
 * not touch localStorage directly — that keeps persistence logic in one place.
 */
export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserSettings>;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // Corrupt or inaccessible localStorage — fall back to defaults silently.
    }
    setLoaded(true);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Storage full or blocked — the in-memory setting still applies for
          // this session, it just won't persist across a reload.
        }
        return next;
      });
    },
    []
  );

  return { settings, updateSetting, loaded };
}
