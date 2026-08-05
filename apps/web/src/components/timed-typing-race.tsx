"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  calculateWpm,
  calculateAccuracy,
  calculateRawWpm,
  calculateConsistency,
  compareWords,
} from "@keyclash/game-engine";
import type { FullRaceStats } from "@keyclash/game-engine";
import type { GameModeConfig } from "@keyclash/game-engine";
import type { Checkpoint } from "./typing-race";
import { useSettings } from "@/lib/use-settings";
import { FONT_SIZE_CLASSES } from "@keyclash/shared";
import { playKeystrokeSound } from "@/lib/keystroke-sound";

export interface TimedRaceResult extends FullRaceStats {
  checkpoints: Checkpoint[];
}

interface TimedTypingRaceProps {
  mode: GameModeConfig;
  text: string;
  caretColor?: string;
  onCheckpoint?: (checkpoint: Checkpoint) => void;
  onComplete: (result: TimedRaceResult) => void;
  onProgress?: (correctChars: number, totalChars: number) => void;
  disabled?: boolean;
  /**
   * When true, the race clock starts the instant this component mounts
   * rather than waiting for the first keystroke. Used by ranked mode: both
   * players' components mount at the same synced "Go" moment (driven by the
   * shared countdown in race-room.tsx), so starting on mount keeps both
   * timers aligned. Solo practice omits this — Monkeytype-style, the clock
   * starts on your first keystroke so idling beforehand doesn't cost you time.
   */
  syncStartImmediately?: boolean;
  /**
   * Fires when the user presses their configured restart shortcut
   * (Settings → Controls). Only wire this up for solo/practice contexts —
   * never pass it in ranked mode, where restarting mid-race would let a
   * player bail out of a losing position without consequence.
   */
  onRestartShortcut?: () => void;
}

const CHECKPOINT_INTERVAL_MS = 3000;
const WPM_SAMPLE_INTERVAL_MS = 1000;

export function TimedTypingRace({
  mode,
  text,
  caretColor = "#C6FF3D",
  onCheckpoint,
  onComplete,
  onProgress,
  disabled = false,
  syncStartImmediately = false,
  onRestartShortcut,
}: TimedTypingRaceProps) {
  const { settings } = useSettings();
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(
    syncStartImmediately ? Date.now() : null
  );
  const [finished, setFinished] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(mode.durationSeconds ?? 0);

  const inputRef = useRef<HTMLInputElement>(null);
  const checkpointsRef = useRef<Checkpoint[]>([]);
  const lastCheckpointAtRef = useRef(0);
  const wpmSamplesRef = useRef<number[]>([]);
  const totalKeystrokesRef = useRef(0);
  const mistakesRef = useRef(0);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [rowOfWord, setRowOfWord] = useState<number[]>([]);
  const [lineHeight, setLineHeight] = useState(44);

  const correctChars = countCorrectChars(text, input);
  const totalTyped = input.length;

  const finish = useCallback(() => {
    if (finished) return;
    const raceStart = startedAt ?? Date.now();
    const elapsedMs = Date.now() - raceStart;

    const wpm = calculateWpm(correctChars, elapsedMs);
    const rawWpm = calculateRawWpm(totalKeystrokesRef.current, elapsedMs);
    const accuracy = calculateAccuracy(correctChars, totalTyped);
    const { correctWords, incorrectWords } = compareWords(text, input);
    const consistency = calculateConsistency(wpmSamplesRef.current);
    const completionPct = Math.min(100, Math.round((totalTyped / text.length) * 100));

    const finalCheckpoint: Checkpoint = { correctChars, totalChars: totalTyped, elapsedMs };
    checkpointsRef.current.push(finalCheckpoint);
    onCheckpoint?.(finalCheckpoint);

    setFinished(true);
    onComplete({
      wpm,
      rawWpm,
      accuracy,
      correctWords,
      incorrectWords,
      totalKeystrokes: totalKeystrokesRef.current,
      correctKeystrokes: correctChars,
      mistakes: mistakesRef.current,
      consistency,
      completionPct,
      timePlayedMs: elapsedMs,
      checkpoints: checkpointsRef.current,
    });
  }, [finished, startedAt, correctChars, totalTyped, text, input, onComplete, onCheckpoint]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const shortcutKey = settings.restartShortcut === "tab" ? "Tab" : "Escape";
    const isConfiguredShortcut = e.key === shortcutKey;
    const isCtrlEnterShortcut = e.ctrlKey && e.key === "Enter";
    if ((isConfiguredShortcut || isCtrlEnterShortcut) && onRestartShortcut) {
      e.preventDefault();
      onRestartShortcut();
      return;
    }

    if (disabled || finished) return;
    const isCountedKey = e.key === "Backspace" || e.key === " " || e.key.length === 1;
    if (!isCountedKey) return;

    if (settings.soundEffects) playKeystrokeSound();

    totalKeystrokesRef.current += 1;

    if (e.key.length === 1) {
      const expectedChar = text[input.length];
      if (expectedChar !== undefined && e.key !== expectedChar) {
        mistakesRef.current += 1;
        // Expert/Master difficulty: a single mistake ends the race
        // immediately, same as Monkeytype's stop-on-error difficulties.
        if (settings.difficulty !== "normal" && startedAt) {
          setTimeout(finish, 0);
        }
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled || finished) return;
    const value = e.target.value;

    if (!startedAt && value.length > 0) {
      setStartedAt(Date.now());
    }

    setInput(value);
    onProgress?.(countCorrectChars(text, value), value.length);

    const finishesOnCompletion =
      mode.kind === "words" ||
      mode.kind === "quote" ||
      mode.kind === "numbers" ||
      mode.kind === "punctuation" ||
      mode.kind === "custom";
    if (finishesOnCompletion && value.length >= text.length) {
      setTimeout(finish, 0);
    }
  }

  function handleManualFinish() {
    if (mode.kind === "zen" && startedAt) finish();
  }

  // Time mode: hard countdown. Race ends the instant it hits zero,
  // regardless of what either player has typed — this is the fix for
  // "whoever finishes first ends the match for everyone."
  useEffect(() => {
    if (mode.kind !== "time" || finished || !startedAt) return;
    const durationMs = (mode.durationSeconds ?? 0) * 1000;

    const raf = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setTimeRemaining(remaining);
      if (elapsed >= durationMs) {
        finish();
      } else {
        requestAnimationFrame(raf);
      }
    };
    const frame = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(frame);
  }, [mode.kind, mode.durationSeconds, startedAt, finished, finish]);

  // Periodic checkpoint reporting (anti-cheat, ranked mode).
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

  // Live WPM ticker + periodic sampling for the consistency score.
  useEffect(() => {
    if (!startedAt || finished) return;
    const interval = setInterval(() => {
      const wpmNow = calculateWpm(correctChars, Date.now() - startedAt);
      setLiveWpm(wpmNow);
      wpmSamplesRef.current.push(wpmNow);
    }, WPM_SAMPLE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [startedAt, finished, correctChars]);

  const words = text.split(" ");
  const activeWordIndex = Math.max(0, input.split(" ").length - 1);

  // Word wrapping into rows depends only on container width and the word
  // list itself — not on typing progress — so this only needs to run once
  // per race (and on resize), not on every keystroke.
  useEffect(() => {
    function computeRows() {
      const rowTops: number[] = [];
      const rowIndexByWord: number[] = [];
      for (const el of wordRefs.current) {
        if (!el) {
          rowIndexByWord.push(0);
          continue;
        }
        const top = el.offsetTop;
        let rowIdx = rowTops.findIndex((t) => Math.abs(t - top) < 4);
        if (rowIdx === -1) {
          rowTops.push(top);
          rowIdx = rowTops.length - 1;
        }
        rowIndexByWord.push(rowIdx);
      }
      setRowOfWord(rowIndexByWord);
      if (rowTops.length > 1) {
        const first = rowTops[0];
        const second = rowTops[1];
        if (first !== undefined && second !== undefined) setLineHeight(second - first);
      }
    }
    // Two rAF ticks: one for layout to settle after the words render, one
    // safety pass in case fonts finished loading a frame late.
    requestAnimationFrame(() => requestAnimationFrame(computeRows));
    window.addEventListener("resize", computeRows);
    return () => window.removeEventListener("resize", computeRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const activeRow = rowOfWord[activeWordIndex] ?? 0;
  const scrollOffsetPx = activeRow * lineHeight;

  // Focus mode: fade page chrome (nav, etc.) while a race is actively in
  // progress. Toggling a body class rather than threading a prop through
  // every page that renders this component — the CSS lives in globals.css.
  useEffect(() => {
    if (!settings.focusMode) return;
    const active = Boolean(startedAt) && !finished;
    document.body.classList.toggle("kc-focus-mode", active);
    return () => {
      document.body.classList.remove("kc-focus-mode");
    };
  }, [settings.focusMode, startedAt, finished]);

  const progressPct = Math.min(100, Math.round((totalTyped / text.length) * 100));

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-3 flex items-center justify-between font-mono text-sm text-kc-ink-muted">
        <div className="flex items-center gap-4">
          {settings.liveWpm && (
            <span>
              <span className="text-kc-accent font-bold">{Math.round(liveWpm)}</span> wpm
            </span>
          )}
          {settings.liveAccuracy && (
            <span>
              <span className="text-kc-ink font-semibold">
                {totalTyped > 0 ? calculateAccuracy(correctChars, totalTyped) : 100}
              </span>
              % acc
            </span>
          )}
        </div>
        {mode.kind === "time" ? (
          <span className="font-bold text-kc-ink">{timeRemaining}s</span>
        ) : (
          <span className="text-xs">{progressPct}%</span>
        )}
      </div>

      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-kc-surface-3">
        <div
          className="h-full rounded-full bg-kc-accent transition-all duration-150"
          style={{
            width:
              mode.kind === "time"
                ? `${100 - (timeRemaining / (mode.durationSeconds || 1)) * 100}%`
                : `${progressPct}%`,
          }}
        />
      </div>

      <div
        className={`relative cursor-text overflow-hidden rounded-xl border p-7 font-mono ${FONT_SIZE_CLASSES[settings.fontSize]} leading-relaxed tracking-wide transition-shadow duration-300 ${
          startedAt && !finished
            ? "border-kc-accent shadow-[0_0_0_1px_var(--kc-accent),0_0_32px_-8px_var(--kc-accent)]"
            : "border-kc-border"
        } bg-kc-surface`}
        style={{ height: lineHeight * 3 }}
        onClick={() => inputRef.current?.focus()}
      >
        <div
          className="flex flex-wrap gap-x-[1ch] gap-y-2 transition-transform duration-200 ease-out"
          style={{ transform: `translateY(-${scrollOffsetPx}px)` }}
        >
          {(() => {
            let globalIndex = 0;
            return words.map((word, wIdx) => {
              const wordStartIndex = globalIndex;
              const isActiveWord = wIdx === activeWordIndex;
              const chars = word.split("").map((char, ci) => {
                const idx = wordStartIndex + ci;
                const typedChar = input[idx];
                let className = "text-kc-ink-muted";
                if (typedChar !== undefined) {
                  className = settings.blindMode
                    ? "text-kc-ink"
                    : typedChar === char
                      ? "text-kc-ink"
                      : "text-kc-danger bg-kc-danger/10";
                }
                const isCaret = idx === input.length;
                return (
                  <span key={ci} className="relative">
                    {isCaret && <Caret style={settings.caretStyle} color={caretColor} />}
                    <span className={className}>{char}</span>
                  </span>
                );
              });
              const isWordStartCaret = wordStartIndex === input.length;
              globalIndex += word.length + 1;
              return (
                <span
                  key={wIdx}
                  ref={(el) => {
                    wordRefs.current[wIdx] = el;
                  }}
                  className={`relative inline-block rounded px-0.5 transition-colors ${
                    isActiveWord ? "bg-kc-accent/15" : ""
                  }`}
                >
                  {isWordStartCaret && <Caret style={settings.caretStyle} color={caretColor} />}
                  {chars}
                </span>
              );
            });
          })()}
        </div>
        <input
          ref={inputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || finished}
          autoFocus
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>

      {mode.kind === "zen" && !finished && (
        <button
          onClick={handleManualFinish}
          className="mt-4 rounded-lg border border-kc-border bg-kc-surface-2 px-4 py-2 text-sm font-medium text-kc-ink hover:bg-kc-surface-3"
        >
          Finish
        </button>
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

function Caret({ style, color }: { style: "line" | "block" | "underline"; color: string }) {
  if (style === "block") {
    return (
      <span
        className="kc-caret absolute left-0 top-0 h-[1.2em] w-[1ch] rounded-sm opacity-30"
        style={{ backgroundColor: color }}
      />
    );
  }
  if (style === "underline") {
    return (
      <span
        className="kc-caret absolute bottom-0 left-0 h-[2px] w-[1ch]"
        style={{ backgroundColor: color }}
      />
    );
  }
  return (
    <span
      className="kc-caret absolute -left-0.5 top-0 h-[1.2em] w-[2px]"
      style={{ backgroundColor: color }}
    />
  );
}
