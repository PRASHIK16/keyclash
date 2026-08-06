import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRankTier, calculateLevelFromXp } from "@keyclash/game-engine";
import { SignOutButton } from "@/components/sign-out-button";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, rating, xp, level, coins")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const tier = getRankTier(profile.rating);
  const { xpIntoLevel, xpForNextLevel } = calculateLevelFromXp(profile.xp);
  const xpProgressPct =
    xpForNextLevel > 0 ? Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100)) : 0;

  return (
    <header className="border-b border-kc-border bg-kc-surface">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/play" className="font-display text-lg font-bold text-kc-ink">
          Keyclash
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-kc-ink-muted">
          <Link href="/play" className="transition-colors hover:text-kc-ink">
            Play
          </Link>
          <Link href="/dashboard" className="transition-colors hover:text-kc-ink">
            Dashboard
          </Link>
          <Link href="/daily" className="transition-colors hover:text-kc-ink">
            Daily
          </Link>
          <Link href="/leaderboard" className="transition-colors hover:text-kc-ink">
            Leaderboard
          </Link>
          <Link href="/settings" className="transition-colors hover:text-kc-ink">
            Settings
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href={`/profile/${profile.username}`} className="flex items-center gap-4">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-xs font-semibold" style={{ color: tier.color }}>
                {tier.name} · {profile.rating}
              </span>
              <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-kc-surface-3">
                <div
                  className="h-full rounded-full bg-kc-accent transition-all duration-700"
                  style={{ width: `${xpProgressPct}%` }}
                />
              </div>
            </div>
            <span className="rounded-md bg-kc-surface-2 px-2 py-1 text-xs font-bold text-kc-ink">
              Lv.{profile.level}
            </span>
            <span className="text-sm font-bold text-kc-accent">{profile.coins}c</span>
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
