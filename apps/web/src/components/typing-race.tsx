"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { calculateWpm, calculateAccuracy } from "@keyclash/game-engine";

export interface Checkpoint {
  correctChars: number;
  totalChars: number;
  elapsedMs: number;
}

export interface TypingRaceResult {
  wpm: number;
  accuracy: number;
  elapsedMs: number;
  checkpoints: Checkpoint[];
}

interface TypingRaceProps {
  text: string;
  caretColor?: string;
  onCheckpoint?: (checkpoint: Checkpoint) => void;
  onComplete: (result: TypingRaceResult) => void;
  /** Live progress callback — used by ranked mode to broadcast to the opponent. */
  onProgress?: (correctChars: number, totalChars: number) => void;
  disabled?: boolean;
}

const CHECKPOINT_INTERVAL_MS = 3000;

export function TypingRace({
  text,
  caretColor = "#C6FF3D",
  onCheckpoint,
  onComplete,
  onProgress,
  disabled = false,
}: TypingRaceProps) {
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const checkpointsRef = useRef<Checkpoint[]>([]);
  const lastCheckpointAtRef = useRef<number>(0);

  const correctChars = countCorrectChars(text, input);
  const totalTyped = input.length;

  const finish = useCallback(() => {
    if (!startedAt || finished) return;
    const elapsedMs = Date.now() - startedAt;
    const wpm = calculateWpm(correctChars, elapsedMs);
    const accuracy = calculateAccuracy(correctChars, totalTyped);
    setFinished(true);
    onComplete({ wpm, accuracy, elapsedMs, checkpoints: checkpointsRef.current });
  }, [startedAt, finished, correctChars, totalTyped, onComplete]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled || finished) return;
    const value = e.target.value;

    if (!startedAt && value.length > 0) {
      setStartedAt(Date.now());
    }

    setInput(value);
    onProgress?.(countCorrectChars(text, value), value.length);

    if (value.length >= text.length) {
      // Defer to state update flushing, then finish.
      setTimeout(finish, 0);
    }
  }

  // Periodic checkpoint reporting while typing is in progress.
  useEffect(() => {
    if (!startedAt || finished) return;
    const now = Date.now();
    if (now - lastCheckpointAtRef.current < CHECKPOINT_INTERVAL_MS) return;
    lastCheckpointAtRef.current = now;

    const checkpoint: Checkpoint = {
      correctChars,
      totalChars: totalTyped,
      elapsedMs: now - startedAt,
    };
    checkpointsRef.current.push(checkpoint);
    onCheckpoint?.(checkpoint);
  }, [input, startedAt, finished, correctChars, totalTyped, onCheckpoint]);

  // Live WPM ticker for the on-screen counter.
  useEffect(() => {
    if (!startedAt || finished) return;
    const interval = setInterval(() => {
      setLiveWpm(calculateWpm(correctChars, Date.now() - startedAt));
    }, 500);
    return () => clearInterval(interval);
  }, [startedAt, finished, correctChars]);

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-3 flex items-center gap-4 font-mono text-sm text-kc-ink-muted">
        <span>
          <span className="text-kc-accent font-semibold">{Math.round(liveWpm)}</span> wpm
        </span>
        <span>
          <span className="text-kc-ink font-semibold">
            {totalTyped > 0 ? calculateAccuracy(correctChars, totalTyped) : 100}
          </span>
          % acc
        </span>
      </div>

      <div
        className="relative cursor-text rounded-xl border border-kc-border bg-kc-surface p-6 font-mono text-lg leading-relaxed tracking-wide"
        onClick={() => inputRef.current?.focus()}
      >
        {text.split("").map((char, i) => {
          const typedChar = input[i];
          let className = "text-kc-ink-muted";
          if (typedChar !== undefined) {
            className = typedChar === char ? "text-kc-ink" : "text-kc-danger bg-kc-danger/10";
          }
          const isCaret = i === input.length;
          return (
            <span
              key={i}
              className={className}
              style={isCaret ? { borderLeft: `2px solid ${caretColor}` } : undefined}
            >
              {char}
            </span>
          );
        })}
        <input
          ref={inputRef}
          value={input}
          onChange={handleChange}
          disabled={disabled || finished}
          autoFocus
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
      {finished && (
        <p className="mt-4 font-mono text-sm text-kc-ink-muted">
          Result locked in — {Math.round(liveWpm)} wpm.
        </p>
      )}
    </div>
  );
}

function countCorrectChars(target: string, typed: string): number {
  let count = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) count++;
  }
  return count;
}
