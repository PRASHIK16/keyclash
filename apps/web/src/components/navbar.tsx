import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRankTier, calculateLevelFromXp } from "@keyclash/game-engine";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNavMenu } from "@/components/mobile-nav-menu";

const NAV_LINKS = [
  { href: "/play", label: "Play" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/daily", label: "Daily" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/settings", label: "Settings" },
];

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
    <header className="relative border-b border-kc-border bg-kc-surface">
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:px-6">
        <div className="flex items-center gap-2">
          <MobileNavMenu links={NAV_LINKS} />
          <Link href="/play" className="font-display text-lg font-bold text-kc-ink">
            Keyclash
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-kc-ink-muted md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-kc-ink">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          <Link href={`/profile/${profile.username}`} className="flex items-center gap-2 sm:gap-4">
            <div className="hidden flex-col items-end lg:flex">
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
            <span className="hidden rounded-md bg-kc-surface-2 px-2 py-1 text-xs font-bold text-kc-ink sm:inline-block">
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
