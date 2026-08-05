"use client";

import { useState } from "react";
import { TimedTypingRace, type TimedRaceResult } from "@/components/timed-typing-race";
import { ResultsScreen } from "@/components/results-screen";
import { Button } from "@keyclash/ui";
import { generateTextForMode } from "@keyclash/shared";
import {
  TIME_MODE_DURATIONS,
  WORDS_MODE_COUNTS,
  type GameModeConfig,
  type GameModeKind,
} from "@keyclash/game-engine";

type Phase = "select" | "racing" | "done";

const MODE_TABS: { kind: GameModeKind; label: string }[] = [
  { kind: "time", label: "time" },
  { kind: "words", label: "words" },
  { kind: "quote", label: "quote" },
  { kind: "numbers", label: "numbers" },
  { kind: "punctuation", label: "punctuation" },
  { kind: "zen", label: "zen" },
  { kind: "custom", label: "custom" },
];

export function PracticeSession({ caretColor }: { caretColor: string }) {
  const [phase, setPhase] = useState<Phase>("select");
  const [activeTab, setActiveTab] = useState<GameModeKind>("time");
  const [mode, setMode] = useState<GameModeConfig>({ kind: "time", durationSeconds: 30 });
  const [text, setText] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [result, setResult] = useState<TimedRaceResult | null>(null);
  const [rewards, setRewards] = useState<{ xpAwarded: number; coinsAwarded: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startRace(selectedMode: GameModeConfig) {
    setMode(selectedMode);
    setText(generateTextForMode(selectedMode));
    setPhase("racing");
  }

  function startCustomRace() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const customMode: GameModeConfig = { kind: "custom", customText: trimmed };
    setMode(customMode);
    setText(generateTextForMode(customMode));
    setPhase("racing");
  }

  async function handleComplete(raceResult: TimedRaceResult) {
    setResult(raceResult);
    setPhase("done");

    try {
      const res = await fetch("/api/match/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modeKind: mode.kind,
          durationSeconds: mode.durationSeconds ?? null,
          textContent: text,
          wpm: raceResult.wpm,
          accuracy: raceResult.accuracy,
          stats: {
            rawWpm: raceResult.rawWpm,
            consistency: raceResult.consistency,
            correctWords: raceResult.correctWords,
            incorrectWords: raceResult.incorrectWords,
            totalKeystrokes: raceResult.totalKeystrokes,
            correctKeystrokes: raceResult.correctKeystrokes,
            mistakes: raceResult.mistakes,
            completionPct: raceResult.completionPct,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) setRewards(data);
      else setError(data.error ?? "Failed to save result");
    } catch (err) {
      setError("Result didn't save — check your connection.");
      console.error(err);
    }
  }

  if (phase === "select") {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* Row 1: mode tabs — compact pills in a single row, Monkeytype-style */}
        <div className="flex flex-wrap items-center justify-center gap-1 rounded-full border border-kc-border bg-kc-surface px-2 py-1.5">
          {MODE_TABS.map((tab) => (
            <button
              key={tab.kind}
              onClick={() => setActiveTab(tab.kind)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                activeTab === tab.kind
                  ? "bg-kc-accent text-black"
                  : "text-kc-ink-muted hover:text-kc-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 2: options for whichever mode tab is active */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {activeTab === "time" &&
            TIME_MODE_DURATIONS.map((d) => (
              <PillButton key={d} onClick={() => startRace({ kind: "time", durationSeconds: d })}>
                {d}
              </PillButton>
            ))}

          {activeTab === "words" &&
            WORDS_MODE_COUNTS.map((w) => (
              <PillButton key={w} onClick={() => startRace({ kind: "words", wordCount: w })}>
                {w}
              </PillButton>
            ))}

          {activeTab === "quote" && (
            <PillButton onClick={() => startRace({ kind: "quote" })}>start</PillButton>
          )}

          {activeTab === "numbers" && (
            <PillButton onClick={() => startRace({ kind: "numbers", wordCount: 25 })}>
              start
            </PillButton>
          )}

          {activeTab === "punctuation" && (
            <PillButton onClick={() => startRace({ kind: "punctuation", wordCount: 25 })}>
              start
            </PillButton>
          )}

          {activeTab === "zen" && (
            <PillButton onClick={() => startRace({ kind: "zen" })}>start</PillButton>
          )}

          {activeTab === "custom" && (
            <div className="w-full max-w-xl space-y-3">
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Paste or type the text you want to race against…"
                rows={3}
                className="w-full rounded-lg border border-kc-border bg-kc-surface-2 p-3 text-sm text-kc-ink outline-none focus:border-kc-accent"
              />
              <div className="flex justify-center">
                <Button onClick={startCustomRace} disabled={!customInput.trim()}>
                  Start custom race
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "done" && result) {
    return (
      <ResultsScreen
        stats={{
          wpm: result.wpm,
          rawWpm: result.rawWpm,
          accuracy: result.accuracy,
          correctWords: result.correctWords,
          incorrectWords: result.incorrectWords,
          totalKeystrokes: result.totalKeystrokes,
          mistakes: result.mistakes,
          consistency: result.consistency,
          completionPct: result.completionPct,
          xpAwarded: rewards?.xpAwarded,
          coinsAwarded: rewards?.coinsAwarded,
        }}
        onPrimaryAction={() => {
          setPhase("select");
          setResult(null);
          setRewards(null);
          setError(null);
        }}
        primaryActionLabel="Race again"
      />
    );
  }

  return (
    <div className="flex flex-col items-center">
      {error && <p className="mb-3 text-sm text-kc-danger">{error}</p>}
      <TimedTypingRace
        mode={mode}
        text={text}
        caretColor={caretColor}
        onComplete={handleComplete}
        onRestartShortcut={() => {
          setPhase("select");
          setResult(null);
          setRewards(null);
          setError(null);
        }}
      />
    </div>
  );
}

function PillButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-kc-border bg-kc-surface px-4 py-1.5 text-sm font-medium text-kc-ink transition-colors hover:border-kc-accent hover:text-kc-accent"
    >
      {children}
    </button>
  );
}
