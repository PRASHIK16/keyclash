import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { LeaderboardTabs } from "@/components/leaderboard-tabs";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirectTo=/leaderboard");

  const { data: topPlayers } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, rating")
    .order("rating", { ascending: false })
    .limit(50);

  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  const { data: friendProfiles } =
    friendIds.length > 0
      ? await supabase
          .from("profiles")
          .select("username, display_name, avatar_url, rating")
          .in("id", friendIds)
          .order("rating", { ascending: false })
      : { data: [] };

  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-2xl font-bold text-kc-ink">Leaderboard</h1>
        <p className="mt-1 text-kc-ink-muted">Global, weekly, monthly, and friends rankings.</p>
        <div className="mt-8">
          <LeaderboardTabs global={topPlayers ?? []} friends={friendProfiles ?? []} />
        </div>
      </main>
    </div>
  );
}
