import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, Avatar, Badge } from "@keyclash/ui";
import { getRankTier } from "@keyclash/game-engine";
import { formatRelativeTime } from "@keyclash/shared";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  if (!profile) notFound();

  const { data: recentMatches } = await supabase
    .from("matches")
    .select("*")
    .or(`player_one_id.eq.${profile.id},player_two_id.eq.${profile.id}`)
    .order("created_at", { ascending: false })
    .limit(10);

  const tier = getRankTier(profile.rating);
  const winRate =
    profile.matches_played > 0
      ? Math.round((profile.matches_won / profile.matches_played) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center gap-4">
          <Avatar
            name={profile.display_name ?? profile.username}
            imageUrl={profile.avatar_url}
            size={64}
          />
          <div>
            <h1 className="font-display text-2xl font-bold text-kc-ink">{profile.username}</h1>
            <Badge variant="rank" style={{ color: tier.color }}>
              {tier.name} · {profile.rating} rating
            </Badge>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Level" value={profile.level} />
          <Stat label="Matches" value={profile.matches_played} />
          <Stat label="Win rate" value={`${winRate}%`} />
          <Stat label="Peak rating" value={profile.peak_rating} />
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent matches</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-kc-border p-0">
            {recentMatches?.map((m) => {
              const isPlayerOne = m.player_one_id === profile.id;
              const wpm = isPlayerOne ? m.player_one_wpm : m.player_two_wpm;
              const accuracy = isPlayerOne ? m.player_one_accuracy : m.player_two_accuracy;
              return (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-kc-ink capitalize">
                      {m.mode.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-kc-ink-muted">
                      {formatRelativeTime(new Date(m.created_at))}
                    </p>
                  </div>
                  <p className="font-mono text-sm text-kc-ink">
                    {wpm ?? "—"} wpm · {accuracy ?? "—"}%
                  </p>
                </div>
              );
            })}
            {(!recentMatches || recentMatches.length === 0) && (
              <p className="px-5 py-8 text-center text-sm text-kc-ink-muted">No matches yet.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-kc-border bg-kc-surface p-4 text-center">
      <p className="font-display text-xl font-bold text-kc-ink">{value}</p>
      <p className="mt-1 text-xs text-kc-ink-muted">{label}</p>
    </div>
  );
}
