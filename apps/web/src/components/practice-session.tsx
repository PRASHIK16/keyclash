"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TypingRace, type TypingRaceResult } from "@/components/typing-race";
import { Button, Card, CardContent } from "@keyclash/ui";

export function PracticeSession({
  text,
  caretColor,
  mode,
}: {
  text: string;
  caretColor: string;
  mode: "practice_classic" | "practice_zen";
}) {
  const router = useRouter();
  const [result, setResult] = useState<TypingRaceResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete(raceResult: TypingRaceResult) {
    setResult(raceResult);
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/match/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          textContent: text,
          wpm: raceResult.wpm,
          accuracy: raceResult.accuracy,
        }),
      });
      if (!res.ok) throw new Error("Failed to save result");
    } catch (err) {
      setError("Result didn't save — check your connection and try the next race.");
      console.error(err);
    } finally {
      setSaving(false);
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
          {saving && <p className="text-xs text-kc-ink-muted">Saving…</p>}
          {error && <p className="text-xs text-kc-danger">{error}</p>}
          <Button onClick={() => router.refresh()} className="w-full">
            Race again
          </Button>
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
