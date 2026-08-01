"use client";

import { useState } from "react";
import { TypingRace, type TypingRaceResult } from "@/components/typing-race";
import { Card, CardContent } from "@keyclash/ui";

export function DailySession({
  text,
  caretColor,
  challengeDate,
}: {
  text: string;
  caretColor: string;
  challengeDate: string;
}) {
  const [result, setResult] = useState<TypingRaceResult | null>(null);
  const [rewards, setRewards] = useState<{ xpAwarded: number; coinsAwarded: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete(raceResult: TypingRaceResult) {
    setResult(raceResult);
    try {
      const res = await fetch("/api/daily/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeDate, wpm: raceResult.wpm, accuracy: raceResult.accuracy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setRewards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit result");
    }
  }

  if (result) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="space-y-4 py-8">
          <p className="font-display text-4xl font-extrabold text-kc-accent">
            {Math.round(result.wpm)} <span className="text-lg text-kc-ink-muted">wpm</span>
          </p>
          <p className="text-kc-ink-muted">{result.accuracy}% accuracy</p>
          {rewards && (
            <p className="text-sm text-kc-ink">
              +{rewards.xpAwarded} XP · +{rewards.coinsAwarded} coins
            </p>
          )}
          {error && <p className="text-sm text-kc-danger">{error}</p>}
          <p className="text-xs text-kc-ink-muted">Come back tomorrow for a new challenge.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex justify-center">
      <TypingRace text={text} caretColor={caretColor} onComplete={handleComplete} />
    </div>
  );
}
