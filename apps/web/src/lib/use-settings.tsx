"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, type UserSettings } from "@keyclash/shared";

/**
 * ROOT CAUSE FIX: this used to be a plain hook with its own `useState`
 * inside it. Every component that called `useSettings()` got its own
 * independent, disconnected copy of the settings — clicking the theme
 * toggle updated ONLY that component's local copy (and localStorage), but
 * every other component reading settings (GlobalSettingsEffects, which is
 * the thing that actually flips the <html> class) never found out, because
 * there was never one shared state to begin with. That's why the toggle
 * "changed" but the app didn't visibly update everywhere.
 *
 * Fix: one shared state via Context, provided once at the root layout.
 * `useSettings()` now reads/writes that single shared instance — every
 * consumer re-renders together, because they're all subscribed to the same
 * state rather than each holding a private snapshot of it.
 */

interface SettingsContextValue {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  loaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
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

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error(
      "useSettings() must be used within <SettingsProvider>. Check apps/web/src/app/layout.tsx."
    );
  }
  return ctx;
}
