"use client";

import { useSettings } from "@/lib/use-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@keyclash/ui";
import type { UserSettings } from "@keyclash/shared";

export function SettingsPanel() {
  const { settings, updateSetting, loaded } = useSettings();

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Race behavior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <SettingRow label="Difficulty">
            <SegmentedControl
              value={settings.difficulty}
              options={[
                { value: "normal", label: "Normal" },
                { value: "expert", label: "Expert" },
                { value: "master", label: "Master" },
              ]}
              onChange={(v) => updateSetting("difficulty", v as UserSettings["difficulty"])}
            />
          </SettingRow>
          <p className="text-xs text-kc-ink-muted">
            Normal: no penalty for mistakes. Expert/Master: the race ends immediately on your first
            mistake.
          </p>

          <ToggleRow
            label="Blind mode"
            description="Hide correct/incorrect coloring while typing — type by feel"
            checked={settings.blindMode}
            onChange={(v) => updateSetting("blindMode", v)}
          />
          <ToggleRow
            label="Focus mode"
            description="Fade everything except the typing area once a race starts"
            checked={settings.focusMode}
            onChange={(v) => updateSetting("focusMode", v)}
          />

          <SettingRow label="Animation speed">
            <SegmentedControl
              value={settings.animationSpeed}
              options={[
                { value: "slow", label: "Slow" },
                { value: "normal", label: "Normal" },
                { value: "fast", label: "Fast" },
              ]}
              onChange={(v) => updateSetting("animationSpeed", v as UserSettings["animationSpeed"])}
            />
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <SettingRow label="Theme">
            <SegmentedControl
              value={settings.theme}
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
              ]}
              onChange={(v) => updateSetting("theme", v as UserSettings["theme"])}
            />
          </SettingRow>

          <SettingRow label="Font size">
            <SegmentedControl
              value={settings.fontSize}
              options={[
                { value: "sm", label: "Small" },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large" },
              ]}
              onChange={(v) => updateSetting("fontSize", v as UserSettings["fontSize"])}
            />
          </SettingRow>

          <SettingRow label="Caret style">
            <SegmentedControl
              value={settings.caretStyle}
              options={[
                { value: "line", label: "Line" },
                { value: "block", label: "Block" },
                { value: "underline", label: "Underline" },
              ]}
              onChange={(v) => updateSetting("caretStyle", v as UserSettings["caretStyle"])}
            />
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Race display</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="Live WPM"
            description="Show your running words-per-minute while racing"
            checked={settings.liveWpm}
            onChange={(v) => updateSetting("liveWpm", v)}
          />
          <ToggleRow
            label="Live accuracy"
            description="Show your running accuracy while racing"
            checked={settings.liveAccuracy}
            onChange={(v) => updateSetting("liveAccuracy", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sound</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleRow
            label="Keystroke sound"
            description="A short click on every keystroke"
            checked={settings.soundEffects}
            onChange={(v) => updateSetting("soundEffects", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <SettingRow label="Restart shortcut">
            <SegmentedControl
              value={settings.restartShortcut}
              options={[
                { value: "tab", label: "Tab" },
                { value: "escape", label: "Escape" },
              ]}
              onChange={(v) =>
                updateSetting("restartShortcut", v as UserSettings["restartShortcut"])
              }
            />
          </SettingRow>

          <SettingRow label="Language">
            <SegmentedControl
              value={settings.language}
              options={[
                { value: "en", label: "English" },
                { value: "es", label: "Español (soon)" },
                { value: "fr", label: "Français (soon)" },
              ]}
              onChange={(v) => {
                if (v !== "en") return; // no word-bank content for these yet — see comment on UserSettings.language
                updateSetting("language", v as UserSettings["language"]);
              }}
            />
          </SettingRow>
          <p className="text-xs text-kc-ink-muted">
            Spanish and French are on the roadmap — the selector shows them so you know they&apos;re
            coming, but there&apos;s no word content for them yet, so selecting them is disabled for
            now.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-kc-ink">{label}</span>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-kc-ink">{label}</p>
        <p className="text-xs text-kc-ink-muted">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-kc-accent" : "bg-kc-surface-3"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-kc-border">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-kc-accent text-black"
              : "bg-kc-surface-2 text-kc-ink-muted hover:text-kc-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
