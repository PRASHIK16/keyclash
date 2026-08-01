import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, Avatar, Badge } from "@keyclash/ui";
import { getRankTier } from "@keyclash/game-engine";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirectTo=/leaderboard");

  const { data: topPlayers } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, rating, level, matches_played, matches_won")
    .order("rating", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-2xl font-bold text-kc-ink">Global Leaderboard</h1>
        <p className="mt-1 text-kc-ink-muted">Top 50 by rating, all-time.</p>

        <Card className="mt-8">
          <CardContent className="divide-y divide-kc-border p-0">
            {topPlayers?.map((player, i) => {
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
                    <span className="w-14 text-right font-mono text-sm text-kc-ink">
                      {player.rating}
                    </span>
                  </div>
                </Link>
              );
            })}
            {(!topPlayers || topPlayers.length === 0) && (
              <p className="px-5 py-8 text-center text-sm text-kc-ink-muted">
                No ranked matches played yet — leaderboard fills in as players compete.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
