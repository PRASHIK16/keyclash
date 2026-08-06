"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TimedTypingRace, type TimedRaceResult } from "@/components/timed-typing-race";
import { ResultsScreen } from "@/components/results-screen";
import type { Checkpoint } from "@/components/typing-race";
import type { GameModeConfig } from "@keyclash/game-engine";
import type { PlayerRaceStats } from "@keyclash/database";

interface RaceRoomProps {
  matchId: string;
  textContent: string;
  modeKind: string;
  durationSeconds: number | null;
  userId: string;
  isPlayerOne: boolean;
  opponentUsername: string;
  caretColor: string;
}

interface CountdownPayload {
  startAt: number;
}
interface ProgressPayload {
  senderId: string;
  correctChars: number;
  totalChars: number;
}
interface FinishedPayload {
  senderId: string;
}

type Phase = "waiting_for_opponent" | "countdown" | "racing" | "waiting_for_result" | "done";

interface FinalResult {
  playerOneWpm: number;
  playerTwoWpm: number;
  playerOneAccuracy: number;
  playerTwoAccuracy: number;
  winnerId: string | null;
  playerOneRatingDelta: number;
  playerTwoRatingDelta: number;
  playerOneStats: PlayerRaceStats | null;
  playerTwoStats: PlayerRaceStats | null;
}

const COUNTDOWN_MS = 3000;

export function RaceRoom({
  matchId,
  textContent,
  modeKind,
  durationSeconds,
  userId,
  isPlayerOne,
  opponentUsername,
  caretColor,
}: RaceRoomProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("waiting_for_opponent");
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [opponentPresent, setOpponentPresent] = useState(false);
  const [result, setResult] = useState<FinalResult | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const mode: GameModeConfig = {
    kind: modeKind === "time" ? "time" : "zen",
    durationSeconds: durationSeconds ?? undefined,
  };

  function beginCountdown(startAt: number) {
    setPhase("countdown");
    const tick = () => {
      const remaining = Math.max(0, startAt - Date.now());
      setCountdownRemaining(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        setPhase("racing");
      } else {
        requestAnimationFrame(tick);
      }
    };
    tick();
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`match:${matchId}`, { config: { presence: { key: userId } } });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOpponentPresent(Object.keys(state).length >= 2);
      })
      .on("broadcast", { event: "countdown" }, ({ payload }: { payload: CountdownPayload }) => {
        beginCountdown(payload.startAt);
      })
      .on("broadcast", { event: "progress" }, ({ payload }: { payload: ProgressPayload }) => {
        if (payload.senderId !== userId) {
          setOpponentProgress(
            Math.min(100, Math.round((payload.correctChars / textContent.length) * 100))
          );
        }
      })
      .on("broadcast", { event: "finished" }, ({ payload }: { payload: FinishedPayload }) => {
        if (payload.senderId !== userId) attemptSubmit();
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ userId });
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, userId]);

  // Player one is the countdown authority. Calls beginCountdown() directly
  // for itself (Supabase doesn't echo a broadcast back to its own sender)
  // in addition to broadcasting for player two.
  useEffect(() => {
    if (!opponentPresent || !isPlayerOne || phase !== "waiting_for_opponent") return;
    const channel = channelRef.current;
    if (!channel) return;
    const startAt = Date.now() + COUNTDOWN_MS;
    channel.send({
      type: "broadcast",
      event: "countdown",
      payload: { startAt } satisfies CountdownPayload,
    });
    beginCountdown(startAt);
  }, [opponentPresent, isPlayerOne, phase]);

  function handleProgress(correctChars: number, totalChars: number) {
    channelRef.current?.send({
      type: "broadcast",
      event: "progress",
      payload: { senderId: userId, correctChars, totalChars } satisfies ProgressPayload,
    });
  }

  async function handleCheckpoint(checkpoint: Checkpoint) {
    const supabase = createClient();
    await supabase.from("match_events").insert({
      match_id: matchId,
      player_id: userId,
      correct_chars: checkpoint.correctChars,
      total_chars: checkpoint.totalChars,
      elapsed_ms: checkpoint.elapsedMs,
    });
  }

  // IMPORTANT: this fires independently for each player when THEIR OWN
  // timer reaches zero — nobody finishing early ends the match for the
  // other side. Both players' TimedTypingRace components started counting
  // down from the exact same synced startAt, so both hit zero at
  // essentially the same wall-clock moment regardless of typing speed.
  async function handleComplete(raceResult: TimedRaceResult) {
    setPhase("waiting_for_result");

    await fetch("/api/match/ranked/report-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        stats: {
          rawWpm: raceResult.rawWpm,
          consistency: raceResult.consistency,
          correctWords: raceResult.correctWords,
          incorrectWords: raceResult.incorrectWords,
          totalKeystrokes: raceResult.totalKeystrokes,
          correctKeystrokes: raceResult.correctKeystrokes,
          mistakes: raceResult.mistakes,
          completionPct: raceResult.completionPct,
        } satisfies PlayerRaceStats,
      }),
    });

    channelRef.current?.send({
      type: "broadcast",
      event: "finished",
      payload: { senderId: userId } satisfies FinishedPayload,
    });
    await attemptSubmit();
  }

  async function attemptSubmit() {
    try {
      const res = await fetch("/api/match/ranked/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      if (res.status === 202) return;
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setPhase("done");
      }
    } catch {
      // Network hiccup — the opponent's "finished" broadcast, or this
      // client's own next attempt, will retry.
    }
  }

  if (phase === "done" && result) {
    const won = result.winnerId === userId;
    const isDraw = result.winnerId === null;
    const myDelta = isPlayerOne ? result.playerOneRatingDelta : result.playerTwoRatingDelta;
    const myWpm = isPlayerOne ? result.playerOneWpm : result.playerTwoWpm;
    const myAccuracy = isPlayerOne ? result.playerOneAccuracy : result.playerTwoAccuracy;
    const opponentWpm = isPlayerOne ? result.playerTwoWpm : result.playerOneWpm;
    const myStats = isPlayerOne ? result.playerOneStats : result.playerTwoStats;

    return (
      <ResultsScreen
        stats={{
          wpm: myWpm,
          accuracy: myAccuracy,
          rawWpm: myStats?.rawWpm,
          consistency: myStats?.consistency,
          correctWords: myStats?.correctWords,
          incorrectWords: myStats?.incorrectWords,
          totalKeystrokes: myStats?.totalKeystrokes,
          mistakes: myStats?.mistakes,
          completionPct: myStats?.completionPct,
        }}
        ranked={{
          outcome: isDraw ? "draw" : won ? "win" : "loss",
          ratingDelta: myDelta,
          opponentUsername,
          opponentWpm,
        }}
        onPrimaryAction={() => router.push("/play/ranked")}
        primaryActionLabel="Find another match"
      />
    );
  }

  if (phase === "waiting_for_opponent" || phase === "countdown") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-kc-ink-muted">vs {opponentUsername}</p>
        {phase === "waiting_for_opponent" ? (
          <p className="font-display text-xl font-bold text-kc-ink">
            Waiting for opponent to connect…
          </p>
        ) : (
          <p
            key={countdownRemaining}
            className={`kc-float-up font-display text-7xl font-extrabold ${
              countdownRemaining === 0 ? "kc-pulse-glow text-kc-accent" : "text-kc-accent"
            }`}
          >
            {countdownRemaining || "Go"}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-xs text-kc-ink-muted">
        <span>vs {opponentUsername}</span>
        {phase === "waiting_for_result" && <span>Waiting for opponent to finish…</span>}
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-kc-surface-3">
        <div
          className="h-full rounded-full bg-kc-danger/70 transition-all duration-150"
          style={{ width: `${opponentProgress}%` }}
        />
      </div>
      <div className="w-full">
        <TimedTypingRace
          mode={mode}
          text={textContent}
          caretColor={caretColor}
          onProgress={handleProgress}
          onCheckpoint={handleCheckpoint}
          onComplete={handleComplete}
          disabled={phase === "waiting_for_result"}
          syncStartImmediately
        />
      </div>
    </div>
  );
}
