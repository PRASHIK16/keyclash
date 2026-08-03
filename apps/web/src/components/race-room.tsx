"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TypingRace, type TypingRaceResult, type Checkpoint } from "@/components/typing-race";
import { ClashBurst } from "@/components/clash-burst";
import { AnimatedNumber } from "@/components/animated-number";
import { Button, Card, CardContent } from "@keyclash/ui";

interface RaceRoomProps {
  matchId: string;
  textContent: string;
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
  winnerId: string | null;
  playerOneRatingDelta: number;
  playerTwoRatingDelta: number;
}

const COUNTDOWN_MS = 3000;

export function RaceRoom({
  matchId,
  textContent,
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
        const count = Object.keys(state).length;
        setOpponentPresent(count >= 2);
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
        if (payload.senderId !== userId) {
          attemptSubmit();
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, userId]);

  // Player one is the deterministic countdown authority — once both sides
  // are present, they broadcast a shared start timestamp 3 seconds out AND
  // begin their own local countdown directly. IMPORTANT: Supabase does not
  // echo a broadcast back to the client that sent it by default, so relying
  // on "receive my own countdown broadcast" would leave player one stuck —
  // same bug class as the lobby pairing fix. Calling beginCountdown()
  // directly here (in addition to broadcasting for player two) closes that
  // gap; both sides still start from the exact same startAt timestamp, so
  // the race remains genuinely simultaneous regardless of latency.
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

  async function handleComplete(_raceResult: TypingRaceResult) {
    setPhase("waiting_for_result");
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
      if (res.status === 202) {
        // Opponent hasn't finished yet — this client will get another
        // chance via the "finished" broadcast handler above, or the next
        // poll if we add one later. For now, silently wait.
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setPhase("done");
      }
    } catch {
      // Network hiccup — the other client's "finished" broadcast (or this
      // one, retried) will trigger another attempt.
    }
  }

  if (phase === "done" && result) {
    const won = result.winnerId === userId;
    const isDraw = result.winnerId === null;
    const myDelta = isPlayerOne ? result.playerOneRatingDelta : result.playerTwoRatingDelta;
    const myWpm = isPlayerOne ? result.playerOneWpm : result.playerTwoWpm;

    return (
      <Card className="kc-float-up mx-auto max-w-md overflow-hidden text-center">
        <CardContent className="space-y-3 py-10">
          <ClashBurst />
          <p className="font-display text-2xl font-extrabold text-kc-ink">
            {isDraw ? "Draw" : won ? "Victory" : "Defeat"}
          </p>
          <p className="font-display text-5xl font-extrabold text-kc-accent">
            <AnimatedNumber value={Math.round(myWpm)} />
            <span className="ml-2 text-lg font-medium text-kc-ink-muted">wpm</span>
          </p>
          <p
            className={`text-lg font-bold ${myDelta >= 0 ? "text-emerald-400" : "text-kc-danger"}`}
          >
            {myDelta >= 0 ? "+" : ""}
            {myDelta} rating
          </p>
          <Button onClick={() => router.push("/play/ranked")} className="w-full">
            Find another match
          </Button>
        </CardContent>
      </Card>
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
          <p className="font-display text-7xl font-extrabold text-kc-accent">
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
        {phase === "waiting_for_result" && <span>Waiting for result…</span>}
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-kc-surface-3">
        <div
          className="h-full rounded-full bg-kc-danger/70 transition-all duration-150"
          style={{ width: `${opponentProgress}%` }}
        />
      </div>
      <div className="flex justify-center">
        <TypingRace
          text={textContent}
          caretColor={caretColor}
          onProgress={handleProgress}
          onCheckpoint={handleCheckpoint}
          onComplete={handleComplete}
          disabled={phase === "waiting_for_result"}
        />
      </div>
    </div>
  );
}
