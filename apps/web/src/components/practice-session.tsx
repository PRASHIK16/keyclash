"use client";

import { useState } from "react";
import { TimedTypingRace, type TimedRaceResult } from "@/components/timed-typing-race";
import { ResultsScreen } from "@/components/results-screen";
import { Card, CardContent, Button } from "@keyclash/ui";
import { generateTextForMode } from "@keyclash/shared";
import { TIME_MODE_DURATIONS, WORDS_MODE_COUNTS, type GameModeConfig } from "@keyclash/game-engine";

type Phase = "select" | "racing" | "done";

export function PracticeSession({ caretColor }: { caretColor: string }) {
  const [phase, setPhase] = useState<Phase>("select");
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
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-sm font-semibold text-kc-ink">Time</p>
            <div className="flex flex-wrap gap-2">
              {TIME_MODE_DURATIONS.map((d) => (
                <Button
                  key={d}
                  variant="secondary"
                  onClick={() => startRace({ kind: "time", durationSeconds: d })}
                >
                  {d}s
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-sm font-semibold text-kc-ink">Words</p>
            <div className="flex flex-wrap gap-2">
              {WORDS_MODE_COUNTS.map((w) => (
                <Button
                  key={w}
                  variant="secondary"
                  onClick={() => startRace({ kind: "words", wordCount: w })}
                >
                  {w}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="space-y-3 py-6">
              <p className="text-sm font-semibold text-kc-ink">Quote</p>
              <Button
                variant="secondary"
                onClick={() => startRace({ kind: "quote" })}
                className="w-full"
              >
                Random quote
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 py-6">
              <p className="text-sm font-semibold text-kc-ink">Numbers</p>
              <Button
                variant="secondary"
                onClick={() => startRace({ kind: "numbers", wordCount: 25 })}
                className="w-full"
              >
                25 numbers
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 py-6">
              <p className="text-sm font-semibold text-kc-ink">Punctuation</p>
              <Button
                variant="secondary"
                onClick={() => startRace({ kind: "punctuation", wordCount: 25 })}
                className="w-full"
              >
                25 words
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="py-6">
            <p className="mb-3 text-sm font-semibold text-kc-ink">Zen</p>
            <Button variant="secondary" onClick={() => startRace({ kind: "zen" })}>
              No timer — type until you&apos;re done
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-sm font-semibold text-kc-ink">Custom text</p>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Paste or type the text you want to race against…"
              rows={4}
              className="w-full rounded-lg border border-kc-border bg-kc-surface-2 p-3 text-sm text-kc-ink outline-none focus:border-kc-accent"
            />
            <Button onClick={startCustomRace} disabled={!customInput.trim()}>
              Start custom race
            </Button>
          </CardContent>
        </Card>
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
