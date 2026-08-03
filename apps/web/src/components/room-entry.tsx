"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@keyclash/ui";
import { TIME_MODE_DURATIONS, WORDS_MODE_COUNTS } from "@keyclash/game-engine";

export function RoomEntry() {
  const router = useRouter();
  const [modeKind, setModeKind] = useState<"time" | "words">("time");
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [wordTarget, setWordTarget] = useState(25);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modeKind, durationSeconds, wordTarget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create room");
      router.push(`/play/room/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join room");
      router.push(`/play/room/${joinCode.trim().toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={modeKind === "time" ? "primary" : "secondary"}
              onClick={() => setModeKind("time")}
            >
              Time
            </Button>
            <Button
              variant={modeKind === "words" ? "primary" : "secondary"}
              onClick={() => setModeKind("words")}
            >
              Words
            </Button>
          </div>

          {modeKind === "time" ? (
            <div className="flex flex-wrap gap-2">
              {TIME_MODE_DURATIONS.map((d) => (
                <Button
                  key={d}
                  variant={durationSeconds === d ? "primary" : "secondary"}
                  onClick={() => setDurationSeconds(d)}
                >
                  {d}s
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {WORDS_MODE_COUNTS.map((w) => (
                <Button
                  key={w}
                  variant={wordTarget === w ? "primary" : "secondary"}
                  onClick={() => setWordTarget(w)}
                >
                  {w}
                </Button>
              ))}
            </div>
          )}

          <Button onClick={handleCreate} disabled={busy} className="w-full">
            Create room
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Join a room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            maxLength={6}
            className="w-full rounded-lg border border-kc-border bg-kc-surface-2 px-3 py-2 text-center font-mono text-lg tracking-widest text-kc-ink outline-none focus:border-kc-accent"
          />
          <Button
            onClick={handleJoin}
            disabled={busy || !joinCode.trim()}
            variant="secondary"
            className="w-full"
          >
            Join room
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-center text-sm text-kc-danger">{error}</p>}
    </div>
  );
}
