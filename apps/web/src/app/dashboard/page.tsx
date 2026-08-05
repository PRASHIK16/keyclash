import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { WpmGraph } from "@/components/wpm-graph";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@keyclash/ui";
import { Flame } from "lucide-react";

interface Achievement {
  id: string;
  label: string;
  unlocked: boolean;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirectTo=/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/play");

  const { data: recentMatches } = await supabase
    .from("matches")
    .select("player_one_id, player_one_wpm, player_two_id, player_two_wpm, created_at")
    .or(`player_one_id.eq.${user.id},player_two_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(20);

  const wpmSeries = (recentMatches ?? [])
    .map((m) => (m.player_one_id === user.id ? m.player_one_wpm : m.player_two_wpm))
    .filter((v): v is number => v !== null)
    .reverse();

  const avgWpm = wpmSeries.length
    ? Math.round(wpmSeries.reduce((a, b) => a + b, 0) / wpmSeries.length)
    : 0;
  const highestWpm = wpmSeries.length ? Math.round(Math.max(...wpmSeries)) : 0;

  const achievements: Achievement[] = [
    { id: "first_race", label: "First Race", unlocked: profile.matches_played >= 1 },
    { id: "ten_races", label: "10 Races Completed", unlocked: profile.matches_played >= 10 },
    { id: "hundred_club", label: "100 WPM Club", unlocked: highestWpm >= 100 },
    { id: "week_streak", label: "7 Day Streak", unlocked: profile.longest_streak >= 7 },
    { id: "silver_rank", label: "Reached Silver", unlocked: profile.peak_rating >= 1000 },
    { id: "first_win", label: "First Ranked Win", unlocked: profile.matches_won >= 1 },
  ];

  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-2xl font-bold text-kc-ink">Dashboard</h1>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Average WPM" value={avgWpm} />
          <Stat label="Highest WPM" value={highestWpm} />
          <Stat label="Total races" value={profile.matches_played} />
          <Stat
            label="Streak"
            value={
              <span className="flex items-center justify-center gap-1">
                <Flame size={16} className="text-amber-400" />
                {profile.current_streak}
              </span>
            }
          />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>WPM trend (last {wpmSeries.length} races)</CardTitle>
          </CardHeader>
          <CardContent>
            <WpmGraph values={wpmSeries} />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`rounded-lg border px-3 py-3 text-center text-sm ${
                  a.unlocked
                    ? "border-kc-accent bg-kc-accent/10 text-kc-ink"
                    : "border-kc-border text-kc-ink-muted"
                }`}
              >
                {a.label}
                {a.unlocked && (
                  <Badge variant="success" className="ml-2">
                    ✓
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-kc-border bg-kc-surface p-4 text-center">
      <p className="font-display text-xl font-bold text-kc-ink">{value}</p>
      <p className="mt-1 text-xs text-kc-ink-muted">{label}</p>
    </div>
  );
}
