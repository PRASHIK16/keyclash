import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRankTier } from "@keyclash/game-engine";
import { Badge } from "@keyclash/ui";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, rating, level, coins")
    .eq("id", user.id)
    .single();

  const tier = profile ? getRankTier(profile.rating) : null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-kc-border bg-kc-surface px-6">
      <Link href="/play" className="font-display text-lg font-bold text-kc-ink">
        Keyclash
      </Link>
      <nav className="flex items-center gap-6 text-sm font-medium text-kc-ink-muted">
        <Link href="/play" className="hover:text-kc-ink">
          Play
        </Link>
        <Link href="/daily" className="hover:text-kc-ink">
          Daily
        </Link>
        <Link href="/leaderboard" className="hover:text-kc-ink">
          Leaderboard
        </Link>
      </nav>
      {profile && (
        <Link href={`/profile/${profile.username}`} className="flex items-center gap-3">
          {tier && (
            <Badge variant="rank" style={{ color: tier.color }}>
              {tier.name} · {profile.rating}
            </Badge>
          )}
          <span className="text-sm text-kc-ink-muted">Lv.{profile.level}</span>
          <span className="text-sm font-medium text-kc-accent">{profile.coins}c</span>
        </Link>
      )}
    </header>
  );
}
