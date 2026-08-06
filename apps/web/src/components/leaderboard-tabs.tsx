"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, Avatar, Badge } from "@keyclash/ui";
import { getRankTier } from "@keyclash/game-engine";
import { SkeletonList } from "@/components/skeleton";

interface Entry {
  id?: string;
  username: string;
  display_name?: string | null;
  avatar_url: string | null;
  rating: number;
  periodDelta?: number;
}

type Tab = "global" | "weekly" | "monthly" | "friends";

export function LeaderboardTabs({ global, friends }: { global: Entry[]; friends: Entry[] }) {
  const [tab, setTab] = useState<Tab>("global");
  const [periodEntries, setPeriodEntries] = useState<Entry[]>([]);
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [search, setSearch] = useState("");

  async function selectTab(next: Tab) {
    setTab(next);
    if ((next === "weekly" || next === "monthly") && periodEntries.length === 0) {
      setLoadingPeriod(true);
      try {
        const res = await fetch(`/api/leaderboard/period?range=${next}`);
        const data = await res.json();
        setPeriodEntries(data.entries ?? []);
      } finally {
        setLoadingPeriod(false);
      }
    }
  }

  const activeList = tab === "global" ? global : tab === "friends" ? friends : periodEntries;
  const filtered = search.trim()
    ? activeList.filter((e) => e.username.toLowerCase().includes(search.trim().toLowerCase()))
    : activeList;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-kc-border bg-kc-surface p-1">
          {(["global", "weekly", "monthly", "friends"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => selectTab(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                tab === t ? "bg-kc-accent text-black" : "text-kc-ink-muted hover:text-kc-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username…"
          className="rounded-lg border border-kc-border bg-kc-surface-2 px-3 py-1.5 text-sm text-kc-ink outline-none focus:border-kc-accent"
        />
      </div>

      <Card className="mt-4">
        <CardContent className="divide-y divide-kc-border p-0">
          {loadingPeriod && <SkeletonList rows={5} />}
          {!loadingPeriod &&
            filtered.map((player, i) => {
              const tier = getRankTier(player.rating);
              return (
                <Link
                  key={player.username}
                  href={`/profile/${player.username}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-kc-surface-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-sm font-mono text-kc-ink-muted">{i + 1}</span>
                    <Avatar
                      name={player.display_name ?? player.username}
                      imageUrl={player.avatar_url}
                      size={28}
                    />
                    <span className="text-sm font-medium text-kc-ink">{player.username}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="rank" style={{ color: tier.color }}>
                      {tier.name}
                    </Badge>
                    {player.periodDelta !== undefined ? (
                      <span
                        className={`w-16 text-right font-mono text-sm ${player.periodDelta >= 0 ? "text-emerald-400" : "text-kc-danger"}`}
                      >
                        {player.periodDelta >= 0 ? "+" : ""}
                        {player.periodDelta}
                      </span>
                    ) : (
                      <span className="w-16 text-right font-mono text-sm text-kc-ink">
                        {player.rating}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          {!loadingPeriod && filtered.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-kc-ink-muted">
              {tab === "friends"
                ? "No friends yet — add some from a player's profile."
                : "No entries yet."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
