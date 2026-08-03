"use client";

import { AnimatedNumber } from "./animated-number";
import { ClashBurst } from "./clash-burst";
import { Card, CardContent, Button } from "@keyclash/ui";

export interface ResultsScreenStats {
  wpm: number;
  rawWpm?: number;
  accuracy: number;
  correctWords?: number;
  incorrectWords?: number;
  totalKeystrokes?: number;
  correctKeystrokes?: number;
  mistakes?: number;
  consistency?: number;
  completionPct?: number;
  timePlayedMs?: number;
  xpAwarded?: number;
  coinsAwarded?: number;
}

export interface RankedContext {
  outcome: "win" | "loss" | "draw";
  ratingDelta: number;
  opponentUsername: string;
  opponentWpm: number;
}

export function ResultsScreen({
  stats,
  ranked,
  onPrimaryAction,
  primaryActionLabel = "Race again",
}: {
  stats: ResultsScreenStats;
  ranked?: RankedContext;
  onPrimaryAction: () => void;
  primaryActionLabel?: string;
}) {
  const accentColor = ranked
    ? ranked.outcome === "win"
      ? "text-emerald-400"
      : ranked.outcome === "loss"
        ? "text-kc-danger"
        : "text-kc-ink-muted"
    : "text-kc-accent";

  return (
    <Card className="kc-float-up mx-auto max-w-lg overflow-hidden text-center">
      <CardContent className="space-y-5 py-10">
        <ClashBurst />

        {ranked && (
          <p className="font-display text-2xl font-extrabold text-kc-ink">
            {ranked.outcome === "win" ? "Victory" : ranked.outcome === "loss" ? "Defeat" : "Draw"}
          </p>
        )}

        <div>
          <p className={`font-display text-5xl font-extrabold ${accentColor}`}>
            <AnimatedNumber value={Math.round(stats.wpm)} />
            <span className="ml-2 text-lg font-medium text-kc-ink-muted">wpm</span>
          </p>
          {ranked && (
            <p
              className={`mt-1 text-lg font-bold ${ranked.ratingDelta >= 0 ? "text-emerald-400" : "text-kc-danger"}`}
            >
              {ranked.ratingDelta >= 0 ? "+" : ""}
              {ranked.ratingDelta} rating
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-left sm:grid-cols-4">
          <Stat label="Raw WPM" value={stats.rawWpm} />
          <Stat label="Accuracy" value={stats.accuracy} suffix="%" />
          <Stat label="Consistency" value={stats.consistency} suffix="%" />
          <Stat label="Completion" value={stats.completionPct} suffix="%" />
          <Stat label="Correct words" value={stats.correctWords} />
          <Stat label="Wrong words" value={stats.incorrectWords} />
          <Stat label="Keystrokes" value={stats.totalKeystrokes} />
          <Stat label="Mistakes" value={stats.mistakes} />
        </div>

        {(stats.xpAwarded !== undefined || stats.coinsAwarded !== undefined) && (
          <p className="text-sm font-semibold text-kc-ink">
            {stats.xpAwarded !== undefined && `+${stats.xpAwarded} XP`}
            {stats.xpAwarded !== undefined && stats.coinsAwarded !== undefined && " · "}
            {stats.coinsAwarded !== undefined && `+${stats.coinsAwarded} coins`}
          </p>
        )}

        {ranked && (
          <p className="text-xs text-kc-ink-muted">
            {ranked.opponentUsername} raced at {Math.round(ranked.opponentWpm)} wpm
          </p>
        )}

        <Button onClick={onPrimaryAction} className="w-full">
          {primaryActionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number | undefined;
  suffix?: string;
}) {
  if (value === undefined) return null;
  return (
    <div>
      <p className="font-mono text-sm font-bold text-kc-ink">
        {value}
        {suffix}
      </p>
      <p className="text-[11px] text-kc-ink-muted">{label}</p>
    </div>
  );
}
